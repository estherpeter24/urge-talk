import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../../constants/config';
import { SocketEvent, Message, MessageStatus } from '../../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageListeners: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(API_CONFIG.SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Message events
    this.socket.on(SocketEvent.MESSAGE_RECEIVED, (message: Message) => {
      this.notifyListeners(SocketEvent.MESSAGE_RECEIVED, message);
    });

    this.socket.on(SocketEvent.MESSAGE_DELIVERED, (messageId: string) => {
      this.notifyListeners(SocketEvent.MESSAGE_DELIVERED, messageId);
    });

    this.socket.on(SocketEvent.MESSAGE_READ, (data: { messageId: string; userId: string }) => {
      this.notifyListeners(SocketEvent.MESSAGE_READ, data);
    });

    // Typing events
    this.socket.on(SocketEvent.TYPING_START, (data: { userId: string; conversationId: string }) => {
      this.notifyListeners(SocketEvent.TYPING_START, data);
    });

    this.socket.on(SocketEvent.TYPING_STOP, (data: { userId: string; conversationId: string }) => {
      this.notifyListeners(SocketEvent.TYPING_STOP, data);
    });

    // User presence events
    this.socket.on(SocketEvent.USER_ONLINE, (userId: string) => {
      this.notifyListeners(SocketEvent.USER_ONLINE, userId);
    });

    this.socket.on(SocketEvent.USER_OFFLINE, (userId: string) => {
      this.notifyListeners(SocketEvent.USER_OFFLINE, userId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: Message): void {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit(SocketEvent.MESSAGE_SENT, message);
  }

  markMessageDelivered(messageId: string): void {
    if (!this.socket) return;
    this.socket.emit(SocketEvent.MESSAGE_DELIVERED, messageId);
  }

  markMessageRead(messageId: string, conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit(SocketEvent.MESSAGE_READ, { messageId, conversationId });
  }

  startTyping(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit(SocketEvent.TYPING_START, { conversationId });
  }

  stopTyping(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit(SocketEvent.TYPING_STOP, { conversationId });
  }

  joinConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('join:conversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave:conversation', conversationId);
  }

  addEventListener(event: SocketEvent, callback: Function): void {
    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(event, []);
    }
    this.messageListeners.get(event)?.push(callback);
  }

  removeEventListener(event: SocketEvent, callback: Function): void {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: SocketEvent, data: any): void {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
