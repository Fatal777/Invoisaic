import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebSocketMessage {
  type: 'agent_activity' | 'field_extracted' | 'annotation_added' | 'processing_complete' | 'processing_started' | 'error' | 'echo' | 'tax_analysis' | 'fraud_analysis' | 'gl_entries';
  data: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  messages: WebSocketMessage[];
  sendMessage: (message: any) => void;
  clearMessages: () => void;
  lastMessage: WebSocketMessage | null;
}

/**
 * Custom hook for WebSocket connection management
 * Handles connection lifecycle, message queuing, and reconnection logic
 */
export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageQueue = useRef<any[]>([]);

  const connect = useCallback(() => {
    try {
      console.log('Connecting to WebSocket:', url);

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Send any queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
          }
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message.type, message.data);

          // Log error messages prominently
          if (message.type === 'error') {
            console.error('❌ WebSocket ERROR:', message.data);
          }

          setMessages(prev => [...prev, message]);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        if (event.code !== 1000) { // Not a normal closure
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.log('WebSocket not connected, queuing message');
      messageQueue.current.push(message);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return {
    isConnected,
    messages,
    sendMessage,
    clearMessages,
    lastMessage
  };
};
