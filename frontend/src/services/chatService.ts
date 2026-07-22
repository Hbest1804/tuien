import api from '../lib/axios';

export const getChatHistory = (channel = 'world') =>
  api.get('/chat/history', { params: { channel } });

export const getTransactionHistory = (page = 1, type?: string) =>
  api.get('/economy/history', { params: { page, ...(type && { type }) } });
