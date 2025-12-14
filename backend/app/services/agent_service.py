from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangChainPinecone
from app.utils.config import settings
from pinecone import Pinecone as PineconeClient
from app.utils.config import supabase
from app.utils.agent_constants import (
    EMAIL_AGENT_ID, QUEST_AGENT_ID, QUERY_AGENT_ID, IDEAS_AGENT_ID, QUOTE_AGENT_ID,
    EMAIL_AGENT_NAME, QUEST_AGENT_NAME, QUERY_AGENT_NAME, IDEAS_AGENT_NAME, QUOTE_AGENT_NAME,
    is_email_agent, is_quest_agent, is_query_agent, is_ideas_agent, is_quote_agent
)
from app.services.gmail_service import send_gmail_message
import re
import openai
import requests
import asyncio
from openai import AsyncOpenAI
from app.utils.datetime_utils import convert_datetime_to_string

# Initialize Pinecone client and index
pc = PineconeClient(api_key=settings.pinecone_api_key)
index = pc.Index(settings.pinecone_index)

# LangChain Pinecone wrapper
try:
    embedder = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
    lc_pinecone = LangChainPinecone.from_existing_index(
        settings.pinecone_index, 
        embedder
    )
    print("Pinecone LangChain wrapper initialized successfully")
except Exception as e:
    print(f"Warning: Pinecone LangChain wrapper initialization failed: {e}")
    print("Agent functionality will be limited")
    lc_pinecone = None

# Helper: Extract email address from text
EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"

def extract_email_and_content(text):
    match = re.search(EMAIL_REGEX, text)
    if not match:
        return None, text
    email = match.group(0)
    content = text.replace(email, "").strip()
    return email, content

# Helper: LLM reformat prompt with tone support
TONE_PROMPTS = {
    1: "very casual and informal, like texting a friend - use simple language, contractions, and casual expressions",
    2: "friendly and relaxed, like emailing a colleague - warm but not too formal, use contractions",
    3: "professional but approachable - balanced tone, clear but friendly",
    4: "formal and business-like - professional language, proper structure, no contractions",
    5: "highly formal and respectful, for important clients - very formal language, proper business etiquette"
}

def get_reformat_prompt(tone_level: int = 3):
    base_prompt = (
        "You are an assistant that helps write emails with appropriate tone. "
        "Given the following message, extract the email address (if present), "
        "remove it from the message, and reformat the content in the specified tone. "
        "Do NOT include any greeting (such as 'Hi', 'Hello', 'Hi there', etc.) or closing (such as 'Thanks', 'Best', etc.) in your response. "
        "Reply with a JSON object: { 'email': <email>, 'content': <reformatted_content> }. "
        "If no email is found, set 'email' to null. "
        f"Tone level {tone_level}: {TONE_PROMPTS.get(tone_level, TONE_PROMPTS[3])}"
    )
    return base_prompt

def get_email_template(tone_level: int = 3):
    """Get email template based on tone level"""
    templates = {
        1: "Hey,\n\n{content}\n\nThanks!",
        2: "Hi there,\n\n{content}\n\nThanks!",
        3: "Hi,\n\n{content}\n\nThanks, Kieran.",
        4: "Hello,\n\n{content}\n\nBest regards,\nKieran",
        5: "Dear {recipient_name},\n\n{content}\n\nSincerely,\nKieran"
    }
    return templates.get(tone_level, templates[3])

def generate_email_subject(content: str, tone_level: int = 3) -> str:
    """Generate email subject based on content"""
    try:
        # Simple keyword-based subject generation
        content_lower = content.lower()
        
        # Common email purposes - more comprehensive detection
        if any(word in content_lower for word in ['meet', 'meeting', 'schedule', 'appointment', 'coffee', 'lunch', 'dinner', 'call', 'conference']):
            return "Meeting Request"
        elif any(word in content_lower for word in ['follow up', 'follow-up', 'check in', 'check-in', 'touch base', 'catch up']):
            return "Follow Up"
        elif any(word in content_lower for word in ['thank', 'thanks', 'appreciate', 'grateful', 'appreciation']):
            return "Thank You"
        elif any(word in content_lower for word in ['question', 'ask', 'inquiry', 'wonder', 'curious', 'help']):
            return "Question"
        elif any(word in content_lower for word in ['update', 'status', 'progress', 'report', 'news']):
            return "Update"
        elif any(word in content_lower for word in ['proposal', 'suggestion', 'idea', 'recommend', 'advice']):
            return "Proposal"
        elif any(word in content_lower for word in ['invite', 'invitation', 'join', 'attend', 'participate']):
            return "Invitation"
        elif any(word in content_lower for word in ['confirm', 'confirmation', 'verify', 'approve']):
            return "Confirmation"
        elif any(word in content_lower for word in ['reschedule', 'postpone', 'cancel', 'change']):
            return "Schedule Change"
        elif any(word in content_lower for word in ['introduce', 'introduction', 'connect', 'referral']):
            return "Introduction"
        elif any(word in content_lower for word in ['collaborate', 'partnership', 'work together', 'team up']):
            return "Collaboration"
        elif any(word in content_lower for word in ['feedback', 'review', 'opinion', 'thoughts']):
            return "Feedback Request"
        elif any(word in content_lower for word in ['deadline', 'due date', 'timeline', 'schedule']):
            return "Timeline Discussion"
        elif any(word in content_lower for word in ['budget', 'cost', 'pricing', 'quote', 'estimate']):
            return "Budget Discussion"
        elif any(word in content_lower for word in ['project', 'work', 'assignment', 'task']):
            return "Project Discussion"
        elif any(word in content_lower for word in ['hello', 'hi', 'greetings', 'good morning', 'good afternoon']):
            return "Greeting"
        elif any(word in content_lower for word in ['goodbye', 'farewell', 'see you', 'until next time']):
            return "Farewell"
        else:
            # Try to extract a meaningful subject from the first sentence
            sentences = content.split('.')
            if sentences and len(sentences[0]) > 10:
                first_sentence = sentences[0].strip()
                # Remove common email phrases
                clean_sentence = first_sentence.replace('Dear', '').replace('Hi', '').replace('Hello', '').strip()
                if len(clean_sentence) > 5 and len(clean_sentence) < 50:
                    return clean_sentence[:40] + ('...' if len(clean_sentence) > 40 else '')
            
            return "Message"
            
    except Exception as e:
        print(f"[EMAIL AGENT] Error generating subject: {e}")
        return "Message"

