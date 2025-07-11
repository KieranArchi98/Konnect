import datetime
from app.utils.config import supabase
from app.models.quest import Quest
import openai
import os

# Helper: Get today's date string

def today_str():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d')

def get_default_quests(user_id):
    # Fetch the 3 default quests for the user from the DB
    response = supabase.table("quests").select("*").eq("user_id", int(user_id)).eq("status", "available").order("id").limit(3).execute()
    data = getattr(response, 'data', None)
    if not data:
        return []
    return [Quest(**{**q, 'user_id': str(q['user_id'])}) for q in data]

def get_active_quests(user_id):
    # Fetch active quests for the user from DB
    response = supabase.table("quests").select("*").eq("user_id", int(user_id)).eq("status", "active").execute()
    data = getattr(response, 'data', None)
    if not data:
        return []
    return [Quest(**{**q, 'user_id': str(q['user_id'])}) for q in data]

def accept_quest(quest_id: str, user_id: str) -> dict:
    # Prevent accepting default quests (not in DB)
    if str(quest_id).startswith("default_"):
        return {"error": "Default quests are for display only. Please submit your daily report to unlock new quests."}
    # Only allow accepting a quest if not already accepted today
    response = supabase.table("quests").select("*").eq("id", quest_id).eq("user_id", int(user_id)).execute()
    data = getattr(response, 'data', None)
    if data and data[0]["status"] == "active":
        return {"error": "Quest already accepted."}
    # Accept quest
    supabase.table("quests").update({"status": "active", "date_accepted": today_str()}).eq("id", quest_id).eq("user_id", int(user_id)).execute()
    return {"quest_id": quest_id, "status": "active"}

def can_submit_report(user_id):
    # Only one report per day
    response = supabase.table("daily_reports").select("*").eq("user_id", user_id).eq("date_submitted", today_str()).execute()
    data = getattr(response, 'data', None)
    return not data

def submit_quest(report: dict, user_id: str) -> dict:
    print(f"Submitting quest with report: {report}")
    if not isinstance(report, dict):
        print("Invalid report type for submit_quest.")
        raise Exception("Report must be a dictionary.")
    if not can_submit_report(user_id):
        return {"error": "You have already submitted a report today. Please wait until tomorrow."}
    text = report.get("text", "").strip()
    if not text:
        return {"error": "Please describe at least one real activity you completed today."}
    # Call LLM to generate new quests
    prompt = f"""
You are a productivity coach. The user will submit a daily report of their activities. Your tasks:
1. Sanitize and summarize the user's input.
2. Register and list all realistic tasks the user completed.
3. For each completed task, generate a new quest that is slightly more difficult or ambitious.
4. If the user completed no tasks or the input is unrealistic, return an error message.
5. Assign an Elo reward to each quest, scaling with difficulty.
6. Ensure all quests are actionable, measurable, and relevant to the user's activities.
7. Output a JSON array of 3 new quests, each with: title, description, elo_reward, and difficulty.
8. If possible, infer related or creative quests based on the user's activities.

User input: {text}

If the input is empty or unrealistic, respond with: {{"error": "Please describe at least one real activity you completed today."}}
"""
    try:
        openai.api_key = os.environ.get("OPENAI_API_KEY")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": prompt}]
        )
        content = response["choices"][0]["message"]["content"]
        import json
        quests = json.loads(content)
        if "error" in quests:
            return {"error": quests["error"]}
        # Store report and new quests
        supabase.table("daily_reports").insert({"user_id": user_id, "content": text, "date_submitted": today_str(), "llm_feedback": content}).execute()
        for q in quests:
            supabase.table("quests").insert({
                "title": q["title"],
                "description": q["description"],
                "elo_reward": q["elo_reward"],
                "difficulty": q["difficulty"],
                "status": "available",
                "progress": 0.0,
                "user_id": user_id
            }).execute()
        return {"quests": quests}
    except Exception as e:
        print(f"Exception in submit_quest: {e}")
        return {"error": "Failed to generate quests. Please try again later."}
