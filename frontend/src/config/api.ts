// Get host IP from environment variables or fallback to current hostname
const getHostIP = (envVar: string | undefined): string => {
  if (envVar && envVar.trim() !== '') {
    return envVar.trim();
  }
  // Fallback to current hostname (works for local network access)
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

// Determine if secure connection should be used
const getIsSecure = (): boolean => {
  const envSecure = import.meta.env.VITE_IS_SECURE;
  
  // If explicitly set in env, use that value
  if (envSecure === 'true') return true;
  if (envSecure === 'false') return false;
  
  // Auto-detect: if frontend is served over HTTPS, use secure connections
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  
  return false;
};

const BACKEND_HOST = getHostIP(import.meta.env.VITE_BACKEND_HOST_IP);
const PEERJS_HOST = getHostIP(import.meta.env.VITE_PEERJS_HOST_IP);
const IS_SECURE = getIsSecure();

const isDevelopment = import.meta.env.DEV;

// API Configuration
export const API_CONFIG = {
  BASE_URL: `${IS_SECURE ? 'https' : 'http'}://${BACKEND_HOST}`,
  WS_URL: `${IS_SECURE ? 'wss' : 'ws'}://${BACKEND_HOST}`,
  PEER_SERVER_URL: PEERJS_HOST,
  PEER_SERVER_PORT: 443,
  IS_SECURE,
} as const;

export const API_ENDPOINTS = {
  SIGNUP: '/signup',
  LOGIN: '/token',
  ME: '/users/me/',
  UPDATE_PROFILE: '/update_profile',
  CREATE_MEET: '/meet/room/create',
  GET_MEET: (roomId: string) => `/meet/room/${roomId}`,
  JOIN_MEET: (roomId: string) => `/meet/room/${roomId}/join`,
  LEAVE_MEET: (roomId: string) => `/meet/room/${roomId}/leave`,
  END_MEET: (roomId: string) => `/meet/${roomId}/end`,
  WS_ROOM: (roomId: string, userId: string) => `/ws/${roomId}/${userId}`,
} as const;
