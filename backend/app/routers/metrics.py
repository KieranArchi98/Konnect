from fastapi import APIRouter
import requests
from app.utils.config import settings
from app.services.db_service import supabase

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/")
async def get_metrics():
    news = []
    try:
        url = f"https://newsapi.org/v2/top-headlines?language=en&pageSize=3&apiKey={settings.news_api_key}"
        response = requests.get(url)
        data = response.json()
        print("NewsAPI response:", data)  # Debug log
        if data.get("status") == "ok" and "articles" in data:
            news = [
                {
                    "title": article.get("title", ""),
                    "url": article.get("url", ""),
                    "source": article.get("source", {}).get("name", "")
                }
                for article in data.get("articles", [])
            ]
    except Exception as e:
        print("NewsAPI error:", e)
        news = []
    
    # Get performance insights data from database
    try:
        # Get active quests count
        quests_response = supabase.table("user_quests").select("id", count="exact").eq("status", "active").execute()
        active_quests = quests_response.count if hasattr(quests_response, 'count') else 5
        
        # Get AI agents count (from agent_tasks or default)
        try:
            agents_response = supabase.table("agent_tasks").select("agent_id").execute()
            unique_agents = set()
            if agents_response.data:
                for task in agents_response.data:
                    if task.get('agent_id'):
                        unique_agents.add(task['agent_id'])
            ai_agents = len(unique_agents) if unique_agents else 3
        except Exception as e:
            print(f"Error fetching agent stats: {e}")
            ai_agents = 3
        
        # Get completion rate (from quests or default)
        completed_response = supabase.table("user_quests").select("id", count="exact").eq("status", "completed").execute()
        completed_quests = completed_response.count if hasattr(completed_response, 'count') else 0
        total_quests = active_quests + completed_quests
        completion_rate = round((completed_quests / total_quests * 100) if total_quests > 0 else 85, 1)
        
        # Get files stored count (using correct table name)
        try:
            files_response = supabase.table("files").select("id", count="exact").execute()
            files_stored = files_response.count if hasattr(files_response, 'count') else 12
        except Exception as e:
            print(f"Error fetching files count: {e}")
            files_stored = 12
        
    except Exception as e:
        print(f"Error fetching performance insights: {e}")
        # Use fallback values if database query fails
        active_quests = 5
        ai_agents = 3
        completion_rate = 85
        files_stored = 12
    
    return {
        "deadlines": "3 days",
        "todo": "3 tasks",
        "habits": "2/5 completed",
        "news": news if isinstance(news, list) else [],
        "activeQuests": active_quests,
        "aiAgents": ai_agents,
        "completionRate": completion_rate,
        "filesStored": files_stored
    }
