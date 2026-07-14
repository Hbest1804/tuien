import api from '../lib/axios';

export const getDailyQuests = () => api.get('/quests/daily');
export const claimDailyQuest = (questId: string) => api.post(`/quests/daily/claim/${questId}`);

export const getMainQuests = () => api.get('/quests/main');
export const checkMainQuest = () => api.post('/quests/main/check');
