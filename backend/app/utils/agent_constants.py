"""
Agent constants for consistent ID mapping across the application
"""

# Agent IDs
EMAIL_AGENT_ID = 1
QUEST_AGENT_ID = 2
QUERY_AGENT_ID = 3
IDEAS_AGENT_ID = 8

# Agent Names
EMAIL_AGENT_NAME = "Email Agent"
QUEST_AGENT_NAME = "Quest Agent"
QUERY_AGENT_NAME = "Query Agent"
IDEAS_AGENT_NAME = "Ideas Agent"

# Agent ID to Name mapping
AGENT_ID_TO_NAME = {
    EMAIL_AGENT_ID: EMAIL_AGENT_NAME,
    QUEST_AGENT_ID: QUEST_AGENT_NAME,
    QUERY_AGENT_ID: QUERY_AGENT_NAME,
    IDEAS_AGENT_ID: IDEAS_AGENT_NAME,
}

# Agent Name to ID mapping
AGENT_NAME_TO_ID = {
    EMAIL_AGENT_NAME: EMAIL_AGENT_ID,
    QUEST_AGENT_NAME: QUEST_AGENT_ID,
    QUERY_AGENT_NAME: QUERY_AGENT_ID,
    IDEAS_AGENT_NAME: IDEAS_AGENT_ID,
}

def get_agent_name(agent_id: int) -> str:
    """Get agent name by ID"""
    return AGENT_ID_TO_NAME.get(agent_id, f"Agent {agent_id}")

def get_agent_id(agent_name: str) -> int:
    """Get agent ID by name"""
    return AGENT_NAME_TO_ID.get(agent_name, 0)

def is_email_agent(agent_id: int) -> bool:
    """Check if agent is Email Agent"""
    return agent_id == EMAIL_AGENT_ID

def is_quest_agent(agent_id: int) -> bool:
    """Check if agent is Quest Agent"""
    return agent_id == QUEST_AGENT_ID

def is_query_agent(agent_id: int) -> bool:
    """Check if agent is Query Agent"""
    return agent_id == QUERY_AGENT_ID

def is_ideas_agent(agent_id: int) -> bool:
    """Check if agent is Ideas Agent"""
    return agent_id == IDEAS_AGENT_ID 