/**
 * React Hook for WebSocket Integration
 * Provides easy-to-use WebSocket functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketClient, WebSocketClientOptions } from '@/lib/websocket-client';

export interface UseWebSocketOptions extends WebSocketClientOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (type: string, data: unknown) => void;
}

export interface UseWebSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  connectionId: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (type: string, data: unknown, to?: string) => Promise<boolean>;
  
  // Event subscription
  subscribe: (eventType: string, handler: (data: unknown) => void) => () => void;
  
  // Convenience methods for common message types
  sendChatMessage: (message: string, to?: string) => Promise<boolean>;
  sendTypingIndicator: (isTyping: boolean) => Promise<boolean>;
  sendNotification: (title: string, message: string, type?: string) => Promise<boolean>;
  sendGameMove: (move: unknown) => Promise<boolean>;
  sendDocumentEdit: (operation: unknown, documentId?: string) => Promise<boolean>;
  
  // Connection stats
  reconnectAttempts: number;
  lastError: Error | null;
}

/**
 * Custom hook for WebSocket connections
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback'>('disconnected');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [reconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const clientRef = useRef<WebSocketClient | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: unknown) => void>>(new Map());

  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    ...clientOptions
  } = options;

  // Initialize WebSocket client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new WebSocketClient({
        ...clientOptions,
        debug: clientOptions.debug ?? process.env.NODE_ENV === 'development'
      });

      setConnectionId(clientRef.current.getConnectionId());

      // Set up status change listener
      const unsubscribeStatus = clientRef.current.onStatusChange((status) => {
        setConnectionStatus(status);
        setIsConnected(status === 'connected' || status === 'fallback');

        if (status === 'connected' || status === 'fallback') {
          setLastError(null);
          onConnect?.();
        } else if (status === 'disconnected') {
          onDisconnect?.();
        } else if (status === 'error') {
          const error = new Error('WebSocket connection error');
          setLastError(error);
          onError?.(error);
        }
      });

      // Set up global message listener
      const unsubscribeMessages = clientRef.current.on('*', (event) => {
        onMessage?.(event.type, event.data);
        
        // Call specific event handlers
        const handler = eventHandlersRef.current.get(event.type);
        if (handler) {
          handler(event.data);
        }
      });

      // Auto-connect if enabled
      if (autoConnect) {
        clientRef.current.connect().catch((error) => {
          setLastError(error);
          onError?.(error);
        });
      }

      // Cleanup function
      return () => {
        unsubscribeStatus();
        unsubscribeMessages();
        if (clientRef.current) {
          clientRef.current.disconnect();
          clientRef.current = null;
        }
      };
    }
  }, [autoConnect, onConnect, onDisconnect, onError, onMessage, clientOptions]);

  // Connect function
  const connect = useCallback(async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.connect();
        setLastError(null);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Connection failed');
        setLastError(err);
        onError?.(err);
        throw err;
      }
    }
  }, [onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // Send message function
  const sendMessage = useCallback(async (type: string, data: unknown, to?: string): Promise<boolean> => {
    if (clientRef.current) {
      return clientRef.current.sendMessage(type, data, to);
    }
    return false;
  }, []);

  // Subscribe to specific event types
  const subscribe = useCallback((eventType: string, handler: (data: unknown) => void): () => void => {
    eventHandlersRef.current.set(eventType, handler);
    
    return () => {
      eventHandlersRef.current.delete(eventType);
    };
  }, []);

  // Convenience methods for common message types
  const sendChatMessage = useCallback(async (message: string, to?: string): Promise<boolean> => {
    return sendMessage('chat.message', { 
      message, 
      timestamp: Date.now(),
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }, to);
  }, [sendMessage]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean): Promise<boolean> => {
    return sendMessage(isTyping ? 'typing.start' : 'typing.stop', { 
      timestamp: Date.now() 
    });
  }, [sendMessage]);

  const sendNotification = useCallback(async (title: string, message: string, type = 'info'): Promise<boolean> => {
    return sendMessage('notification.broadcast', {
      title,
      message,
      type,
      timestamp: Date.now(),
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }, [sendMessage]);

  const sendGameMove = useCallback(async (move: unknown): Promise<boolean> => {
    return sendMessage('game.move', {
      move,
      timestamp: Date.now(),
      id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }, [sendMessage]);

  const sendDocumentEdit = useCallback(async (operation: unknown, documentId = 'default'): Promise<boolean> => {
    return sendMessage('document.edit', {
      operation,
      documentId,
      timestamp: Date.now(),
      id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }, [sendMessage]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    connectionId,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    
    // Event subscription
    subscribe,
    
    // Convenience methods
    sendChatMessage,
    sendTypingIndicator,
    sendNotification,
    sendGameMove,
    sendDocumentEdit,
    
    // Connection stats
    reconnectAttempts,
    lastError
  };
}

/**
 * Hook for chat functionality
 */
export interface ChatMessage {
  id: string;
  message: string;
  timestamp: number;
  from?: string;
  to?: string;
}

export interface UseChatOptions extends UseWebSocketOptions {
  maxMessages?: number;
}

export function useChat(options: UseChatOptions = {}) {
  const { maxMessages = 100, ...wsOptions } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const ws = useWebSocket(wsOptions);

  // Handle incoming chat messages
  useEffect(() => {
    const unsubscribeChat = ws.subscribe('chat.message', (data) => {
      const messageData = data as { message: string; timestamp: number; id: string };
      const newMessage: ChatMessage = {
        id: messageData.id,
        message: messageData.message,
        timestamp: messageData.timestamp,
        // from and to would be extracted from the WebSocket message context
      };

      setMessages(prev => {
        const updated = [...prev, newMessage];
        return updated.slice(-maxMessages); // Keep only recent messages
      });
    });

    const unsubscribeTypingStart = ws.subscribe('typing.start', (data) => {
      const { from } = data as { from: string };
      if (from && from !== ws.connectionId) {
        setTypingUsers(prev => new Set([...prev, from]));
      }
    });

    const unsubscribeTypingStop = ws.subscribe('typing.stop', (data) => {
      const { from } = data as { from: string };
      if (from) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(from);
          return next;
        });
      }
    });

    const unsubscribeUserJoin = ws.subscribe('user.join', (data) => {
      const { connectionId } = data as { connectionId: string };
      console.log(`User joined: ${connectionId}`);
    });

    const unsubscribeUserLeave = ws.subscribe('user.leave', (data) => {
      const { connectionId } = data as { connectionId: string };
      console.log(`User left: ${connectionId}`);
      
      // Remove from typing users
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    });

    return () => {
      unsubscribeChat();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeUserJoin();
      unsubscribeUserLeave();
    };
  }, [ws, maxMessages]);

  // Typing indicator with automatic timeout
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        ws.sendTypingIndicator(false);
      }, 3000); // Stop typing indicator after 3 seconds

      return () => clearTimeout(timeout);
    }
  }, [isTyping, ws]);

  const sendMessage = useCallback(async (message: string, to?: string): Promise<boolean> => {
    if (message.trim()) {
      setIsTyping(false);
      ws.sendTypingIndicator(false);
      return ws.sendChatMessage(message.trim(), to);
    }
    return false;
  }, [ws]);

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      ws.sendTypingIndicator(true);
    }
  }, [isTyping, ws]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      ws.sendTypingIndicator(false);
    }
  }, [isTyping, ws]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    ...ws,
    // Chat-specific state
    messages,
    typingUsers: Array.from(typingUsers),
    
    // Chat actions
    sendMessage,
    startTyping,
    stopTyping,
    clearMessages
  };
}

export default useWebSocket;