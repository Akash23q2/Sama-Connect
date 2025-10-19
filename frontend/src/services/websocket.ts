import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import type { WebSocketMessage } from '@/types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];

  connect(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${API_CONFIG.WS_URL}${API_ENDPOINTS.WS_ROOM(roomId, userId)}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message:', message);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect(roomId, userId);
      };
    });
  }

  private attemptReconnect(roomId: string, userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect(roomId, userId).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  toggleMic() {
    this.send({ 
      action: 'toggle_mic',
      timestamp: new Date().toISOString()
    });
  }

  toggleCam() {
    this.send({ 
      action: 'toggle_cam',
      timestamp: new Date().toISOString()
    });
  }

  toggleHand() {
    this.send({ 
      action: 'toggle_hand',
      timestamp: new Date().toISOString()
    });
  }

  sendChatMessage(userId: string, displayName: string, message: string) {
    this.send({
      action: 'chat_message',
      user_id: userId,
      display_name: displayName,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  hostForceMic(targetUserId: string, muted: boolean) {
    this.send({
      action: 'host_force_mic',
      target_user_id: targetUserId,
      muted,
    });
  }

  hostForceCam(targetUserId: string, off: boolean) {
    this.send({
      action: 'host_force_cam',
      target_user_id: targetUserId,
      off,
    });
  }

  onMessage(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
  }
}
