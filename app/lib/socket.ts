import { io } from 'socket.io-client';

// Use port 5002 for socket connection
const SOCKET_URL = 'http://localhost:5002';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

// Add connection event listeners
socket.on('connect', () => {
  console.log('✅ Socket connected on port 5002');
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});