import api from '../lib/axios';

export const getSectWarStatus = () => api.get('/sect-war/status');
export const getSectWarLeaderboard = () => api.get('/sect-war/leaderboard');
export const declareWar = () => api.post('/sect-war/declare');
export const attackLinhMach = (linghMachId: string, contributionUsed: number) =>
  api.post('/sect-war/attack', { linghMachId, contributionUsed });
