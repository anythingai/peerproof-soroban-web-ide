import { useState, useEffect, useRef } from 'react';

interface Message {
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: string;
}

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          addMessage('info', 'Connected to build server');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            addMessage(data.type || 'info', data.message || event.data);
          } catch {
            addMessage('info', event.data);
          }
        };

        ws.onerror = () => {
          addMessage('error', 'WebSocket connection error');
        };

        ws.onclose = () => {
          setIsConnected(false);
          addMessage('warning', 'Disconnected from build server');
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
      } catch (error) {
        addMessage('error', 'Failed to establish WebSocket connection');
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const addMessage = (type: Message['type'], message: string) => {
    const newMessage: Message = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage].slice(-100)); // Keep last 100 messages
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isConnected,
    sendMessage,
    clearMessages
  };
}
