import { useEffect, useRef, useCallback } from 'react';

type WsMessageHandler = (data: any) => void;

export const useWebSocket = (onMessage: WsMessageHandler) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(onMessage);
  handlersRef.current = onMessage;

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      .replace(/^http/, 'ws')
      .replace('/api', '/ws');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Xác thực sau khi kết nối
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlersRef.current(data);
      } catch {}
    };

    ws.onclose = () => {
      // Auto-reconnect sau 3s
      reconnectTimer.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    send({ type: 'subscribe', channel });
  }, [send]);

  const sendChat = useCallback((channel: string, content: string) => {
    send({ type: 'chat', channel, content });
  }, [send]);

  return { send, subscribe, sendChat, wsRef };
};
