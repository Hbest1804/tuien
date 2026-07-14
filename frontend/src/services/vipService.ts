import api from '../lib/axios';

export const getVipPackages = () => api.get('/vip/packages');
export const getVipStatus = () => api.get('/vip/status');
export const purchaseJade = (packageId: string) => api.post('/vip/purchase', { packageId });
export const spendJade = (jadeItemId: string) => api.post('/vip/spend', { jadeItemId });
