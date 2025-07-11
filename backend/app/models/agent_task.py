from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base
import enum

class TaskStatus(enum.Enum):
    pending = "pending"
    active = "active"
    completed = "completed"
    failed = "failed"

class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    input = Column(Text, nullable=False)
    output = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending, nullable=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    agent = relationship("Agent", back_populates="tasks")
    user = relationship("User")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    capabilities = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)

    tasks = relationship("AgentTask", back_populates="agent")

# MIGRATION: Insert the Email Agent into the agents table
# SQL:
# INSERT INTO agents (name, description, capabilities, is_active)
# VALUES (
#   'Email Agent',
#   'Sends professional, friendly emails via Outlook. Reformats user input and handles email delivery.',
#   'Email sending, LLM reformatting, Outlook API integration',
#   TRUE
# );
