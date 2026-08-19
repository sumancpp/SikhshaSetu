import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { triggerConfetti } from '../utils/helpers';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  joinClass: (classId: string) => void;
  leaveClass: (classId: string) => void;
  joinSubject: (subjectId: string) => void;
  leaveSubject: (subjectId: string) => void;
  joinForum: (postId: string) => void;
  leaveForum: (postId: string) => void;
  emitTyping: (forumId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { awardPointsToast, info } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('presence:updated', (data: { onlineCount: number }) => {
      if (data.onlineCount !== undefined) {
        setOnlineCount(data.onlineCount);
      }
    });

    // Real-time points celebration event
    newSocket.on('points:earned', (data: { points: number; totalPoints: number; reason: string }) => {
      awardPointsToast(data.points, data.reason);
      updateUser({ points: data.totalPoints });
      triggerConfetti();
    });

    // Real-time badge unlocked event
    newSocket.on('achievement:unlocked', (data: { achievement: any }) => {
      info(`🏆 Achievement Unlocked: ${data.achievement.title}!`, data.achievement.description);
      triggerConfetti();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  const joinClass = (classId: string) => {
    if (socketRef.current && classId) {
      socketRef.current.emit('join:class', classId);
    }
  };

  const leaveClass = (classId: string) => {
    if (socketRef.current && classId) {
      socketRef.current.emit('leave:class', classId);
    }
  };

  const joinSubject = (subjectId: string) => {
    if (socketRef.current && subjectId) {
      socketRef.current.emit('join:subject', subjectId);
    }
  };

  const leaveSubject = (subjectId: string) => {
    if (socketRef.current && subjectId) {
      socketRef.current.emit('leave:subject', subjectId);
    }
  };

  const joinForum = (postId: string) => {
    if (socketRef.current && postId) {
      socketRef.current.emit('join:forum', postId);
    }
  };

  const leaveForum = (postId: string) => {
    if (socketRef.current && postId) {
      socketRef.current.emit('leave:forum', postId);
    }
  };

  const emitTyping = (forumId: string, isTyping: boolean) => {
    if (socketRef.current && user) {
      const event = isTyping ? 'typing:start' : 'typing:stop';
      socketRef.current.emit(event, { forumId, userName: user.name });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        joinClass,
        leaveClass,
        joinSubject,
        leaveSubject,
        joinForum,
        leaveForum,
        emitTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
