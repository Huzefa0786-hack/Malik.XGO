import { io } from 'socket.io-client';

// Change from 5000 to 5002
const SOCKET_URL = 'http://localhost:5002';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket connected to port 5002');
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});