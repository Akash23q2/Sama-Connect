from sqlalchemy import Column, String, Boolean, Integer, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
from app.services.db import Base
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.types import JSON

class MeetRecord(Base):
    __tablename__ = "meet_record"
    room_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id = Column(String, nullable=False)
    server_room_id = Column(String, nullable=True)
    room_title = Column(String, nullable=False)
    room_description = Column(String, nullable=True)
    password = Column(String, nullable=True)  # non-hashed password for simplicity
    participants = Column(MutableList.as_mutable(JSON), default=list)  # stores list of strings, append user ids when join requested
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    ended_at = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True)
    max_participants = Column(Integer, default=10)
__export__ = ["MeetRecord"]