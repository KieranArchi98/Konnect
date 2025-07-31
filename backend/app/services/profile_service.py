from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.utils.config import settings
from supabase import create_client, Client

class ProfileService:
    def __init__(self):
        self.supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

    async def get_user_profile_data(self, user_id: str) -> Dict[str, Any]:
        """Get basic user profile data using only existing database tables"""
        try:
            print(f"[ProfileService] Getting profile data for user_id: {user_id}")
            
            # Get user data - only use fields that exist
            try:
                user_response = self.supabase.table("users").select("id, email, display_name, elo, level").eq("id", user_id).single().execute()
                user_data = user_response.data
                print(f"[ProfileService] User data response: {user_data}")
            except Exception as e:
                print(f"[ProfileService] Error getting user data: {e}")
                return None
            
            if not user_data:
                print(f"[ProfileService] No user data found for user_id: {user_id}")
                return None

            # Get basic stats that we know exist
            try:
                # Get user quests count
                user_quests_response = self.supabase.table("user_quests").select("id").eq("user_id", user_id).execute()
                total_quests = len(user_quests_response.data) if user_quests_response.data else 0
                
                # Get active quests count
                active_quests_response = self.supabase.table("user_quests").select("id").eq("user_id", user_id).eq("status", "active").execute()
                active_quests = len(active_quests_response.data) if active_quests_response.data else 0
                
                # Get completed quests count
                completed_quests_response = self.supabase.table("user_quests").select("id").eq("user_id", user_id).eq("status", "completed").execute()
                completed_quests = len(completed_quests_response.data) if completed_quests_response.data else 0
                
                print(f"[ProfileService] Quests - Total: {total_quests}, Active: {active_quests}, Completed: {completed_quests}")
            except Exception as e:
                print(f"[ProfileService] Error getting quest stats: {e}")
                total_quests = 0
                active_quests = 0
                completed_quests = 0

            # Get agent tasks count
            try:
                agent_tasks_response = self.supabase.table("agent_tasks").select("id").eq("user_id", user_id).execute()
                total_agent_tasks = len(agent_tasks_response.data) if agent_tasks_response.data else 0
                print(f"[ProfileService] Agent tasks: {total_agent_tasks}")
            except Exception as e:
                print(f"[ProfileService] Error getting agent tasks: {e}")
                total_agent_tasks = 0

            # Get files count
            try:
                files_response = self.supabase.table("files").select("id").eq("user_id", user_id).execute()
                total_files = len(files_response.data) if files_response.data else 0
                print(f"[ProfileService] Files: {total_files}")
            except Exception as e:
                print(f"[ProfileService] Error getting files: {e}")
                total_files = 0

            # Create simple achievements based on basic stats
            achievements = []
            
            if completed_quests > 0:
                achievements.append({
                    "id": 1,
                    "name": "Quest Beginner",
                    "description": "Complete your first quest",
                    "icon": "🎯",
                    "reward_points": 50,
                    "unlocked": True
                })
            
            if completed_quests >= 5:
                achievements.append({
                    "id": 2,
                    "name": "Quest Master",
                    "description": "Complete 5 quests",
                    "icon": "⚡",
                    "reward_points": 100,
                    "unlocked": True
                })
            
            if total_agent_tasks > 0:
                achievements.append({
                    "id": 3,
                    "name": "AI Collaborator",
                    "description": "Use AI agents",
                    "icon": "🤖",
                    "reward_points": 80,
                    "unlocked": True
                })
            
            if total_files > 0:
                achievements.append({
                    "id": 4,
                    "name": "File Manager",
                    "description": "Upload your first file",
                    "icon": "📁",
                    "reward_points": 60,
                    "unlocked": True
                })

            # Calculate simple story progress
            story_progress = {
                "current_chapter": min(user_data.get('level', 1), 10),
                "total_chapters": 10,
                "completed_chapters": len(achievements),
                "story_points": sum(achievement.get('reward_points', 0) for achievement in achievements)
            }

            # Return simplified profile data
            profile_data = {
                'user': {
                    'id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'display_name': user_data.get('display_name'),
                    'elo': user_data.get('elo', 0),
                    'level': user_data.get('level', 1)
                },
                'current_streak': 0,  # Placeholder
                'longest_streak': 0,  # Placeholder
                'active_quests': active_quests,
                'weekly_stats': {
                    'quests_completed': completed_quests,
                    'tasks_completed': total_agent_tasks,
                    'hours_learned': round(total_agent_tasks * 0.5, 1),  # Estimate
                    'total_points': user_data.get('elo', 0),
                    'effort_rate': round((completed_quests / max(total_quests, 1)) * 100, 1)
                },
                'agent_stats': {
                    'total_agents_used': 1 if total_agent_tasks > 0 else 0,
                    'active_agents': 0,  # Placeholder
                    'completed_tasks': total_agent_tasks,
                    'total_efficiency': 0.8  # Placeholder
                },
                'achievements': achievements,
                'story_progress': story_progress,
                'weekly_metrics': []  # Placeholder for charts
            }
            
            print(f"[ProfileService] Successfully generated profile data")
            return profile_data

        except Exception as e:
            print(f"[ProfileService] Error getting user profile data: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def complete_quest(self, user_id: str, quest_id: str) -> Dict[str, Any]:
        """Complete a quest (basic version)"""
        try:
            # Get quest details from user_quests table
            quest_response = self.supabase.table("user_quests").select("*").eq("user_id", user_id).eq("quest_id", quest_id).eq("status", "active").single().execute()
            quest = quest_response.data

            if not quest:
                return {'success': False, 'error': 'Quest not found or already completed'}

            # Update quest status in user_quests table
            self.supabase.table("user_quests").update({
                "status": "completed",
                "date_completed": datetime.now().isoformat()
            }).eq("user_id", user_id).eq("quest_id", quest_id).execute()

            # Get quest template to get ELO reward
            quest_template_response = self.supabase.table("quests").select("elo_reward").eq("id", quest_id).single().execute()
            elo_reward = quest_template_response.data.get('elo_reward', 10) if quest_template_response.data else 10

            # Award ELO
            # Get current user ELO first
            user_response = self.supabase.table("users").select("elo").eq("id", user_id).single().execute()
            current_elo = user_response.data.get('elo', 0) if user_response.data else 0
            self.supabase.table("users").update({
                "elo": current_elo + elo_reward
            }).eq("id", user_id).execute()

            return {'success': True, 'elo_earned': elo_reward}

        except Exception as e:
            print(f"Error completing quest: {e}")
            return {'success': False, 'error': str(e)}

    async def log_daily_metrics(self, user_id: str, metrics: Dict[str, Any]):
        """Log daily metrics (placeholder until table exists)"""
        # This will be implemented once the user_daily_metrics table exists
        pass 