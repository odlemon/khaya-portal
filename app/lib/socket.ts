import { io, Socket } from 'socket.io-client';
import { getSocketOptions, getSocketTargetLabel } from '../config/api.config';

type EventHandler = (...args: unknown[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private lastToken: string | null = null;
  private connectCallbacks = new Set<() => void>();
  private eventHandlers = new Map<string, Set<EventHandler>>();

  connect(token: string) {
    if (!token) return;

    // Same session — keep socket instance so Socket.IO reconnect + our handlers stay intact
    if (this.socket && this.lastToken === token) {
      if (this.socket.connected) return;
      this.socket.auth = { token };
      this.attachStoredHandlers();
      this.socket.connect();
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.lastToken = token;
    const { url: socketUrl, transports, upgrade } = getSocketOptions();

    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
      console.log('[portal] socket connecting to', getSocketTargetLabel(), {
        transports,
        upgrade,
      });
    }

    this.socket = io(socketUrl, {
      auth: { token },
      transports,
      upgrade,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.attachStoredHandlers();

    this.socket.on('connect', () => {
      this.connected = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('[portal] socket connected');
      }
      this.connectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('[portal] socket disconnected', reason);
      }
    });

    this.socket.on('connect_error', (err: Error) => {
      this.connected = false;
      console.error('[portal] socket connect_error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.lastToken = null;
    this.connected = false;
    this.connectCallbacks.clear();
    this.eventHandlers.clear();
  }

  private attachStoredHandlers() {
    if (!this.socket) return;
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });
  }

  onConnect(callback: () => void) {
    this.connectCallbacks.add(callback);
    if (this.connected) callback();
  }

  offConnect(callback: () => void) {
    this.connectCallbacks.delete(callback);
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.eventHandlers.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  joinChat(chatId: string) {
    this.socket?.emit('join_chat', chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', chatId);
  }

  startTyping(chatId: string) {
    this.socket?.emit('typing_start', { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing_stop', { chatId });
  }

  markRead(chatId: string, messageIds: string[] = []) {
    this.socket?.emit('mark_messages_read', { chatId, messageIds });
  }

  isConnected() {
    return this.connected && Boolean(this.socket?.connected);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
