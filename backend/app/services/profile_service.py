from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

class ProfileService:
    def __init__(self):
        # No database connection for now
        pass

    async def get_user_profile_data(self, user_id: str) -> Dict[str, Any]:
        """Get basic user profile data with dummy data for everything else"""
        try:
            print(f"[ProfileService] Getting profile data for user_id: {user_id}")
            
            # Use dummy user data based on user_id
            print(f"[ProfileService] Using dummy user data")
            user_data = {
                'id': user_id,
                'email': f'user-{user_id[:8]}@example.com',
                'display_name': f'User {user_id[:8]}',
                'elo': 250,  # Dummy ELO
                'level': 3    # Dummy level
            }

            # Use dummy data for everything else
            print(f"[ProfileService] Using dummy data for all other fields")
            
            # Dummy achievements
            achievements = [
                {
                    "id": 1,
                    "name": "Welcome",
                    "description": "Join the productivity journey",
                    "icon": "🎯",
                    "reward_points": 50,
                    "unlocked": True
                },
                {
                    "id": 2,
                    "name": "Getting Started",
                    "description": "Reach level 2",
                    "icon": "⚡",
                    "reward_points": 100,
                    "unlocked": True
                },
                {
                    "id": 3,
                    "name": "Progress Maker",
                    "description": "Reach level 3",
                    "icon": "🤖",
                    "reward_points": 150,
                    "unlocked": True
                }
            ]

            # Dummy story progress
            story_progress = {
                "current_chapter": 3,
                "total_chapters": 10,
                "completed_chapters": 2,
                "story_points": 150
            }

            # Assemble final profile data with dummy values
            print(f"[ProfileService] Assembling final profile data...")
            profile_data = {
                'user': {
                    'id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'display_name': user_data.get('display_name'),
                    'elo': user_data.get('elo', 0),
                    'level': user_data.get('level', 1),
                    'experience': user_data.get('elo', 0) % 100,  # Calculate from ELO
                    'experience_to_next_level': 100
                },
                'current_streak': 5,  # Dummy
                'longest_streak': 12,  # Dummy
                'active_quests': 3,  # Dummy
                'weekly_stats': {
                    'quests_completed': 7,  # Dummy
                    'tasks_completed': 15,  # Dummy
                    'hours_learned': 8.5,  # Dummy
                    'total_points': user_data.get('elo', 0),  # Use actual ELO
                    'effort_rate': 85.5  # Dummy
                },
                'agent_stats': {
                    'total_agents_used': 4,  # Dummy
                    'active_agents': 2,  # Dummy
                    'completed_tasks': 23,  # Dummy
                    'total_efficiency': 0.87  # Dummy
                },
                'achievements': achievements,
                'story_progress': story_progress,
                'weekly_metrics': []  # Dummy
            }
            
            print(f"[ProfileService] Profile data assembled successfully")
            print(f"[ProfileService] User: {profile_data['user']['display_name']} (Level {profile_data['user']['level']}, ELO {profile_data['user']['elo']})")
            return profile_data

        except Exception as e:
            print(f"[ProfileService] Error getting user profile data: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def complete_quest(self, user_id: str, quest_id: str) -> Dict[str, Any]:
        """Complete a quest (basic version)"""
        try:
            # Return dummy success response
            return {'success': True, 'elo_earned': 10}
        except Exception as e:
            print(f"Error completing quest: {e}")
            return {'success': False, 'error': str(e)}

    async def log_daily_metrics(self, user_id: str, metrics: Dict[str, Any]):
        """Log daily metrics (placeholder until table exists)"""
        # This will be implemented once the user_daily_metrics table exists
        pass 