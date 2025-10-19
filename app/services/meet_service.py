import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.db import get_db, add_record, query_records, update_record_by_id
from app.models.meet_data import MeetRecord as MeetRecordDB
from app.schemas.meet_schema import MeetRecord


async def create_room(
    db: Session,
    host_id: str, 
    room_title: str = "", 
    room_description: str = "",
    password: str | None = None, 
    max_participants: int = 10
):
    # Generate user-friendly short ID (32-bit = 8 hex chars)
    easy_room_id = secrets.token_hex(4)
    
    # Generate unique MiroTalk room name
    mirotalk_room_id = f"SamaConnect_{secrets.token_urlsafe(12)}"
    
    created_at = datetime.utcnow()
    
    # Create database record
    meet_record = MeetRecordDB(
        room_id=easy_room_id,
        host_id=host_id,
        server_room_id=mirotalk_room_id,
        room_title=room_title,
        room_description=room_description,
        password=password,
        participants=[],
        created_at=created_at,
        ended_at=None,
        is_active=True,
        max_participants=max_participants
    )
    
    # Persist to database
    result = await add_record(db, meet_record)
    
    if not result:
        return {"error": "Failed to create room"}
    
    # Build MiroTalk SFU embed URL (FREE, supports 10+ participants, allows iframe)
    mirotalk_base_url = "https://sfu.mirotalk.com"
    embed_url = f"{mirotalk_base_url}/join?room={mirotalk_room_id}"
    
    # For not auto-password, uncomment the line below:
    if password:
        embed_url += f"&roomPassword={password}"
    
    # Add room name/title if provided
    if room_title:
        embed_url += f"&roomName={room_title.replace(' ', '+')}"
    
    return {
        "room_id": easy_room_id,
        "mirotalk_room_id": mirotalk_room_id,
        "join_link": f"/room/{easy_room_id}",
        "embed_url": embed_url,
        "password_protected": password is not None,
        "created_at": created_at.isoformat()
    }


async def get_meet(db: Session, room_id: str):
    # Fetch meeting room by room_id from database
    try:
        room = db.query(MeetRecordDB).filter(
            MeetRecordDB.room_id == room_id
        ).first()
        return room
    except Exception as e:
        print(f"Error fetching room: {e}")
        return None


async def join_room(db: Session, room_id: str, user_id: str, display_name: str = None,password:str=None):
    # Fetch room from database
    room = await get_meet(db, room_id)
    
    if not room:
        return {"error": "Room not found"}
    
    if not room.is_active:
        return {"error": "Room has ended"}
    
    if room.password:
        if password != room.password:
            return {"error": "Incorrect password"}
    
    # Convert to set to check efficiently
    participants_set = set(room.participants)
    
    # Check max participants limit only for new users
    if user_id not in participants_set and len(participants_set) >= room.max_participants:
        return {"error": "Room full"}
    
    # Add participant only if not already in list (allows rejoin)
    if user_id not in participants_set:
        participants_set.add(user_id)
        updated_participants = list(participants_set)
        
        # Update database only if new participant
        try:
            room.participants = updated_participants
            db.commit()
            db.refresh(room)
        except Exception as e:
            db.rollback()
            print(f"Error joining room: {e}")
            return {"error": "Failed to join room"}
    
    # Build MiroTalk SFU embed URL (supports 10+ participants)
    embed_url = f"https://sfu.mirotalk.com/join?room={room.server_room_id}"
    
    # NOTE: Password NOT included in URL - users must enter it manually
    # For auto-password, uncomment the line below:
    # if room.password:
    #     embed_url += f"&password={room.password}"
    
    # Add user display name (SFU uses 'name' parameter)
    if display_name:
        embed_url += f"&name={display_name.replace(' ', '+')}"
    else:
        embed_url += f"&name=User_{user_id}"
    
    # Return room info (works for both new join and rejoin)
    return {
        "status": "joined",
        "room_id": room_id,
        "mirotalk_room_id": room.server_room_id,
        "embed_url": embed_url,
        "participant_count": len(room.participants)
    }


async def leave_room(db: Session, room_id: str, user_id: str):
    # Fetch room from database
    room = await get_meet(db, room_id)
    
    if not room:
        return {"error": "Room not found"}
    
    if not room.is_active:
        return {"error": "Room has ended"}
    
    # No removal - participants stay in list for record keeping
    # Just verify user was in the room
    if user_id not in room.participants:
        return {"error": "User not in room"}
    
    return {
        "status": "left",
        "room_id": room_id,
        "participant_count": len(room.participants)
    }


async def end_room(db: Session, room_id: str):
    # Fetch room from database
    room = await get_meet(db, room_id)
    
    if not room:
        return {"error": "Room not found"}
    
    if not room.is_active:
        return {"error": "Room already ended"}
    
    # Only update end time and active status
    try:
        room.ended_at = datetime.utcnow()
        room.is_active = False
        db.commit()
        db.refresh(room)
        
        return {
            "status": "ended",
            "room_id": room_id,
            "ended_at": room.ended_at.isoformat(),
            "total_participants": len(room.participants)
        }
    except Exception as e:
        db.rollback()
        print(f"Error ending room: {e}")
        return {"error": "Failed to end room"}


async def get_active_rooms(db: Session, host_id: str = None, limit: int = 10):
    # Get list of active rooms, optionally filtered by host
    filters = {"is_active": True}
    if host_id:
        filters["host_id"] = host_id
    
    rooms = await query_records(db, MeetRecordDB, filters=filters, limit=limit)
    
    # Return formatted room list
    return [
        {
            "room_id": room.room_id,
            "mirotalk_room_id": room.server_room_id,
            "room_title": room.room_title,
            "host_id": room.host_id,
            "participant_count": len(room.participants),
            "max_participants": room.max_participants,
            "created_at": room.created_at.isoformat(),
            "password_protected": room.password is not None
        }
        for room in rooms
    ]


async def verify_room_password(db: Session, room_id: str, password: str):
    # Verify if provided password matches room's password
    room = await get_meet(db, room_id)
    
    if not room:
        return False
    
    # If no password set, allow access
    if room.password is None:
        return True
    
    # Check password match
    return room.password == password


async def get_room_participants(db: Session, room_id: str):
    # Get list of participant IDs in a room
    room = await get_meet(db, room_id)
    
    if not room:
        return {"error": "Room not found"}
    
    return {
        "room_id": room_id,
        "participants": room.participants,
        "participant_count": len(room.participants),
        "max_participants": room.max_participants
    }