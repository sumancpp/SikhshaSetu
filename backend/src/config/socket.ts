import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

let io: SocketIOServer | null = null;
const onlineUsers = new Map<string, { socketId: string; name: string; role: string }>();

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all frontend and onrender / localhost origins
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow unauthenticated connection for public status if needed, or reject
        return next();
      }

      const decoded = jwt.verify(token as string, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
        name: string;
      };

      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('⚠️ Socket auth failed with token:', err);
      // Still allow connection as guest or continue
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;

    if (user) {
      // Join personal room for notifications & targeted events
      socket.join(`user:${user.id}`);
      onlineUsers.set(user.id, { socketId: socket.id, name: user.name, role: user.role });
      
      // Broadcast presence update
      io?.emit('presence:updated', {
        onlineCount: onlineUsers.size,
        onlineUserIds: Array.from(onlineUsers.keys()),
      });
    }

    // Room subscription handlers with security context
    socket.on('join:class', (classId: string) => {
      if (classId) {
        socket.join(`class:${classId}`);
      }
    });

    socket.on('leave:class', (classId: string) => {
      if (classId) {
        socket.leave(`class:${classId}`);
      }
    });

    socket.on('join:subject', (subjectId: string) => {
      if (subjectId) {
        socket.join(`subject:${subjectId}`);
      }
    });

    socket.on('leave:subject', (subjectId: string) => {
      if (subjectId) {
        socket.leave(`subject:${subjectId}`);
      }
    });

    socket.on('join:forum', (postId: string) => {
      if (postId) {
        socket.join(`forum:${postId}`);
      }
    });

    socket.on('leave:forum', (postId: string) => {
      if (postId) {
        socket.leave(`forum:${postId}`);
      }
    });

    socket.on('typing:start', ({ forumId, userName }: { forumId: string; userName: string }) => {
      socket.to(`forum:${forumId}`).emit('forum:typing', { forumId, userName, isTyping: true });
    });

    socket.on('typing:stop', ({ forumId, userName }: { forumId: string; userName: string }) => {
      socket.to(`forum:${forumId}`).emit('forum:typing', { forumId, userName, isTyping: false });
    });

    socket.on('disconnect', () => {
      if (user) {
        onlineUsers.delete(user.id);
        io?.emit('presence:updated', {
          onlineCount: onlineUsers.size,
          onlineUserIds: Array.from(onlineUsers.keys()),
        });
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Real-time Event Broadcasters
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToClass = (classId: string, event: string, data: any): void => {
  if (io) {
    io.to(`class:${classId}`).emit(event, data);
  }
};

export const emitToSubject = (subjectId: string, event: string, data: any): void => {
  if (io) {
    io.to(`subject:${subjectId}`).emit(event, data);
  }
};

export const emitToForum = (postId: string, event: string, data: any): void => {
  if (io) {
    io.to(`forum:${postId}`).emit(event, data);
  }
};

export const emitGlobal = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};
