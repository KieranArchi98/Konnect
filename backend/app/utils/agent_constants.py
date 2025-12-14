"""
Agent constants for consistent ID mapping across the application
"""

# Agent IDs
EMAIL_AGENT_ID = 1
QUEST_AGENT_ID = 2
QUERY_AGENT_ID = 3
IDEAS_AGENT_ID = 8
QUOTE_AGENT_ID = 5
AGENT_X_ID = 'X'
AGENT_Y_ID = 'Y'
AGENT_Z_ID = 'Z'

# Agent Names
EMAIL_AGENT_NAME = "Email Agent"
QUEST_AGENT_NAME = "Quest Agent"
QUERY_AGENT_NAME = "Query Agent"
IDEAS_AGENT_NAME = "Ideas Agent"
QUOTE_AGENT_NAME = "Quote Agent"
AGENT_X_NAME = "Agent X"
AGENT_Y_NAME = "Agent Y"
AGENT_Z_NAME = "Agent Z"

# Agent ID to Name mapping
AGENT_ID_TO_NAME = {
    EMAIL_AGENT_ID: EMAIL_AGENT_NAME,
    QUEST_AGENT_ID: QUEST_AGENT_NAME,
    QUERY_AGENT_ID: QUERY_AGENT_NAME,
    IDEAS_AGENT_ID: IDEAS_AGENT_NAME,
    QUOTE_AGENT_ID: QUOTE_AGENT_NAME,
    AGENT_X_ID: AGENT_X_NAME,
    AGENT_Y_ID: AGENT_Y_NAME,
    AGENT_Z_ID: AGENT_Z_NAME,
}

# Agent Name to ID mapping
AGENT_NAME_TO_ID = {
    EMAIL_AGENT_NAME: EMAIL_AGENT_ID,
    QUEST_AGENT_NAME: QUEST_AGENT_ID,
    QUERY_AGENT_NAME: QUERY_AGENT_ID,
    IDEAS_AGENT_NAME: IDEAS_AGENT_ID,
    QUOTE_AGENT_NAME: QUOTE_AGENT_ID,
    AGENT_X_NAME: AGENT_X_ID,
    AGENT_Y_NAME: AGENT_Y_ID,
    AGENT_Z_NAME: AGENT_Z_ID,
}

def get_agent_name(agent_id) -> str:
    """Get agent name by ID"""
    return AGENT_ID_TO_NAME.get(agent_id, f"Agent {agent_id}")

def get_agent_id(agent_name: str):
    """Get agent ID by name"""
    return AGENT_NAME_TO_ID.get(agent_name, 0)

def is_email_agent(agent_id) -> bool:
    """Check if agent is Email Agent"""
    return agent_id == EMAIL_AGENT_ID

def is_quest_agent(agent_id) -> bool:
    """Check if agent is Quest Agent"""
    return agent_id == QUEST_AGENT_ID

def is_query_agent(agent_id) -> bool:
    """Check if agent is Query Agent"""
    return agent_id == QUERY_AGENT_ID

def is_ideas_agent(agent_id) -> bool:
    """Check if agent is Ideas Agent"""
    return agent_id == IDEAS_AGENT_ID

def is_quote_agent(agent_id) -> bool:
    """Check if agent is Quote Agent"""
    return agent_id == QUOTE_AGENT_ID

def is_agent_x(agent_id) -> bool:
    """Check if agent is Agent X"""
    return agent_id == AGENT_X_ID

def is_agent_y(agent_id) -> bool:
    """Check if agent is Agent Y"""
    return agent_id == AGENT_Y_ID

def is_agent_z(agent_id) -> bool:
    """Check if agent is Agent Z"""
    return agent_id == AGENT_Z_ID 