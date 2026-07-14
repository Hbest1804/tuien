import api from '../lib/axios';

export const getRecipes = () => api.get('/alchemy/recipes');
export const craftItem = (recipeId: string, quantity: number) =>
  api.post('/alchemy/craft', { recipeId, quantity });
