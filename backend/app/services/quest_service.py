import datetime
import random
from app.utils.config import supabase
from app.models.quest import Quest
import openai
import os
from app.utils.config import settings
import time
from app.utils.datetime_utils import convert_datetime_to_string

# Initialize OpenAI client (v1+)
openai_client = openai.OpenAI(api_key=settings.openai_api_key)

# Helper: Get today's date string
def today_str():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d')

def reset_daily_quests(user_id):
    """Reset quests daily - remove old available quests and assign new ones"""
    try:
        print(f"Resetting daily quests for user {user_id}")
        
        # Remove all available quests for the user
        supabase.table("user_quests").update({"status": "expired"}) \
            .eq("user_id", user_id).eq("status", "active").execute()
        
        # Assign new default quests
        assign_default_quests(user_id)
        
        print(f"Successfully reset quests for user {user_id}")
        return True
    except Exception as e:
        print(f"Error resetting daily quests for user {user_id}: {e}")
        return False

def get_available_quests(user_id):
    try:
        # Add retry logic for Supabase connection
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Fetch 3 most recent available quests for the user
                response = supabase.table("user_quests").select("*, quests(*)") \
                    .eq("user_id", user_id).eq("status", "active") \
                    .order("date_accepted", desc=True).limit(3).execute()
                data = getattr(response, 'data', None)
                
                # If no available quests, assign default quests
                if not data or len(data) == 0:
                    print(f"No available quests found for user {user_id}, assigning default quests...")
                    try:
                        assign_default_quests(user_id)
                        # Fetch again after assigning
                        response = supabase.table("user_quests").select("*, quests(*)") \
                            .eq("user_id", user_id).eq("status", "active") \
                            .order("date_accepted", desc=True).limit(3).execute()
                        data = getattr(response, 'data', None)
                        print(f"Assigned {len(data) if data else 0} default quests to user {user_id}")
                    except Exception as e:
                        print(f"Error assigning default quests: {e}")
                        # Return empty list if we can't assign default quests
                        return []
                
                return convert_datetime_to_string(data) if data else []
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # Wait 1 second before retry
                    continue
                else:
                    raise e
    except Exception as e:
        print(f"Error fetching available quests: {e}")
        return []

def assign_default_quests(user_id):
    try:
        # Get 3 default quests from quests table (created_by_llm = False)
        response = supabase.table("quests").select("*").eq("created_by_llm", False).limit(3).execute()
        quests = getattr(response, 'data', None)
        
        # If no default quests exist, create some
        if not quests:
            print("No default quests found in database, creating default quests...")
            default_quests = [
                {
                    "id": "default_quest_1",
                    "title": "Morning Exercise Routine",
                    "description": "Complete a 20-minute morning workout session",
                    "elo_reward": 50,
                    "difficulty": "easy",
                    "category": "fitness",
                    "created_by_llm": False
                },
                {
                    "id": "default_quest_2", 
                    "title": "Learn Something New",
                    "description": "Spend 30 minutes learning a new skill or topic",
                    "elo_reward": 75,
                    "difficulty": "medium",
                    "category": "learning",
                    "created_by_llm": False
                },
                {
                    "id": "default_quest_3",
                    "title": "Connect with Someone",
                    "description": "Reach out to a friend or family member you haven't talked to recently",
                    "elo_reward": 60,
                    "difficulty": "easy",
                    "category": "social",
                    "created_by_llm": False
                }
            ]
            
            # Insert default quests
            for quest in default_quests:
                try:
                    supabase.table("quests").upsert(quest).execute()
                    print(f"Created default quest: {quest['title']}")
                except Exception as e:
                    print(f"Error creating default quest {quest['id']}: {e}")
                    continue
            
            quests = default_quests
        
        # Assign quests to user
        assigned_count = 0
        for q in quests:
            try:
                # Only insert if not already assigned
                exists = supabase.table("user_quests").select("id").eq("user_id", user_id).eq("quest_id", q["id"]).execute().data
                if not exists:
                    supabase.table("user_quests").insert({
                        "user_id": user_id,
                        "quest_id": q["id"],
                        "status": "active"
                    }).execute()
                    assigned_count += 1
                    print(f"Assigned quest {q['id']} to user {user_id}")
            except Exception as e:
                print(f"Error assigning quest {q['id']} to user {user_id}: {e}")
                # Continue with other quests even if one fails
                continue
        
        print(f"Successfully assigned {assigned_count} quests to user {user_id}")
        
    except Exception as e:
        print(f"Error in assign_default_quests: {e}")
        # Don't crash the application, just log the error
        pass

