import api from '../lib/axios';

export const getBlacksmithRecipes = () => api.get('/blacksmith/recipes');
export const craftItem = (recipeId: string) => api.post('/blacksmith/craft', { recipeId });
export const enchantItem = (targetItemId: string, gemId: string) =>
  api.post('/blacksmith/enchant', { targetItemId, gemId });
