import { useEffect, useRef } from 'react';

type WebSocketEvent = {
  type: string;
  payload: any;
};

export const useWebSocket = (url: string, onMessage: (event: WebSocketEvent) => void) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => console.log(`WebSocket connected to ${url}`);
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };
    
    ws.current.onerror = (error) => console.error('WebSocket error:', error);
    ws.current.onclose = () => console.log('WebSocket closed');

    return () => {
      ws.current?.close();
    };
  }, [url, onMessage]);

  return ws;
};
