import api from '../lib/axios';

export const getDiscipleStatus = () => api.get('/disciple/status');
export const acceptDisciple = (targetUsername: string) =>
  api.post('/disciple/accept', { targetUsername });
export const releaseDisciple = (targetUserId: string) =>
  api.post('/disciple/release', { targetUserId });
export const requestPartner = (targetUsername: string) =>
  api.post('/disciple/partner', { targetUsername });
export const divorcePartner = () => api.post('/disciple/divorce');
