import supabase from '../config/supabase.js';
import { broadcast } from '../config/wsServer.js';

// ── GET /api/chat/history ─────────────────────────────────────────────────────
export const getChatHistory = async (req, res) => {
  try {
    const channel = req.query.channel || 'world';
    const limit = 50;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, username, content, channel, created_at')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ messages: (data || []).reverse() });
  } catch (err) {
    console.error('getChatHistory error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Handler xử lý tin nhắn chat từ WebSocket ────────────────────────────────
export const handleChatMessage = async (userId, username, { channel = 'world', content }) => {
  try {
    if (!content || typeof content !== 'string') return;
    const trimmed = content.trim().slice(0, 300);
    if (!trimmed) return;

    // Validate channel
    const allowedChannels = ['world'];
    // Sect channel được check riêng ở WS handler
    if (!allowedChannels.includes(channel) && !channel.startsWith('sect:')) return;

    // Lưu DB
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        username,
        channel,
        content: trimmed,
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast tới tất cả trong channel
    broadcast(`chat:${channel}`, {
      type: 'chat_message',
      message: {
        id: data.id,
        username,
        content: trimmed,
        channel,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error('[Chat] handleChatMessage error:', err.message);
  }
};
