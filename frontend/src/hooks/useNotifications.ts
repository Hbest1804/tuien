import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export interface Notification {
  id: string;
  type: 'outbid' | 'achievement' | 'auction_end' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notif: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
    // Show toast
    setToasts(prev => [...prev, notif]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
    }, 5000);
  }, []);

  const { send, subscribe, sendChat, wsRef } = useWebSocket((data) => {
    if (data.type === 'outbid') {
      addNotification({ type: 'outbid', message: data.message });
    } else if (data.type === 'achievement') {
      const achs = data.achievements || [];
      for (const ach of achs) {
        addNotification({
          type: 'achievement',
          message: `🏆 Mở khóa thành tựu: "${ach.name}" ${ach.icon || ''}`,
        });
      }
    } else if (data.type === 'auction_end') {
      addNotification({ type: 'auction_end', message: data.message });
    }
  });

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    toasts,
    unreadCount,
    markAllRead,
    send,
    subscribe,
    sendChat,
    wsRef,
    addNotification,
  };
};
