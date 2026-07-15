import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory } from '../services/chatService';

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  channel: string;
  createdAt: string;
}

interface ChatWindowProps {
  sendChat: (channel: string, content: string) => void;
  subscribe: (channel: string) => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
  connectionKey: number;   // increments on each WS reconnect
  username?: string;
  sectName?: string;
}

export const ChatWindow = ({ sendChat, subscribe, wsRef, connectionKey, username, sectName }: ChatWindowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'world' | string>('world');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unreadWorld, setUnreadWorld] = useState(0);
  const [unreadSect, setUnreadSect] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const subscribedRef = useRef<Set<string>>(new Set());

  const channels: { id: string; label: string }[] = [
    { id: 'world', label: '🌍 Thế Giới' },
    ...(sectName ? [{ id: `sect:${sectName}`, label: `🏯 ${sectName}` }] : []),
  ];

  // Load history when switching channel
  useEffect(() => {
    getChatHistory(activeChannel).then(res => {
      setMessages(res.data.messages || []);
    });
    // Subscribe WebSocket channel
    if (!subscribedRef.current.has(activeChannel)) {
      subscribe(activeChannel);
      subscribedRef.current.add(activeChannel);
    }
    if (activeChannel === 'world') setUnreadWorld(0);
    else setUnreadSect(0);
  }, [activeChannel, subscribe]);

  // Listen for incoming chat messages
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          const msg = data.message as ChatMessage;
          if (msg.channel === activeChannel) {
            setMessages(prev => [...prev.slice(-99), msg]);
            if (!isOpen) {
              if (msg.channel === 'world') setUnreadWorld(p => p + 1);
              else setUnreadSect(p => p + 1);
            }
          }
        }
      } catch {}
    };
    ws.addEventListener('message', handleMessage);
    return () => { ws.removeEventListener('message', handleMessage); };
  }, [wsRef, connectionKey, activeChannel, isOpen]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChat(activeChannel, trimmed);
    setInput('');
  };

  const totalUnread = unreadWorld + unreadSect;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 1000,
      fontFamily: 'inherit',
    }}>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '340px',
          height: '420px',
          background: 'rgba(15,20,35,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '0.75rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.15))',
            borderBottom: '1px solid rgba(124,58,237,0.2)',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0.4rem',
                    border: 'none',
                    background: activeChannel === ch.id ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.06)',
                    color: activeChannel === ch.id ? '#fff' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '2rem' }}>
                Chưa có tin nhắn nào. Hãy là người đầu tiên nhắn! 👋
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.username === username;
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}>
                  {!isMe && (
                    <span style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {msg.username}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.4rem 0.7rem',
                    background: isMe ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)',
                    borderRadius: isMe ? '0.75rem 0.75rem 0.1rem 0.75rem' : '0.75rem 0.75rem 0.75rem 0.1rem',
                    fontSize: '0.82rem',
                    color: '#e2e8f0',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: '0.5rem',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 300))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhắn tin..."
              style={{
                flex: 1,
                padding: '0.4rem 0.6rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.4rem',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none',
                borderRadius: '0.4rem',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ↵
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => { setIsOpen(v => !v); if (!isOpen) { setUnreadWorld(0); setUnreadSect(0); } }}
        style={{
          width: '52px',
          height: '52px',
          background: isOpen ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(168,85,247,0.6))',
          border: '2px solid rgba(168,85,247,0.5)',
          borderRadius: '50%',
          color: '#fff',
          fontSize: '1.3rem',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        💬
        {totalUnread > 0 && !isOpen && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};