def accept_quest(quest_id, user_id):
    try:
        # Set quest status to in_progress
        supabase.table("user_quests").update({"status": "in_progress"}) \
            .eq("user_id", user_id).eq("quest_id", quest_id).eq("status", "active").execute()
        return {"quest_id": quest_id, "status": "in_progress"}
    except Exception as e:
        print(f"Error accepting quest {quest_id}: {e}")
        return {"error": "Failed to accept quest"}

def complete_quest(quest_id, user_id):
    try:
        # First, get the quest details to find the ELO reward
        quest_response = supabase.table("quests").select("elo_reward").eq("id", quest_id).execute()
        quest_data = getattr(quest_response, 'data', None)
        
        if not quest_data:
            return {"error": "Quest not found"}
        
        elo_reward = quest_data[0].get("elo_reward", 0)
        
        # Update quest status to completed
        supabase.table("user_quests").update({"status": "completed", "date_completed": today_str()}) \
            .eq("user_id", user_id).eq("quest_id", quest_id).eq("status", "in_progress").execute()
        
        # Add ELO reward to user's account
        if elo_reward > 0:
            # Get current user ELO
            user_response = supabase.table("users").select("elo").eq("id", user_id).execute()
            user_data = getattr(user_response, 'data', None)
            
            if user_data:
                current_elo = user_data[0].get("elo", 1000)
                new_elo = current_elo + elo_reward
                
                # Update user's ELO
                supabase.table("users").update({"elo": new_elo}).eq("id", user_id).execute()
                print(f"User {user_id} gained {elo_reward} ELO for completing quest {quest_id}. New ELO: {new_elo}")
        
        return {"quest_id": quest_id, "status": "completed", "elo_reward": elo_reward}
    except Exception as e:
        print(f"Error completing quest {quest_id}: {e}")
        return {"error": "Failed to complete quest"}

def abandon_quest(quest_id, user_id):
    try:
        supabase.table("user_quests").update({"status": "abandoned"}) \
            .eq("user_id", user_id).eq("quest_id", quest_id).eq("status", "in_progress").execute()
        return {"quest_id": quest_id, "status": "abandoned"}
    except Exception as e:
        print(f"Error abandoning quest {quest_id}: {e}")
        return {"error": "Failed to abandon quest"}

def can_submit_report(user_id):
    try:
        response = supabase.table("daily_reports").select("*").eq("user_id", user_id).eq("date_submitted", today_str()).execute()
        data = getattr(response, 'data', None)
        # Return True if no report exists for today (can submit), False if report exists (cannot submit)
        return not data or len(data) == 0
    except Exception as e:
        print(f"Error checking report status: {e}")
        return True  # Allow submission if we can't check

