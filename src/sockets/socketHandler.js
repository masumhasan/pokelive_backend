import { Server } from 'socket.io';
import { verifyToken } from '../utils/token.js';

let ioInstance = null;

export function initSocketIO(httpServer, corsOptions) {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(); // allow guest viewer socket if needed
    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:stream', ({ streamId }) => {
      if (streamId) {
        socket.join(streamId.toString());
      }
    });

    socket.on('leave:stream', ({ streamId }) => {
      if (streamId) {
        socket.leave(streamId.toString());
      }
    });

    socket.on('chat:message', ({ streamId, message, username }) => {
      if (streamId && message) {
        const payload = {
          username: username || socket.user?.email?.split('@')[0] || 'User',
          message,
          timestamp: new Date().toISOString(),
        };
        io.to(streamId.toString()).emit('chat:new_message', payload);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  return ioInstance;
}
