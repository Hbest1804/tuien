import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { handleChatMessage } from '../controllers/chatController.js';

// Map: channel → Set<ws>
const channels = new Map();

// Map: userId → ws (cho notify cá nhân)
const userConnections = new Map();

// ─── Đăng ký client vào channel ───────────────────────────────────────────────
const subscribe = (channel, ws) => {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(ws);
};

const unsubscribe = (channel, ws) => {
  channels.get(channel)?.delete(ws);
};

// ─── Broadcast đến một channel ────────────────────────────────────────────────
export const broadcast = (channel, data) => {
  const payload = JSON.stringify(data);
  const subs = channels.get(channel);
  if (!subs) return;
  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
};

// ─── Khởi tạo WebSocket Server ───────────────────────────────────────────────
export const initWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;
    let username = null;
    const subscribedChannels = new Set();

    ws.on('message', async (rawMsg) => {
      let msg;
      try {
        msg = JSON.parse(rawMsg.toString());
      } catch {
        return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }

      // ── Auth ─────────────────────────────────────────────────────────────
      if (msg.type === 'auth') {
        try {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          userId = decoded.userId || decoded.id;
          username = decoded.username;
          userConnections.set(userId, ws);

          // Auto-subscribe vào channel notify cá nhân
          subscribe(`notify:${userId}`, ws);
          subscribedChannels.add(`notify:${userId}`);

          ws.send(JSON.stringify({ type: 'auth_ok', userId, username }));
        } catch {
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Token không hợp lệ' }));
        }
        return;
      }

      if (!userId) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Chưa xác thực' }));
      }

      // ── Subscribe channel ────────────────────────────────────────────────
      if (msg.type === 'subscribe') {
        const { channel } = msg;
        if (!channel) return;
        // Chỉ cho phép world và sect channels
        if (channel === 'world' || channel.startsWith('sect:')) {
          subscribe(channel, ws);
          subscribedChannels.add(channel);
          ws.send(JSON.stringify({ type: 'subscribed', channel }));
        }
        return;
      }

      // ── Unsubscribe channel ──────────────────────────────────────────────
      if (msg.type === 'unsubscribe') {
        unsubscribe(msg.channel, ws);
        subscribedChannels.delete(msg.channel);
        return;
      }

      // ── Chat message ─────────────────────────────────────────────────────
      if (msg.type === 'chat') {
        const channel = msg.channel || 'world';
        if (!subscribedChannels.has(channel)) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Chưa subscribe channel này' }));
        }
        await handleChatMessage(userId, username, { channel, content: msg.content });
        return;
      }

      // ── Ping/pong ────────────────────────────────────────────────────────
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
    });

    ws.on('close', () => {
      // Dọn dẹp subscriptions
      for (const channel of subscribedChannels) {
        unsubscribe(channel, ws);
      }
      // Chỉ xóa nếu đây là kết nối đang được lưu (tránh xóa tab khác)
      if (userId && userConnections.get(userId) === ws) {
        userConnections.delete(userId);
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    // Gửi welcome message
    ws.send(JSON.stringify({ type: 'connected', message: 'Kết nối WebSocket thành công. Gửi {type:"auth", token:"..."} để xác thực.' }));
  });

  console.log('🔌 WebSocket Server đã sẵn sàng tại /ws');
  return wss;
};