def submit_report(report, user_id):
    if not can_submit_report(user_id):
        return {"error": "You have already submitted a report today. Please wait until tomorrow."}
    
    text = report.get("text", "").strip()
    if not text:
        return {"error": "Please describe at least one activity from today."}
    
    # Call LLM to generate new quests
    prompt = f"""
You are a supportive productivity coach. The user will submit a daily report of their activities. Your tasks:
1. Be encouraging and supportive of any activities the user mentions, even small ones.
2. Generate exactly 3 new quests based on the user's input, even if they only mention simple activities.
3. If the user mentions specific activities, create quests that build upon those activities.
4. If the user doesn't mention specific activities, create general motivational quests.
5. Always generate exactly 3 quests - never return an error message.
6. Assign an Elo reward to each quest (50-100 points).
7. Ensure all quests are actionable, measurable, and encouraging.

Output a JSON object with EXACTLY 3 quests with this structure:
{{
    "quests": [
        {{
            "id": "quest_{int(time.time())}_1",
            "title": "Quest Title",
            "description": "Quest Description",
            "elo_reward": 50,
            "difficulty": "easy",
            "category": "productivity"
        }},
        {{
            "id": "quest_{int(time.time())}_2",
            "title": "Quest Title", 
            "description": "Quest Description",
            "elo_reward": 75,
            "difficulty": "medium",
            "category": "learning"
        }},
        {{
            "id": "quest_{int(time.time())}_3",
            "title": "Quest Title",
            "description": "Quest Description", 
            "elo_reward": 100,
            "difficulty": "hard",
            "category": "fitness"
        }}
    ]
}}

IMPORTANT: Always generate exactly 3 quests. Never return an error message.

User input: {text}
"""
    
    try:
        # Add timeout and retry logic for OpenAI API
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "system", "content": prompt}],
                    timeout=30  # 30 second timeout
                )
                content = response.choices[0].message.content
                break
            except Exception as e:
                print(f"OpenAI API attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Wait 2 seconds before retry
                    continue
                else:
                    raise e
        
        import json
        print(f"LLM raw output: {content}")
        
        try:
            quests = json.loads(content)
        except Exception as json_err:
            print(f"Error parsing LLM output as JSON: {json_err}")
            # Fall back to default quests
            print("Falling back to default quests due to JSON parsing error")
            return generate_fallback_quests(user_id, text)
        
        # If LLM returns an object with a 'quests' or 'new_quests' key, extract it
        if isinstance(quests, dict):
            if "quests" in quests:
                quests = quests["quests"]
                print(f"Extracted quests from 'quests' key: {len(quests)} quests")
            elif "new_quests" in quests:
                quests = quests["new_quests"]
                print(f"Extracted quests from 'new_quests' key: {len(quests)} quests")
            else:
                print(f"LLM returned object but no quests/new_quests key found. Keys: {list(quests.keys())}")
                # Fall back to default quests
                print("Falling back to default quests due to missing quests key")
                return generate_fallback_quests(user_id, text)
        
        if not isinstance(quests, list):
            print(f"LLM output is not a list after extraction: {quests}")
            # Fall back to default quests
            print("Falling back to default quests due to invalid quests format")
            return generate_fallback_quests(user_id, text)
        
        print(f"Successfully extracted {len(quests)} quests from LLM output")
        
        # Ensure we only process exactly 3 quests
        quests = quests[:3]
        print(f"Processing {len(quests)} quests after limiting to 3")
        
        for q in quests:
            if not all(k in q for k in ("id", "title", "description", "elo_reward", "difficulty", "category")):
                print(f"Quest missing required fields: {q}")
                # Fall back to default quests
                print("Falling back to default quests due to missing quest fields")
                return generate_fallback_quests(user_id, text)
        
        # Store report with retry logic
        max_db_retries = 3
        for attempt in range(max_db_retries):
            try:
                supabase.table("daily_reports").insert({
                    "user_id": user_id, 
                    "content": text, 
                    "date_submitted": today_str(), 
                    "llm_feedback": content
                }).execute()
                break
            except Exception as e:
                print(f"Database insert attempt {attempt + 1} failed: {e}")
                if attempt < max_db_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    raise e
        
        # Remove N random available quests with retry logic
        n = min(len(quests), 3)
        for attempt in range(max_db_retries):
            try:
                available = supabase.table("user_quests").select("id").eq("user_id", user_id).eq("status", "available").execute().data
                if available:
                    to_remove = random.sample(available, min(n, len(available)))
                    for uq in to_remove:
                        supabase.table("user_quests").update({"status": "removed"}).eq("id", uq["id"]).execute()
                break
            except Exception as e:
                print(f"Remove quests attempt {attempt + 1} failed: {e}")
                if attempt < max_db_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    raise e
        
        # Insert new quests and assign to user with retry logic
        for q in quests:
            for attempt in range(max_db_retries):
                try:
                    # Insert quest template if not exists
                    supabase.table("quests").upsert({
                        "id": q["id"],
                        "title": q["title"],
                        "description": q["description"],
                        "elo_reward": q["elo_reward"],
                        "difficulty": q.get("difficulty", "normal"),
                        "category": q.get("category", "general"),
                        "created_by_llm": True
                    }).execute()
                    
                    # Check if user already has this quest assigned
                    existing = supabase.table("user_quests").select("id").eq("user_id", user_id).eq("quest_id", q["id"]).execute().data
                    if not existing:
                        # Assign to user
                        supabase.table("user_quests").insert({
                            "user_id": user_id,
                            "quest_id": q["id"],
                            "status": "available"
                        }).execute()
                        print(f"Successfully assigned quest {q['id']} to user {user_id}")
                    else:
                        print(f"Quest {q['id']} already assigned to user {user_id}, skipping")
                    break
                except Exception as e:
                    print(f"Quest insert/assign attempt {attempt + 1} failed for quest {q['id']}: {e}")
                    if attempt < max_db_retries - 1:
                        time.sleep(1)
                        continue
                    else:
                        # Continue with other quests even if one fails
                        break
        
        return {"quests": quests}
        
    except Exception as e:
        print(f"Exception in submit_report: {e}")
        # Fall back to default quests
        print("Falling back to default quests due to exception")
        return generate_fallback_quests(user_id, text)

def generate_fallback_quests(user_id, text):
    """Generate fallback quests when LLM fails"""
    try:
        # Store the report even if LLM failed
        supabase.table("daily_reports").insert({
            "user_id": user_id, 
            "content": text, 
            "date_submitted": today_str(), 
            "llm_feedback": "LLM failed, using fallback quests"
        }).execute()
        
        # Create fallback quests
        fallback_quests = [
            {
                "id": f"fallback_{int(time.time())}_1",
                "title": "Daily Reflection",
                "description": "Take 10 minutes to reflect on your day and write down 3 things you're grateful for",
                "elo_reward": 50,
                "difficulty": "easy",
                "category": "productivity"
            },
            {
                "id": f"fallback_{int(time.time())}_2",
                "title": "Learn Something New",
                "description": "Spend 20 minutes learning about a topic that interests you",
                "elo_reward": 75,
                "difficulty": "medium",
                "category": "learning"
            },
            {
                "id": f"fallback_{int(time.time())}_3",
                "title": "Physical Activity",
                "description": "Do 15 minutes of any physical activity - walking, stretching, or light exercise",
                "elo_reward": 60,
                "difficulty": "easy",
                "category": "fitness"
            }
        ]
        
        # Remove old available quests
        available = supabase.table("user_quests").select("id").eq("user_id", user_id).eq("status", "available").execute().data
        if available:
            for uq in available:
                supabase.table("user_quests").update({"status": "removed"}).eq("id", uq["id"]).execute()
        
        # Insert and assign fallback quests
        for q in fallback_quests:
            supabase.table("quests").upsert({
                "id": q["id"],
                "title": q["title"],
                "description": q["description"],
                "elo_reward": q["elo_reward"],
                "difficulty": q["difficulty"],
                "category": q["category"],
                "created_by_llm": True
            }).execute()
            
            supabase.table("user_quests").insert({
                "user_id": user_id,
                "quest_id": q["id"],
                "status": "available"
            }).execute()
        
        print(f"Successfully assigned {len(fallback_quests)} fallback quests to user {user_id}")
        return {"quests": fallback_quests}
        
    except Exception as e:
        print(f"Error generating fallback quests: {e}")
        return {"error": "Failed to generate quests. Please try again later."}

def get_in_progress_quests(user_id):
    try:
        # Add retry logic for Supabase connection
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = supabase.table("user_quests").select("*, quests(*)") \
                    .eq("user_id", user_id).eq("status", "in_progress") \
                    .order("date_accepted", desc=True).execute()
                return convert_datetime_to_string(getattr(response, 'data', None)) if getattr(response, 'data', None) else []
            except Exception as e:
                print(f"In-progress quests attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    raise e
    except Exception as e:
        print(f"Error fetching in-progress quests: {e}")
        return []

def get_completed_quests(user_id):
    try:
        # Add retry logic for Supabase connection
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = supabase.table("user_quests").select("*, quests(*)") \
                    .eq("user_id", user_id).eq("status", "completed") \
                    .order("date_completed", desc=True).execute()
                return convert_datetime_to_string(getattr(response, 'data', None)) if getattr(response, 'data', None) else []
            except Exception as e:
                print(f"Completed quests attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    raise e
    except Exception as e:
        print(f"Error fetching completed quests: {e}")
        return []
