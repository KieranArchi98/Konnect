from typing import Dict, Any, Optional
from datetime import date, datetime, timedelta
import io
from app.services.db_service import supabase


class UserProfileService:
    def __init__(self):
        self.supabase = supabase

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user profile data including leveling and streaks."""
        try:
            # Get user data
            user_data = await self._get_user_by_id(user_id)
            if not user_data:
                return None

            # Get active quests count
            active_quests = await self._get_active_quests_count(user_id)
            
            # Get AI agent stats
            agent_stats = await self._get_agent_stats(user_id)
            
            # Get weekly stats
            weekly_stats = await self._get_weekly_stats(user_id)
            
            # Get achievements
            achievements = await self._get_user_achievements(user_id)
            
            # Get story progress
            story_progress = await self._get_story_progress(user_id)

            return {
                "user": user_data,
                "active_quests": active_quests,
                "agent_stats": agent_stats,
                "weekly_stats": weekly_stats,
                "achievements": achievements,
                "story_progress": story_progress
            }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None

    async def _get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """Get user data by ID."""
        try:
            response = self.supabase.table("users").select("*").eq("id", user_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None

    async def _get_active_quests_count(self, user_id: str) -> int:
        """Get count of active quests for user."""
        try:
            response = self.supabase.table("user_quests").select("id", count="exact").eq("user_id", user_id).eq("status", "active").execute()
            return response.count if hasattr(response, 'count') else 0
        except Exception as e:
            print(f"Error getting active quests count: {e}")
            return 0

    async def _get_agent_stats(self, user_id: str) -> Dict[str, Any]:
        """Get AI agent workforce stats."""
        try:
            response = self.supabase.table("user_agent_stats").select("*").eq("user_id", user_id).single().execute()
            
            if response.data:
                return response.data
            else:
                # Create default stats if none exist
                return {
                    "total_agents_used": 0,
                    "active_agents": 0,
                    "completed_tasks": 0,
                    "total_efficiency": 0.0
                }
        except Exception as e:
            print(f"Error getting agent stats: {e}")
            return {
                "total_agents_used": 0,
                "active_agents": 0,
                "completed_tasks": 0,
                "total_efficiency": 0.0
            }

    async def _get_weekly_stats(self, user_id: str) -> Dict[str, Any]:
        """Get current week's stats."""
        try:
            # Get current week start (Monday)
            current_week_start = date.today() - timedelta(days=date.today().weekday())
            
            response = self.supabase.table("user_weekly_stats").select("*").eq("user_id", user_id).eq("week_start_date", current_week_start.isoformat()).single().execute()
            
            if response.data:
                return response.data
            else:
                return {
                    "quests_completed": 0,
                    "tasks_completed": 0,
                    "hours_learned": 0.0,
                    "skills_improved": 0,
                    "ai_interactions": 0,
                    "total_points": 0
                }
        except Exception as e:
            print(f"Error getting weekly stats: {e}")
            return {
                "quests_completed": 0,
                "tasks_completed": 0,
                "hours_learned": 0.0,
                "skills_improved": 0,
                "ai_interactions": 0,
                "total_points": 0
            }

    async def _get_user_achievements(self, user_id: str) -> list:
        """Get user's unlocked achievements."""
        try:
            response = self.supabase.table("user_achievements").select("*, achievements!inner(*)").eq("user_id", user_id).order("unlocked_at", desc=True).limit(10).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting user achievements: {e}")
            return []

    async def _get_story_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user's story progression."""
        try:
            response = self.supabase.table("user_story_progress").select("*").eq("user_id", user_id).single().execute()
            
            if response.data:
                return response.data
            else:
                # Create default story progress if none exists
                return {
                    "current_chapter": 1,
                    "completed_chapters": 0,
                    "total_chapters": 10,
                    "story_points": 0
                }
        except Exception as e:
            print(f"Error getting story progress: {e}")
            return {
                "current_chapter": 1,
                "completed_chapters": 0,
                "total_chapters": 10,
                "story_points": 0
            }

    async def complete_quest(self, user_id: str, quest_id: str) -> Dict[str, Any]:
        """Complete a quest and update user stats."""
        try:
            # Get quest details
            quest_response = self.supabase.table("quests").select("elo_reward").eq("id", quest_id).single().execute()
            
            if not quest_response.data:
                return {"success": False, "error": "Quest not found"}
            
            elo_reward = quest_response.data['elo_reward']
            
            # Update user quest status
            self.supabase.table("user_quests").update({"status": "completed", "date_completed": datetime.utcnow().isoformat()}).eq("user_id", user_id).eq("quest_id", quest_id).execute()
            
            # Get current user ELO and update it
            current_user = await self._get_user_by_id(user_id)
            new_elo = current_user['elo'] + elo_reward
            self.supabase.table("users").update({"elo": new_elo}).eq("id", user_id).execute()
            
            # Get updated user data
            user_data = await self._get_user_by_id(user_id)
            
            return {
                "success": True,
                "elo_gained": elo_reward,
                "new_elo": user_data['elo'],
                "new_level": user_data['level'],
                "experience": user_data['experience'],
                "experience_to_next_level": user_data['experience_to_next_level']
            }
        except Exception as e:
            print(f"Error completing quest: {e}")
            return {"success": False, "error": str(e)}

    async def get_level_info(self, elo: int) -> Dict[str, Any]:
        """Get level information based on ELO."""
        try:
            level = max(1, (elo // 100) + 1)
            experience = elo % 100
            experience_to_next = 100
            
            # Calculate level titles
            titles = {
                1: "Novice",
                2: "Apprentice", 
                3: "Explorer",
                4: "Adventurer",
                5: "Veteran",
                6: "Expert",
                7: "Master",
                8: "Grandmaster",
                9: "Legend",
                10: "Mythic"
            }
            
            title = titles.get(level, f"Level {level}")
            
            return {
                "level": level,
                "title": title,
                "experience": experience,
                "experience_to_next_level": experience_to_next,
                "elo": elo
            }
        except Exception as e:
            print(f"Error getting level info: {e}")
            return {
                "level": 1,
                "title": "Novice",
                "experience": 0,
                "experience_to_next_level": 100,
                "elo": 0
            } 