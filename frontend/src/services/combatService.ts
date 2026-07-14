import api from '../lib/axios';

export const getMonsters = () => api.get('/combat/monsters');
export const fight = (monsterId: string) => api.post('/combat/fight', { monsterId });