# Initialize OpenAI client (v1+)
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

async def assign_agent_task(details: dict, user_id: str = None) -> dict:
    print(f"[AGENT] Assigning agent task with details: {details}, user_id: {user_id}")
    agent_id = details.get("agent_id")
    user_input = details.get("input")
    print(f"[AGENT] agent_id: {agent_id}, user_input: {user_input}")
    if not agent_id or not user_input:
        print("[AGENT] Missing agent_id or input.")
        return {"status": "failed", "error": "Missing agent_id or input."}
    
    # Use provided user_id or raise error if not provided
    if not user_id:
        print("[AGENT] No user_id provided, authentication required")
        return {"status": "failed", "error": "Authentication required"}
    
    try:
        # Check agent type and handle accordingly
        print(f"[AGENT] Checking agent condition: agent_id={agent_id}, agent_name={details.get('agent_name')}")
        
        # Email Agent (ID: 1)
        if is_email_agent(agent_id) or details.get("agent_name") == EMAIL_AGENT_NAME:
            print(f"[EMAIL AGENT] Branch taken for agent_id={agent_id}")
            
            # Check if form fields are provided (specific email fields)
            form_fields = details.get("form_fields", {})
            email = form_fields.get("email", "")
            subject = form_fields.get("subject", "")
            content = form_fields.get("content", "")
            
            # If specific fields are provided, use them directly
            if email and content:
                print(f"[EMAIL AGENT] Using form fields - email: {email}, subject: {subject}, content: {content}")
                tone_level = form_fields.get("tone_level", 3)
            else:
                # Fallback to parsing from user input
                print(f"[EMAIL AGENT] Parsing from user input: {user_input}")
            email, content = extract_email_and_content(user_input)
            subject = ""
            tone_level = details.get("tone_level", 3)
            
            print(f"[EMAIL AGENT] Final values - email: {email}, content: {content}")
            if not email or not content:
                print("[EMAIL AGENT] No valid email address or content found.")
                return {"status": "failed", "error": "No valid email address or content found."}
            
            # Get tone level from details, default to 3 (neutral)
            reformat_prompt = get_reformat_prompt(tone_level)
            llm_input = f"{reformat_prompt}\nMessage: {user_input}"
            print(f"[EMAIL AGENT] Step 2: Calling LLM to reformat email content with tone level {tone_level}. Input: {llm_input}")
            try:
                response = await asyncio.wait_for(
                    openai_client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "system", "content": reformat_prompt}, {"role": "user", "content": user_input}],
                        max_tokens=256,
                        temperature=0.7,
                    ),
                    timeout=15
                )
                print(f"[EMAIL AGENT] LLM API response: {response}")
                llm_json = response.choices[0].message.content
                print(f"[EMAIL AGENT] LLM raw output: {llm_json}")
                import json
                try:
                    llm_data = json.loads(llm_json)
                except json.JSONDecodeError as e:
                    print(f"[EMAIL AGENT] JSON decode error: {e}")
                    print(f"[EMAIL AGENT] Raw LLM output: {llm_json}")
                    # Fallback: use the content we already have
                    if not content:
                        return {"status": "failed", "error": "Failed to parse LLM response and extract content"}
                else:
                    # Only update content if LLM provided it, otherwise keep what we have
                    llm_content = llm_data.get("content")
                    if llm_content:
                        content = llm_content
                
                print(f"[EMAIL AGENT] Final email: {email}, content: {content}")
                # Strip greeting and closing from LLM content
                import re
                # Remove greeting at the start (e.g., 'Hi', 'Hello', 'Hi there', 'Hello there', 'Dear ...', case-insensitive)
                content = re.sub(r'^(hi( there)?|hello( there)?|dear[\w\s,]*)[\s,!:.-]*\n*', '', content, flags=re.IGNORECASE)
                # Remove closing at the end (e.g., 'Thanks,', 'Best,', 'Regards,', etc.)
                content = re.sub(r'\n+(thanks|best|regards|sincerely|cheers)[^\w\n]*[\w,\s]*$', '', content, flags=re.IGNORECASE)
                content = content.strip()
            except asyncio.TimeoutError:
                print(f"[EMAIL AGENT] LLM output error: Timeout")
                return {"status": "failed", "error": "LLM output error: Timeout"}
            except Exception as e:
                print(f"[EMAIL AGENT] LLM output error: {e}")
                return {"status": "failed", "error": f"LLM output error: {e}"}
            
            if not email or not content:
                print("[EMAIL AGENT] LLM could not extract email or content.")
                return {"status": "failed", "error": "LLM could not extract email or content."}
            
            # Get email template based on tone level
            email_template = get_email_template(tone_level)
            # Extract recipient name from email for formal templates
            recipient_name = email.split('@')[0] if email else "there"
            preview = email_template.format(content=content, recipient_name=recipient_name)
            
            # Generate email subject if not provided
            if not subject:
                subject = generate_email_subject(content, tone_level)
            
            print(f"[EMAIL AGENT] Step 3: Created preview email with tone level {tone_level}: {preview}")
            print(f"[EMAIL AGENT] Generated subject: {subject}")
            response = supabase.table("agent_tasks").insert({
                "status": "Assigned",
                "agent_id": agent_id,
                "user_id": user_id,
                "input": user_input,
                "output": str(preview),
                "error": None
            }).execute()
            print(f"[EMAIL AGENT] Supabase insert response: {response}")
            data = getattr(response, 'data', None)
            task_id = data[0].get("id") if data and isinstance(data, list) and data else None
            agent_name = get_agent_name(agent_id)
            print(f"[EMAIL AGENT] Returning agent_name: {agent_name}")
            return {"task_id": task_id, "status": "Assigned", "preview": preview, "email": email, "agent_name": agent_name, "tone_level": tone_level, "subject": subject}
        
        # Quest Agent (ID: 2)
        elif is_quest_agent(agent_id) or details.get("agent_name") == QUEST_AGENT_NAME:
            print(f"[QUEST AGENT] Branch taken for agent_id={agent_id}")
            # Quest agent generates quests using LLM
            try:
                quest_prompt = f"""
You are a productivity coach. Generate a personalized quest based on the user's input.
Create a quest that is:
1. Specific and actionable
2. Challenging but achievable
3. Relevant to the user's input
4. Has a clear completion criteria

User input: {user_input}

Return a JSON object with: title, description, elo_reward (10-50), difficulty (easy/normal/hard)
"""
                response = await asyncio.wait_for(
                    openai_client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "system", "content": quest_prompt}],
                        max_tokens=256,
                        temperature=0.7,
                    ),
                    timeout=15
                )
                quest_json = response.choices[0].message.content
                import json
                quest_data = json.loads(quest_json)
                
                # Store quest in database
                quest_id = f"q_{int(asyncio.get_event_loop().time())}"
                supabase.table("quests").upsert({
                    "id": quest_id,
                    "title": quest_data["title"],
                    "description": quest_data["description"],
                    "elo_reward": quest_data["elo_reward"],
                    "difficulty": quest_data["difficulty"],
                    "created_by_llm": True
                }).execute()
                
                # Assign to user
                supabase.table("user_quests").insert({
                    "user_id": user_id,
                    "quest_id": quest_id,
                    "status": "available"
                }).execute()
                
                # Create agent task record
                response = supabase.table("agent_tasks").insert({
                    "status": "Assigned",
                    "agent_id": agent_id,
                    "user_id": user_id,
                    "input": user_input,
                    "output": f"Generated quest: {quest_data['title']}",
                    "error": None
                }).execute()
                
                data = getattr(response, 'data', None)
                task_id = data[0].get("id") if data and isinstance(data, list) and data else None
                agent_name = get_agent_name(agent_id)
                
                return {
                    "task_id": task_id, 
                    "status": "Assigned", 
                    "agent_name": agent_name,
                    "quest": quest_data,
                    "message": f"Generated quest: {quest_data['title']}"
                }
                
            except Exception as e:
                print(f"[QUEST AGENT] Error generating quest: {e}")
                return {"status": "failed", "error": f"Failed to generate quest: {str(e)}"}
        
        # Query Agent (ID: 3)
        elif is_query_agent(agent_id) or details.get("agent_name") == QUERY_AGENT_NAME:
            print(f"[QUERY AGENT] Branch taken for agent_id={agent_id}")
            try:
                # Use the existing query_agent function
                results = await query_agent(user_input)
                
                # Create agent task record
                response = supabase.table("agent_tasks").insert({
                    "status": "Assigned",
                    "agent_id": agent_id,
                    "user_id": user_id,
                    "input": user_input,
                    "output": f"Found {len(results)} relevant results",
                    "error": None
                }).execute()
                
                data = getattr(response, 'data', None)
                task_id = data[0].get("id") if data and isinstance(data, list) and data else None
                agent_name = get_agent_name(agent_id)
                
                return {
                    "task_id": task_id, 
                    "status": "Assigned", 
                    "agent_name": agent_name,
                    "results": results,
                    "message": f"Found {len(results)} relevant results"
                }
                
            except Exception as e:
                print(f"[QUERY AGENT] Error querying knowledge base: {e}")
                return {"status": "failed", "error": f"Failed to query knowledge base: {str(e)}"}
        
        # Ideas Agent (ID: 8)
        elif is_ideas_agent(agent_id) or details.get("agent_name") == IDEAS_AGENT_NAME:
            print(f"[IDEAS AGENT] Branch taken for agent_id={agent_id}")
            try:
                # Generate ideas using OpenAI
                ideas = await generate_ideas(user_input)
                
                # Create agent task record
                response = supabase.table("agent_tasks").insert({
                    "status": "Assigned",
                    "agent_id": agent_id,
                    "user_id": user_id,
                    "input": user_input,
                    "output": f"Generated {len(ideas)} innovative ideas",
                    "error": None
                }).execute()
                
                data = getattr(response, 'data', None)
                task_id = data[0].get("id") if data and isinstance(data, list) and data else None
                agent_name = get_agent_name(agent_id)
                
                return {
                    "task_id": task_id, 
                    "status": "Assigned", 
                    "agent_name": agent_name,
                    "ideas": ideas,
                    "message": f"Generated {len(ideas)} innovative ideas"
                }
                
            except Exception as e:
                print(f"[IDEAS AGENT] Error generating ideas: {e}")
                return {"status": "failed", "error": f"Failed to generate ideas: {str(e)}"}
        
        # Quote Agent (ID: 5)
        elif is_quote_agent(agent_id) or details.get("agent_name") == QUOTE_AGENT_NAME:
            print(f"[QUOTE AGENT] Branch taken for agent_id={agent_id}")
            try:
                # Generate quote using OpenAI
                quote_type = details.get("form_fields", {}).get("quote_type", "motivation")
                quote_result = await generate_inspirational_quote(quote_type)
                
                # Create agent task record
                response = supabase.table("agent_tasks").insert({
                    "status": "Assigned",
                    "agent_id": agent_id,
                    "user_id": user_id,
                    "input": user_input,
                    "output": f"Generated {quote_type} quote",
                    "error": None
                }).execute()
                
                data = getattr(response, 'data', None)
                task_id = data[0].get("id") if data and isinstance(data, list) and data else None
                agent_name = get_agent_name(agent_id)
                
                return {
                    "task_id": task_id, 
                    "status": "Assigned", 
                    "agent_name": agent_name,
                    "quote": quote_result,
                    "message": f"Generated {quote_type} quote"
                }
                
            except Exception as e:
                print(f"[QUOTE AGENT] Error generating quote: {e}")
                return {"status": "failed", "error": f"Failed to generate quote: {str(e)}"}
        
        # Fallback for other agents: store in agent_tasks
        print(f"[AGENT] Fallback branch taken for agent_id={agent_id}")
        if not isinstance(details, dict):
            print("[AGENT] Invalid details type for assign_agent_task.")
            return {"status": "failed", "error": "Task details must be a dictionary."}
        response = supabase.table("agent_tasks").insert({
            "status": "Assigned",
            "agent_id": agent_id,
            "user_id": user_id,  # Use the provided user_id
            "input": details.get("input", "Agent Task"),
            "output": None
        }).execute()
        print(f"[AGENT] Supabase insert response: {response}")
        error = getattr(response, 'error', None)
        data = getattr(response, 'data', None)
        if error:
            print(f"[AGENT] Error inserting agent task: {error}")
            return {"status": "failed", "error": str(error)}
        if data is None or not isinstance(data, list) or not data:
            print(f"[AGENT] No data returned from Supabase after insert. Data: {data}")
            return {"status": "failed", "error": "No data returned from Supabase after insert."}
        task_id = data[0].get("id")
        if task_id is None:
            print(f"[AGENT] No task_id in Supabase insert response: {data}")
            return {"status": "failed", "error": "No task_id returned from Supabase."}
        agent_name = get_agent_name(agent_id)
        print(f"[AGENT] Returning agent_name: {agent_name}")
        return {"task_id": task_id, "status": "Assigned", "agent_name": agent_name}
    except Exception as e:
        print(f"[AGENT] Exception in assign_agent_task: {e}")
        return {"status": "failed", "error": str(e)}



