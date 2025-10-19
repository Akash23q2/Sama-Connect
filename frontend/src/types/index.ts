export interface User {
  username: string;
  name: string;
  age: number;
  location?: string;
  gender?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface MeetRoom {
  room_id: string;
  host_id: string;
  room_title: string;
  room_description: string;
  participants: string[];
  is_active: boolean;
  max_participants: number;
  created_at?: string;
  ended_at?: string;
}

export interface Participant {
  user_id: string;
  display_name: string;
  mic_muted: boolean;
  cam_off: boolean;
  hand_raised: boolean;
  peer_id?: string;
}

export interface ChatMessage {
  user_id: string;
  display_name: string;
  message: string;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'mic_update' | 'cam_update' | 'hand_update' | 'chat' | 'host_force_mic' | 'host_force_cam';
  user_id: string;
  display_name?: string;
  message?: string;
  timestamp?: string;
  mic_muted?: boolean;
  cam_off?: boolean;
  hand_raised?: boolean;
}
