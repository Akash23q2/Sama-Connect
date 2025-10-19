import { API_CONFIG } from '@/config/api';
import type { User, AuthToken } from '@/types';

export interface CreateMeetData {
  host_id: string;
  room_title?: string;
  room_description?: string;
  password?: string;
  max_participants?: number;
}

export interface JoinMeetData {
  user_id: string;
  display_name: string;
  password?: string;
}

export interface MeetRoom {
  room_id: string;
  host_id: string;
  room_title: string;
  room_description: string;
  is_protected: boolean;
  participants: string[];
  max_participants: number;
  is_active: boolean;
  created_at: string;
  ended_at: string | null;
}

export interface MeetResponse {
  status: string;
  room_id: string;
  mirotalk_room_id: string;
  embed_url: string;
  participant_count: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders(),
      ...options,
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
      } catch (e) {
        throw new Error(response.statusText || 'Request failed');
      }
    }

    return response.json();
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: {
    username: string;
    name: string;
    age: number;
    email: string;
    password: string;
    location?: string;
    gender?: string;
  }): Promise<{ msg: string }> {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(username: string, password: string): Promise<AuthToken> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  // User endpoints
  async getMe(): Promise<User> {
    return this.request('/users/me/');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request('/update_profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Meeting endpoints
  async createMeet(data: CreateMeetData): Promise<MeetResponse> {
    return this.request('/meet/room/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeet(roomId: string): Promise<MeetRoom> {
    const response = await fetch(`${this.baseUrl}/meet/room/${roomId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get room details');
    }

    return response.json();
  }

  async joinMeet(roomId: string, data: JoinMeetData): Promise<MeetResponse> {
    const params = new URLSearchParams({
      user_id: data.user_id,
      display_name: data.display_name,
    });
    if (data.password) {
      params.append('password', data.password);
    }
    
    const response = await fetch(`${this.baseUrl}/meet/room/${roomId}/join?${params.toString()}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('❌ Join room error details:', error);
        throw new Error(error.detail || error.message || 'Failed to join room');
      } catch (e) {
        console.error('❌ Join room error (no JSON):', response.status, response.statusText);
        throw new Error(`Failed to join room: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  async leaveMeet(roomId: string, userId: string): Promise<{ status: string }> {
    return this.request(`/meet/room/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async endMeet(roomId: string): Promise<{ status: string }> {
    return this.request(`/meet/room/${roomId}/end`, {
      method: 'POST',
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}

export const apiService = new ApiService();
