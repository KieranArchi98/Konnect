from fastapi import APIRouter
import requests
from app.utils.config import settings

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
    return {
        "deadlines": "3 days",
        "todo": "3 tasks",
        "habits": "2/5 completed",
        "news": news if isinstance(news, list) else []
    }