async def regenerate_email_with_tone(user_input: str, tone_level: int) -> dict:
    """Regenerate email content with specified tone level"""
    print(f"[EMAIL AGENT] Regenerating email with tone level {tone_level}")
    try:
        email, content = extract_email_and_content(user_input)
        if not email or not content:
            return {"status": "failed", "error": "No valid email address or content found."}
        
        reformat_prompt = get_reformat_prompt(tone_level)
        response = await asyncio.wait_for(
            openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": reformat_prompt}, {"role": "user", "content": user_input}],
                max_tokens=256,
                temperature=0.7,
            ),
            timeout=15
        )
        
        llm_json = response.choices[0].message.content
        import json
        try:
            llm_data = json.loads(llm_json)
        except json.JSONDecodeError:
            # Fallback to manual extraction
            email, content = extract_email_and_content(user_input)
            if not email or not content:
                return {"status": "failed", "error": "Failed to parse LLM response"}
        else:
            email = llm_data.get("email")
            content = llm_data.get("content")
        
        # Strip greeting and closing
        import re
        content = re.sub(r'^(hi( there)?|hello( there)?|dear[\w\s,]*)[\s,!:.-]*\n*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'\n+(thanks|best|regards|sincerely|cheers)[^\w\n]*[\w,\s]*$', '', content, flags=re.IGNORECASE)
        content = content.strip()
        
        # Get email template based on tone level
        email_template = get_email_template(tone_level)
        recipient_name = email.split('@')[0] if email else "there"
        preview = email_template.format(content=content, recipient_name=recipient_name)
        
        # Generate email subject
        subject = generate_email_subject(content, tone_level)
        
        return {"status": "success", "preview": preview, "email": email, "tone_level": tone_level, "subject": subject}
        
    except Exception as e:
        print(f"[EMAIL AGENT] Error regenerating email: {e}")
        return {"status": "failed", "error": str(e)}

# New function to send the email after confirmation
def send_email_agent(email: str, content: str, agent_id: int, user_input: str, task_id: int = None, user_id: str = None, subject: str = None) -> dict:
    print(f"[EMAIL AGENT] Sending confirmed email to {email} with content: {content}")
    
    # Use provided subject or generate one based on content
    if subject and subject.strip():
        email_subject = subject.strip()
    else:
        email_subject = generate_email_subject(content)
    
    print(f"[EMAIL AGENT] Using subject: {email_subject}")
    
    try:
        gmail_result = send_gmail_message(email, email_subject, content)
        print(f"[EMAIL AGENT] Gmail API result: {gmail_result}")
    except Exception as e:
        print(f"[EMAIL AGENT] Exception sending email: {e}")
        return {"status": "failed", "error": f"Gmail API exception: {e}"}
    if gmail_result.get("status") != "sent":
        print(f"[EMAIL AGENT] Gmail API error: {gmail_result.get('error')}")
        return {"status": "failed", "error": f"Gmail API error: {gmail_result.get('error')}"}
    # Update the existing agent_tasks row to completed
    if task_id is not None:
        print(f"[EMAIL AGENT] Updating agent_tasks id {task_id} to completed.")
        response = supabase.table("agent_tasks").update({
            "output": str(content),
            "status": "completed"
        }).eq("id", task_id).execute()
        print(f"[EMAIL AGENT] Update response: {response}")
        return {"task_id": task_id, "status": "completed"}
    # Fallback: if no task_id, insert as before
    if not user_id:
        print("[EMAIL AGENT] No user_id provided, cannot create task record")
        return {"status": "failed", "error": "Authentication required"}
    
    print(f"[EMAIL AGENT] No task_id provided, inserting new completed task for user {user_id}.")
    response = supabase.table("agent_tasks").insert({
        "agent_id": agent_id,
        "user_id": user_id,
        "input": user_input,
        "output": str(content),
        "status": "completed"
    }).execute()
    data = getattr(response, 'data', None)
    new_task_id = data[0].get("id") if data and isinstance(data, list) and data else None
    print(f"[EMAIL AGENT] Task stored in Supabase with id: {new_task_id}")
    return {"task_id": new_task_id, "status": "completed"}

async def generate_inspirational_quote(quote_type: str = "motivation") -> dict:
    """Generate an inspirational quote based on the specified type"""
    print(f"[QUOTE AGENT] Generating {quote_type} quote")
    try:
        # Define prompts for different quote types
        prompts = {
            "motivation": "Generate an inspirational motivational quote that encourages people to pursue their goals and dreams. The quote should be uplifting and empowering.",
            "success": "Generate a quote about success, achievement, and reaching one's potential. The quote should inspire people to work hard and persevere.",
            "leadership": "Generate a quote about leadership, influence, and making a positive impact on others. The quote should inspire people to lead by example.",
            "creativity": "Generate a quote about creativity, innovation, and thinking outside the box. The quote should inspire people to embrace their creative potential.",
            "wisdom": "Generate a wise and thoughtful quote about life, learning, and personal growth. The quote should offer deep insights and perspective.",
            "courage": "Generate a quote about courage, bravery, and facing challenges. The quote should inspire people to be bold and take risks.",
            "love": "Generate a quote about love, relationships, and human connection. The quote should be heartfelt and meaningful.",
            "happiness": "Generate a quote about happiness, joy, and finding contentment in life. The quote should be positive and uplifting.",
            "perseverance": "Generate a quote about perseverance, resilience, and never giving up. The quote should inspire people to keep going despite obstacles.",
            "dreams": "Generate a quote about dreams, aspirations, and pursuing what matters most. The quote should inspire people to follow their dreams."
        }
        
        prompt = prompts.get(quote_type, prompts["motivation"])
        
        # Enhanced system prompt for better JSON formatting
        system_prompt = """You are a quote generator. Generate inspirational quotes from influential people throughout history. 
        You must return ONLY a valid JSON object with exactly this format:
        {"quote": "The actual quote text here", "author": "Author Name"}
        
        Do not include any additional text, explanations, or formatting outside the JSON object."""
        
        response = await asyncio.wait_for(
            openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
            ],
            max_tokens=200,
                temperature=0.8,
            ),
            timeout=20
        )
        
        llm_response = response.choices[0].message.content.strip()
        print(f"[QUOTE AGENT] Raw LLM response: {llm_response}")
        
        # Try to parse JSON response with multiple fallback strategies
        quote = ""
        author = "Unknown"
        
        try:
            import json
            # First, try to parse as-is
            quote_data = json.loads(llm_response)
            quote = quote_data.get('quote', '')
            author = quote_data.get('author', 'Unknown')
        except json.JSONDecodeError as e:
            print(f"[QUOTE AGENT] JSON decode error: {e}")
            
            # Try to extract JSON from the response if it's wrapped in other text
            import re
            json_match = re.search(r'\{[^{}]*"quote"[^{}]*"author"[^{}]*\}', llm_response)
            if json_match:
                try:
                    quote_data = json.loads(json_match.group())
                    quote = quote_data.get('quote', '')
                    author = quote_data.get('author', 'Unknown')
                except json.JSONDecodeError:
                    pass
            
            # If still no success, try to extract quote and author manually
            if not quote:
                lines = llm_response.strip().split('\n')
                # Look for quote in quotes
                quote_match = re.search(r'"([^"]+)"', llm_response)
                if quote_match:
                    quote = quote_match.group(1)
                else:
                    # Take first non-empty line as quote
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith('{') and not line.startswith('"author'):
                            quote = line.strip('"')
                            break
                
                # Look for author after dash or colon
                author_match = re.search(r'[-—]\s*([^\n]+)', llm_response)
                if author_match:
                    author = author_match.group(1).strip()
                else:
                    # Try to find author in the last line
                    for line in reversed(lines):
                        line = line.strip()
                        if line and not line.startswith('{') and not line.startswith('"quote'):
                            author = line.strip('"')
                            break
        
        # Final validation and fallback
        if not quote or quote == "":
            print("[QUOTE AGENT] Could not extract quote from response")
            # Return a fallback quote based on type
            fallback_quotes = {
                "motivation": {"quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
                "success": {"quote": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
                "leadership": {"quote": "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", "author": "Ronald Reagan"},
                "creativity": {"quote": "Creativity is intelligence having fun.", "author": "Albert Einstein"},
                "wisdom": {"quote": "The unexamined life is not worth living.", "author": "Socrates"},
                "courage": {"quote": "Courage is not the absence of fear, but the triumph over it.", "author": "Nelson Mandela"},
                "love": {"quote": "The best thing to hold onto in life is each other.", "author": "Audrey Hepburn"},
                "happiness": {"quote": "Happiness is not something ready made. It comes from your own actions.", "author": "Dalai Lama"},
                "perseverance": {"quote": "It does not matter how slowly you go as long as you do not stop.", "author": "Confucius"},
                "dreams": {"quote": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"}
            }
            fallback = fallback_quotes.get(quote_type, fallback_quotes["motivation"])
            quote = fallback["quote"]
            author = fallback["author"]
        
        # Clean up the quote and author
        quote = quote.strip().strip('"')
        author = author.strip().strip('"')
        
        print(f"[QUOTE AGENT] Final quote: {quote}")
        print(f"[QUOTE AGENT] Final author: {author}")
        
        return {
            "status": "success",
            "quote": quote,
            "author": author,
            "type": quote_type
        }
        
    except asyncio.TimeoutError:
        print("[QUOTE AGENT] Timeout error")
        return {"status": "failed", "error": "Quote generation timed out"}
    except Exception as e:
        print(f"[QUOTE AGENT] Error generating quote: {e}")
        return {"status": "failed", "error": f"Failed to generate quote: {str(e)}"}

async def generate_ideas(command: str) -> list:
    """Generate innovative app and website ideas based on user input"""
    print(f"[IDEAS AGENT] Generating ideas for command: {command}")
    try:
        # Create a comprehensive prompt for generating innovative ideas with scores
        prompt = f"""
You are an innovative ideas generator. Based on the user's input, generate 10 creative and practical app/website ideas that could be built.

User input: {command}

Generate 10 innovative ideas that are:
1. Technically feasible to build
2. Have clear value propositions
3. Could potentially solve real problems or meet real needs
4. Are specific enough to be actionable
5. Cover different categories (mobile apps, web apps, SaaS, etc.)

For each idea, also provide:
- Difficulty score (1-5): 1=Easy to build, 3=Moderate complexity, 5=Very complex
- Value score (1-5): 1=Low value/market potential, 3=Moderate value, 5=High value/market potential

Return ONLY a JSON array of 10 objects, each containing 'idea', 'difficulty', and 'value' fields. No additional text or formatting.

Example format:
[
  {{"idea": "Idea 1 description", "difficulty": 3, "value": 4}},
  {{"idea": "Idea 2 description", "difficulty": 2, "value": 5}},
  ...
]
"""
        
        response = await asyncio.wait_for(
            openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert at generating innovative app and website ideas. Always return exactly 10 ideas in JSON array format with difficulty and value scores."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.8,
            ),
            timeout=20
        )
        
        llm_response = response.choices[0].message.content.strip()
        print(f"[IDEAS AGENT] Raw LLM response: {llm_response}")
        
        # Try to parse JSON response
        try:
            import json
            ideas_data = json.loads(llm_response)
            
            # Ensure we have exactly 10 ideas with proper structure
            if isinstance(ideas_data, list) and len(ideas_data) == 10:
                # Validate each idea has the required fields
                validated_ideas = []
                for idea_obj in ideas_data:
                    if isinstance(idea_obj, dict) and 'idea' in idea_obj:
                        validated_ideas.append({
                            'idea': idea_obj.get('idea', ''),
                            'difficulty': min(max(int(idea_obj.get('difficulty', 3)), 1), 5),  # Clamp between 1-5
                            'value': min(max(int(idea_obj.get('value', 3)), 1), 5)  # Clamp between 1-5
                        })
                    else:
                        # Fallback for malformed idea
                        validated_ideas.append({
                            'idea': str(idea_obj) if idea_obj else 'Generic app idea',
                            'difficulty': 3,
                            'value': 3
                        })
                return validated_ideas
            elif isinstance(ideas_data, list) and len(ideas_data) > 10:
                # Take first 10 and validate
                validated_ideas = []
                for idea_obj in ideas_data[:10]:
                    if isinstance(idea_obj, dict) and 'idea' in idea_obj:
                        validated_ideas.append({
                            'idea': idea_obj.get('idea', ''),
                            'difficulty': min(max(int(idea_obj.get('difficulty', 3)), 1), 5),
                            'value': min(max(int(idea_obj.get('value', 3)), 1), 5)
                        })
                    else:
                        validated_ideas.append({
                            'idea': str(idea_obj) if idea_obj else 'Generic app idea',
                            'difficulty': 3,
                            'value': 3
                        })
                return validated_ideas
            elif isinstance(ideas_data, list) and len(ideas_data) < 10:
                # Pad with generic ideas if we don't have enough
                generic_ideas = [
                    {"idea": "A productivity app for remote teams", "difficulty": 3, "value": 4},
                    {"idea": "A sustainable living tracker", "difficulty": 2, "value": 3},
                    {"idea": "A local business discovery platform", "difficulty": 4, "value": 4},
                    {"idea": "A skill-sharing marketplace", "difficulty": 4, "value": 5},
                    {"idea": "A personal finance advisor", "difficulty": 3, "value": 4},
                    {"idea": "A mental health support app", "difficulty": 3, "value": 5},
                    {"idea": "A creative project collaboration tool", "difficulty": 4, "value": 4},
                    {"idea": "A sustainable fashion marketplace", "difficulty": 3, "value": 4},
                    {"idea": "A community event organizer", "difficulty": 2, "value": 3},
                    {"idea": "A personalized learning platform", "difficulty": 4, "value": 5}
                ]
                
                validated_ideas = []
                for idea_obj in ideas_data:
                    if isinstance(idea_obj, dict) and 'idea' in idea_obj:
                        validated_ideas.append({
                            'idea': idea_obj.get('idea', ''),
                            'difficulty': min(max(int(idea_obj.get('difficulty', 3)), 1), 5),
                            'value': min(max(int(idea_obj.get('value', 3)), 1), 5)
                        })
                    else:
                        validated_ideas.append({
                            'idea': str(idea_obj) if idea_obj else 'Generic app idea',
                            'difficulty': 3,
                            'value': 3
                        })
                
                # Add generic ideas to reach 10
                needed = 10 - len(validated_ideas)
                validated_ideas.extend(generic_ideas[:needed])
                return validated_ideas
            else:
                raise ValueError("Invalid response format")
                
        except (json.JSONDecodeError, ValueError) as e:
            print(f"[IDEAS AGENT] JSON parsing error: {e}")
            # Fallback to generic ideas with scores
            return [
                {"idea": "A productivity app for remote teams", "difficulty": 3, "value": 4},
                {"idea": "A sustainable living tracker", "difficulty": 2, "value": 3},
                {"idea": "A local business discovery platform", "difficulty": 4, "value": 4},
                {"idea": "A skill-sharing marketplace", "difficulty": 4, "value": 5},
                {"idea": "A personal finance advisor", "difficulty": 3, "value": 4},
                {"idea": "A mental health support app", "difficulty": 3, "value": 5},
                {"idea": "A creative project collaboration tool", "difficulty": 4, "value": 4},
                {"idea": "A sustainable fashion marketplace", "difficulty": 3, "value": 4},
                {"idea": "A community event organizer", "difficulty": 2, "value": 3},
                {"idea": "A personalized learning platform", "difficulty": 4, "value": 5}
            ]
        
    except asyncio.TimeoutError:
        print("[IDEAS AGENT] Timeout error")
        return [
            {"idea": "A productivity app for remote teams", "difficulty": 3, "value": 4},
            {"idea": "A sustainable living tracker", "difficulty": 2, "value": 3},
            {"idea": "A local business discovery platform", "difficulty": 4, "value": 4},
            {"idea": "A skill-sharing marketplace", "difficulty": 4, "value": 5},
            {"idea": "A personal finance advisor", "difficulty": 3, "value": 4},
            {"idea": "A mental health support app", "difficulty": 3, "value": 5},
            {"idea": "A creative project collaboration tool", "difficulty": 4, "value": 4},
            {"idea": "A sustainable fashion marketplace", "difficulty": 3, "value": 4},
            {"idea": "A community event organizer", "difficulty": 2, "value": 3},
            {"idea": "A personalized learning platform", "difficulty": 4, "value": 5}
        ]
    except Exception as e:
        print(f"[IDEAS AGENT] Error generating ideas: {e}")
        return [
            {"idea": "A productivity app for remote teams", "difficulty": 3, "value": 4},
            {"idea": "A sustainable living tracker", "difficulty": 2, "value": 3},
            {"idea": "A local business discovery platform", "difficulty": 4, "value": 4},
            {"idea": "A skill-sharing marketplace", "difficulty": 4, "value": 5},
            {"idea": "A personal finance advisor", "difficulty": 3, "value": 4},
            {"idea": "A mental health support app", "difficulty": 3, "value": 5},
            {"idea": "A creative project collaboration tool", "difficulty": 4, "value": 4},
            {"idea": "A sustainable fashion marketplace", "difficulty": 3, "value": 4},
            {"idea": "A community event organizer", "difficulty": 2, "value": 3},
            {"idea": "A personalized learning platform", "difficulty": 4, "value": 5}
        ]

def get_task_status(task_id: int) -> dict:
    print(f"Getting status for task_id: {task_id}")
    if not isinstance(task_id, int):
        print("Invalid task_id type for get_task_status.")
        raise Exception("Task ID must be an integer.")
    try:
        try:
            response = supabase.rpc("get_agent_task_with_agent_name", {"task_id": task_id}).execute()
            print(f"Supabase select response: {response}")
            error = getattr(response, 'error', None)
            data = getattr(response, 'data', None)
            if error:
                print(f"Error fetching task status: {error}")
                raise Exception(str(error))
            if data and isinstance(data, list) and len(data) > 0:
                return convert_datetime_to_string(data[0])
        except Exception as rpc_e:
            print(f"RPC failed, falling back to select: {rpc_e}")
            response = supabase.table("agent_tasks").select("status, input, output, error, created_at, started_at, completed_at, agent_id").eq("id", task_id).single().execute()
            data = getattr(response, 'data', None)
            if data:
                return convert_datetime_to_string(data)
        return {"status": "Not found"}
    except Exception as e:
        print(f"Exception in get_task_status: {e}")
        raise

async def query_agent(query: str, top_k: int = 5):
    print(f"[QUERY_AGENT] Called with query: {query}, top_k: {top_k}")
    if not isinstance(query, str) or not query.strip():
        print("[QUERY_AGENT] Invalid query for query_agent.")
        raise Exception("Query must be a non-empty string.")
    
    # Check if Pinecone is available
    if lc_pinecone is None:
        print("[QUERY_AGENT] Pinecone not available, returning empty results")
        return []
    
    try:
        print("[QUERY_AGENT] About to call lc_pinecone.similarity_search")
        import asyncio
        results = await asyncio.wait_for(asyncio.to_thread(lc_pinecone.similarity_search, query, k=top_k), timeout=15)
        print(f"[QUERY_AGENT] Pinecone similarity search returned {len(results)} results: {results}")
        filtered = [r for r in results if 'to-do list' not in r.page_content.lower()]
        formatted = [{
            "text": r.page_content.strip(),
            "source": r.metadata.get("file_path", "Unknown")
        } for r in filtered]
        print(f"[QUERY_AGENT] Formatted results: {formatted}")
        return formatted
    except asyncio.TimeoutError:
        print(f"[QUERY_AGENT] Exception in query_agent: Timeout")
        return []
    except Exception as e:
        import traceback
        print(f"[QUERY_AGENT] Exception in query_agent: {e}")
        traceback.print_exc()
        raise

async def query_agent_advanced(query: str, top_k: int = 5):
    print(f"[QUERY_AGENT_ADVANCED] Called with query: {query}, top_k: {top_k}")
    
    try:
        # 1. Get raw chunks from Pinecone (reuse existing function)
        chunks = await query_agent(query, top_k)
        
        if not chunks:
            return {
                "mode": "advanced",
                "summary": "No relevant information found in the knowledge base.",
                "raw_chunks": [],
                "chunk_count": 0
            }
        
        # 2. Summarize chunks with LLM
        summary = await summarize_chunks_with_llm(query, chunks)
        
        # 3. Return structured response
        return {
            "mode": "advanced",
            "summary": summary,
            "raw_chunks": chunks,  # Include for debugging/transparency
            "chunk_count": len(chunks)
        }
        
    except Exception as e:
        print(f"[QUERY_AGENT_ADVANCED] Error: {e}")
        # Fallback to basic mode
        basic_results = await query_agent(query, top_k)
        return {
            "mode": "advanced",
            "summary": "Unable to generate summary. Showing basic results.",
            "raw_chunks": basic_results,
            "chunk_count": len(basic_results),
            "error": str(e)
        }

async def summarize_chunks_with_llm(query: str, chunks: list):
    print(f"[SUMMARIZE_CHUNKS] Summarizing {len(chunks)} chunks for query: {query}")
    
    # Format chunks for LLM
    formatted_chunks = []
    for i, chunk in enumerate(chunks, 1):
        formatted_chunks.append(f"Chunk {i} (Source: {chunk.get('source', 'Unknown')}):\n{chunk['text']}\n")
    
    chunks_text = "\n".join(formatted_chunks)
    
    prompt = f"""You are a helpful assistant that summarizes information from a knowledge base.

User Query: {query}

Information Chunks:
{chunks_text}

Please provide a concise, accurate summary that directly answers the user's query. The summary should:
1. Be clear and well-structured
2. Include relevant details from the chunks
3. Maintain accuracy of the original information
4. Be significantly shorter than the raw chunks
5. Focus on the most relevant information for the query
6. Use bullet points or numbered lists when appropriate for clarity

Summary:"""
    
    try:
        response = await asyncio.wait_for(
            openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3,
            ),
            timeout=30
        )
        
        summary = response.choices[0].message.content.strip()
        print(f"[SUMMARIZE_CHUNKS] Generated summary: {summary[:100]}...")
        return summary
        
    except asyncio.TimeoutError:
        print("[SUMMARIZE_CHUNKS] LLM request timed out")
        raise Exception("Summary generation timed out")
    except Exception as e:
        print(f"[SUMMARIZE_CHUNKS] LLM error: {e}")
        raise Exception(f"Failed to generate summary: {str(e)}")

# Enhanced existing function to handle mode parameter
async def query_agent_with_mode(query: str, mode: str = "basic", top_k: int = 5):
    print(f"[QUERY_AGENT_WITH_MODE] Query: {query}, Mode: {mode}, Top_k: {top_k}")
    
    if mode == "advanced":
        return await query_agent_advanced(query, top_k)
    else:
        # Basic mode - return original format
        results = await query_agent(query, top_k)
        return {
            "mode": "basic",
            "results": results
        }

def get_agent_name(agent_id):
    print(f"[AGENT] Looking up agent name for agent_id: {agent_id}")
    try:
        # First try to get from constants
        from app.utils.agent_constants import get_agent_name as get_agent_name_const
        agent_name = get_agent_name_const(agent_id)
        if agent_name != f"Agent {agent_id}":
            return agent_name
        
        # Fallback to database lookup
        from app.utils.config import supabase
        response = supabase.table("agents").select("name").eq("id", agent_id).single().execute()
        print(f"[AGENT] Agent name lookup response: {response}")
        data = getattr(response, 'data', None)
        if data and 'name' in data:
            return data['name']
        else:
            print(f"[AGENT] No agent found for id: {agent_id}")
            return f"Agent {agent_id}"
    except Exception as e:
        print(f"[AGENT] Error looking up agent name: {e}")
        return f"Agent {agent_id}"
