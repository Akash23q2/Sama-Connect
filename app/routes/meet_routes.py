## imports
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.schemas.meet_schema import MeetRecord as MeetRoom
from app.services.meet_service import (
    create_room, join_room, leave_room, end_room,
    get_meet
)
from app.services.db import get_db
from sqlalchemy.orm import Session 
meet_router = APIRouter(prefix="/meet/room", tags=["Meet Rooms"])

##endpoints##
@meet_router.post("/create")
async def create_meet_endpoint(
    host_id: str,
    room_title: str = "",
    room_description: str = "",
    password: Optional[str] = None,
    max_participants: int = 10,
    db: Session = Depends(get_db)
):
    return await create_room(db,host_id, room_title, room_description, password, max_participants)


@meet_router.get("/{room_id}")
async def get_meet_endpoint(room_id: str, db: Session = Depends(get_db)):
    meet = await get_meet(db,room_id)
    if not meet:
        raise HTTPException(status_code=404, detail="Room not found")
    # Return a lightweight room summary
    return {
        "room_id": room_id,
        "host_id": meet.host_id,
        "room_title": meet.room_title,
        "room_description": meet.room_description,
        "participants": list(meet.participants),
        "is_active": meet.is_active,
        "max_participants": meet.max_participants,
        "require_password": meet.password is not None
    }


@meet_router.post("/{room_id}/join")
async def join_meet_endpoint(room_id: str, user_id: str, display_name: str, password:str=None,db: Session = Depends(get_db)):
    result = await join_room(db,room_id, user_id, display_name,password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@meet_router.post("/{room_id}/leave")
async def leave_meet_endpoint(room_id: str, user_id: str, db: Session = Depends(get_db)):
    result = await leave_room(db,room_id, user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@meet_router.post("/{room_id}/end")
async def end_meet_endpoint(room_id: str, db: Session = Depends(get_db)):
    result = await end_room(db,room_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
