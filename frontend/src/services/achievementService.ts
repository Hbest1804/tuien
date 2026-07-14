import api from '../lib/axios';

export const getAchievements = () => api.get('/achievements');
