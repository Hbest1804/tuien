import { useState, useRef, useEffect } from 'react';
import type { Notification } from '../hooks/useNotifications';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  toasts: Notification[];
}

export const NotificationBell = ({ notifications, unreadCount, markAllRead, toasts }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setIsOpen(v => !v);
    if (!isOpen) markAllRead();
  };

  const TYPE_ICONS: Record<string, string> = {
    outbid: '📢',
    achievement: '🏆',
    auction_end: '🔨',
    info: 'ℹ️',
  };

  return (
    <>
      {/* Toasts */}
      <div style={{
        position: 'fixed',
        top: '5rem',
        right: '1.5rem',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(15,20,35,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168,85,247,0.5)',
              borderRadius: '0.75rem',
              maxWidth: '300px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{TYPE_ICONS[toast.type] || 'ℹ️'}</span>
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bell Icon */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={handleOpen}
          id="notification-bell-btn"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '320px',
            maxHeight: '400px',
            background: 'rgba(15,20,35,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            zIndex: 1001,
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>🔔 Thông Báo</span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Chưa có thông báo nào
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'flex-start',
                    background: n.read ? 'transparent' : 'rgba(124,58,237,0.07)',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[n.type] || 'ℹ️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.2rem' }}>
                      {n.timestamp.toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#a855f7', flexShrink: 0, marginTop: '5px',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
