from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from app.utils.config import settings
from pinecone import Pinecone
from app.utils.config import supabase
import re
import openai
import requests

# Initialize Pinecone client and index
pc = Pinecone(api_key=settings.pinecone_api_key)
index = pc.Index(settings.pinecone_index)

# LangChain Pinecone wrapper
embedder = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
lc_pinecone = PineconeVectorStore(index, embedder)

# Helper: Extract email address from text
EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"

def extract_email_and_content(text):
    match = re.search(EMAIL_REGEX, text)
    if not match:
        return None, text
    email = match.group(0)
    content = text.replace(email, "").strip()
    return email, content

# Helper: LLM reformat prompt
REFORMAT_PROMPT = (
    "You are an assistant that helps write professional, friendly emails. "
    "Given the following message, extract the email address (if present), "
    "remove it from the message, and reformat the content in a professional but casual tone. "
    "Reply with a JSON object: { 'email': <email>, 'content': <reformatted_content> }. "
    "If no email is found, set 'email' to null."
)

def assign_agent_task(details: dict) -> dict:
    print(f"[AGENT] Assigning agent task with details: {details}")
    agent_id = details.get("agent_id")
    user_input = details.get("input")
    if not agent_id or not user_input:
        print("[AGENT] Missing agent_id or input.")
        raise Exception("Missing agent_id or input.")
    # For Email Agent (id or name check)
    if agent_id == 1 or details.get("agent_name") == "Email Agent":
        print(f"[EMAIL AGENT] Step 1: Extracting email and content from input: {user_input}")
        email, content = extract_email_and_content(user_input)
        print(f"[EMAIL AGENT] Extracted email: {email}, content: {content}")
        if not email or not content:
            print("[EMAIL AGENT] No valid email address or content found.")
            return {"status": "failed", "error": "No valid email address or content found."}
        # Step 2: LLM reformat
        llm_input = f"{REFORMAT_PROMPT}\nMessage: {user_input}"
        print(f"[EMAIL AGENT] Step 2: Calling LLM to reformat email content.")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": REFORMAT_PROMPT}, {"role": "user", "content": user_input}],
            max_tokens=256,
            temperature=0.7,
        )
        try:
            llm_json = response["choices"][0]["message"]["content"]
            print(f"[EMAIL AGENT] LLM raw output: {llm_json}")
            import json
            llm_data = json.loads(llm_json)
            email = llm_data.get("email")
            content = llm_data.get("content")
            print(f"[EMAIL AGENT] LLM extracted email: {email}, reformatted content: {content}")
        except Exception as e:
            print(f"[EMAIL AGENT] LLM output error: {e}")
            return {"status": "failed", "error": f"LLM output error: {e}"}
        if not email or not content:
            print("[EMAIL AGENT] LLM could not extract email or content.")
            return {"status": "failed", "error": "LLM could not extract email or content."}
        # Step 3: Wrap with greeting and closing
        preview = f"Hi,\n\n    {content}\n\nThanks, Kieran."
        print(f"[EMAIL AGENT] Step 3: Created preview email: {preview}")
        # Return preview and email address to frontend for confirmation
        return {"status": "preview", "preview": preview, "email": email}
    # Fallback for other agents
    if not isinstance(details, dict):
        print("[AGENT] Invalid details type for assign_agent_task.")
        raise Exception("Task details must be a dictionary.")
    try:
        print(f"[AGENT] Assigning fallback agent task.")
        response = supabase.table("tasks").insert({"details": details, "status": "Assigned"}).execute()
        print(f"[AGENT] Supabase insert response: {response}")
        error = getattr(response, 'error', None)
        data = getattr(response, 'data', None)
        if error:
            print(f"[AGENT] Error inserting agent task: {error}")
            raise Exception(str(error))
        if data is None or not isinstance(data, list) or not data:
            print(f"[AGENT] No data returned from Supabase after insert. Data: {data}")
            raise Exception("No data returned from Supabase after insert.")
        task_id = data[0].get("id")
        if task_id is None:
            print(f"[AGENT] No task_id in Supabase insert response: {data}")
            raise Exception("No task_id returned from Supabase.")
        return {"task_id": task_id, "status": "Assigned"}
    except Exception as e:
        print(f"[AGENT] Exception in assign_agent_task: {e}")
        raise

# New function to send the email after confirmation
def send_email_agent(email: str, content: str, agent_id: int, user_input: str) -> dict:
    print(f"[EMAIL AGENT] Sending confirmed email to {email} with content: {content}")
    outlook_url = "https://graph.microsoft.com/v1.0/me/sendMail"
    headers = {
        "Authorization": f"Bearer {settings.outlook_access_token}",
        "Content-Type": "application/json"
    }
    mail_data = {
        "message": {
            "subject": "[Productivity App] New Email",
            "body": {"contentType": "Text", "content": content},
            "toRecipients": [{"emailAddress": {"address": email}}]
        }
    }
    send_resp = requests.post(outlook_url, headers=headers, json=mail_data)
    print(f"[EMAIL AGENT] Outlook API response: {send_resp.status_code} {send_resp.text}")
    if send_resp.status_code != 202:
        print(f"[EMAIL AGENT] Outlook API error: {send_resp.text}")
        return {"status": "failed", "error": f"Outlook API error: {send_resp.text}"}
    # Store task in Supabase
    print(f"[EMAIL AGENT] Storing sent email task in Supabase.")
    response = supabase.table("agent_tasks").insert({
        "agent_id": agent_id,
        "input": user_input,
        "output": content,
        "status": "completed"
    }).execute()
    data = getattr(response, 'data', None)
    task_id = data[0].get("id") if data and isinstance(data, list) and data else None
    print(f"[EMAIL AGENT] Task stored in Supabase with id: {task_id}")
    return {"task_id": task_id, "status": "completed"}

def get_task_status(task_id: int) -> dict:
    print(f"Getting status for task_id: {task_id}")
    if not isinstance(task_id, int):
        print("Invalid task_id type for get_task_status.")
        raise Exception("Task ID must be an integer.")
    try:
        response = supabase.table("agent_tasks").select("status, input, output, error, created_at, started_at, completed_at").eq("id", task_id).single().execute()
        print(f"Supabase select response: {response}")
        error = getattr(response, 'error', None)
        data = getattr(response, 'data', None)
        if error:
            print(f"Error fetching task status: {error}")
            raise Exception(str(error))
        data = getattr(response, 'data', None)
        if data:
            return data
        return {"status": "Not found"}
    except Exception as e:
        print(f"Exception in get_task_status: {e}")
        raise

def query_agent(query: str, top_k: int = 5):
    print(f"[QUERY_AGENT] Called with query: {query}, top_k: {top_k}")
    if not isinstance(query, str) or not query.strip():
        print("[QUERY_AGENT] Invalid query for query_agent.")
        raise Exception("Query must be a non-empty string.")
    try:
        print("[QUERY_AGENT] About to call lc_pinecone.similarity_search")
        results = lc_pinecone.similarity_search(query, k=top_k)
        print(f"[QUERY_AGENT] Pinecone similarity search returned {len(results)} results: {results}")
        filtered = [r for r in results if 'to-do list' not in r.page_content.lower()]
        formatted = [{
            "text": r.page_content.strip(),
            "source": r.metadata.get("file_path", "Unknown")
        } for r in filtered]
        print(f"[QUERY_AGENT] Formatted results: {formatted}")
        return formatted
    except Exception as e:
        import traceback
        print(f"[QUERY_AGENT] Exception in query_agent: {e}")
        traceback.print_exc()
        raise
