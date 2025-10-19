import Peer from 'peerjs';
import { API_CONFIG } from '@/config/api';

export class PeerService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private connections: Map<string, { call: any; stream: MediaStream }> = new Map();
  private streamHandlers: ((peerId: string, stream: MediaStream) => void)[] = [];

  async initialize(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
this.peer = new Peer(userId, {
    host: API_CONFIG.PEER_SERVER_URL,
    port: API_CONFIG.PEER_SERVER_PORT,
    path: '/',
    debug: 3,
    secure: window.location.protocol === 'https:',  // <-- auto toggle
});


      this.peer.on('open', (id) => {
        console.log('Peer initialized with ID:', id);
        resolve(id);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });

      this.peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        if (this.localStream) {
          call.answer(this.localStream);
          this.handleCall(call);
        }
      });
    });
  }

  async getLocalStream(audio = true, video = true): Promise<MediaStream> {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support media devices');
      }

      // Use more mobile-friendly constraints
      const constraints = {
        audio,
        video: video ? {
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          facingMode: 'user',
        } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Local stream obtained');
      return this.localStream;
    } catch (error: any) {
      console.error('Failed to get local stream:', error);
      // Try fallback to audio only if video fails
      if (video && error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        return this.getLocalStream(audio, false);
      }
      throw error;
    }
  }

  callPeer(peerId: string) {
    if (!this.peer || !this.localStream) {
      console.error('Peer or local stream not initialized');
      return;
    }

    console.log('Calling peer:', peerId);
    const call = this.peer.call(peerId, this.localStream);
    this.handleCall(call);
  }

  private handleCall(call: any) {
    call.on('stream', (remoteStream: MediaStream) => {
      console.log('Received stream from:', call.peer);
      this.connections.set(call.peer, { call, stream: remoteStream });
      this.streamHandlers.forEach((handler) => handler(call.peer, remoteStream));
    });

    call.on('close', () => {
      console.log('Call closed with:', call.peer);
      this.connections.delete(call.peer);
    });
  }

  onStream(handler: (peerId: string, stream: MediaStream) => void) {
    this.streamHandlers.push(handler);
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  disconnect() {
    // Close all connections
    this.connections.forEach(({ call }) => {
      call.close();
    });
    this.connections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Destroy peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.streamHandlers = [];
  }
}
