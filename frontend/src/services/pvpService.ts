import api from '../lib/axios';

export const getPvpStatus = () => api.get('/pvp/status');
export const getPvpRankings = () => api.get('/pvp/rankings');
export const findRandomOpponent = () => api.get('/pvp/find-opponent');
export const challengePlayer = (targetUsername: string) =>
  api.post('/pvp/challenge', { targetUsername });
