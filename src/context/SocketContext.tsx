import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService } from '../services/socket/socketService';
import { useAuth } from './AuthContext';
import { SocketEvent, Message } from '../types';

interface SocketContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Message) => void;
  markMessageDelivered: (messageId: string) => void;
  markMessageRead: (messageId: string, conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  addEventListener: (event: SocketEvent, callback: Function) => void;
  removeEventListener: (event: SocketEvent, callback: Function) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  const connectSocket = async () => {
    try {
      await socketService.connect();
      setIsConnected(true);
      console.log('Socket connected successfully');
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    setIsConnected(false);
    console.log('Socket disconnected');
  };

  const connect = async () => {
    await connectSocket();
  };

  const disconnect = () => {
    disconnectSocket();
  };

  const sendMessage = (message: Message) => {
    socketService.sendMessage(message);
  };

  const markMessageDelivered = (messageId: string) => {
    socketService.markMessageDelivered(messageId);
  };

  const markMessageRead = (messageId: string, conversationId: string) => {
    socketService.markMessageRead(messageId, conversationId);
  };

  const startTyping = (conversationId: string) => {
    socketService.startTyping(conversationId);
  };

  const stopTyping = (conversationId: string) => {
    socketService.stopTyping(conversationId);
  };

  const joinConversation = (conversationId: string) => {
    socketService.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketService.leaveConversation(conversationId);
  };

  const addEventListener = (event: SocketEvent, callback: Function) => {
    socketService.addEventListener(event, callback);
  };

  const removeEventListener = (event: SocketEvent, callback: Function) => {
    socketService.removeEventListener(event, callback);
  };

  const value: SocketContextType = {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    markMessageDelivered,
    markMessageRead,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    addEventListener,
    removeEventListener,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
