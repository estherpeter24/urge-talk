import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../../constants/config';
import { SocketEvent, Message, MessageStatus } from '../../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageListeners: Map<string, Function[]> = new Map();
  private pendingJoins: Set<string> = new Set();
  private activeRooms: Set<string> = new Set();  // Track rooms we should be in
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('[SocketService] Attempting to connect...');
      console.log('[SocketService] Socket URL:', API_CONFIG.SOCKET_URL);
      console.log('[SocketService] Token exists:', !!token);

      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(API_CONFIG.SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true,
      });

      console.log('[SocketService] Socket instance created, setting up listeners...');
      this.setupEventListeners();

      // Wait for actual connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 10000);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          console.log('[SocketService] Socket actually connected');
          // Process pending joins
          this.processPendingJoins();
          resolve();
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      console.error('[SocketService] Socket connection error:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  private processPendingJoins(): void {
    // Join pending rooms
    console.log('[SocketService] Processing pending joins:', this.pendingJoins.size);
    for (const conversationId of this.pendingJoins) {
      console.log('[SocketService] Joining pending conversation:', conversationId);
      this.socket?.emit('join:conversation', conversationId);
      this.activeRooms.add(conversationId);
    }
    this.pendingJoins.clear();

    // Re-join active rooms on reconnect
    console.log('[SocketService] Re-joining active rooms:', this.activeRooms.size);
    for (const conversationId of this.activeRooms) {
      console.log('[SocketService] Re-joining conversation:', conversationId);
      this.socket?.emit('join:conversation', conversationId);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] *** SOCKET CONNECTED SUCCESSFULLY ***');
      console.log('[SocketService] Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      // Process pending joins on reconnect
      this.processPendingJoins();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] *** SOCKET DISCONNECTED ***');
      console.log('[SocketService] Disconnect reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] *** SOCKET CONNECTION ERROR ***');
      console.error('[SocketService] Error:', error.message);
      console.error('[SocketService] Error details:', JSON.stringify(error));
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[SocketService] Max reconnection attempts reached');
      }
    });

    // Message events
    this.socket.on(SocketEvent.MESSAGE_RECEIVED, (message: Message) => {
      console.log('[SocketService] Received message:received event:', JSON.stringify(message));
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

    // Group events
    this.socket.on(SocketEvent.GROUP_DELETED, (data: { group_id: string; message: string }) => {
      console.log('[SocketService] Group deleted event:', data);
      this.notifyListeners(SocketEvent.GROUP_DELETED, data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
    this.pendingJoins.clear();
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
    console.log('[SocketService] Joining conversation:', conversationId, 'socket exists:', !!this.socket, 'connected:', this.socket?.connected);

    if (!this.socket || !this.socket.connected) {
      console.log('[SocketService] Socket not connected yet, queueing join for:', conversationId);
      this.pendingJoins.add(conversationId);
      return;
    }

    console.log('[SocketService] Emitting join:conversation for:', conversationId);
    this.socket.emit('join:conversation', conversationId);
    this.activeRooms.add(conversationId);  // Track as active room
  }

  leaveConversation(conversationId: string): void {
    // Remove from pending if it was queued
    this.pendingJoins.delete(conversationId);
    // Remove from active rooms
    this.activeRooms.delete(conversationId);

    if (!this.socket || !this.socket.connected) return;
    console.log('[SocketService] Leaving conversation:', conversationId);
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
