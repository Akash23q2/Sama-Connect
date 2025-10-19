from pydantic import BaseModel
from datetime import datetime
from pydantic import Field

class MeetRecord(BaseModel):
    room_id:str
    host_id:str
    server_room_id:str
    room_title:str
    room_description:str
    password: str | None = None
    participants:list[str]=Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None
    is_active: bool = True
    max_participants: int = 10
    