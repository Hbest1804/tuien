import api from '../lib/axios';

export interface ShopItem {
  itemId: string;
  name: string;
  type: string;
  subType: string | null;
  description: string;
  rarity: string;
  effects: Record<string, unknown>;
  price: number;
  sellPrice: number;
  stock: number | null;
}

export interface BalanceData {
  spiritStones: number;
  pendingStones: number;
  lastCollectedAt: string | null;
}

export const getBalance = () =>
  api.get<BalanceData>('/economy/balance');

export const collectIdleStones = () =>
  api.post<{ spiritStones: number; collected: number; message: string }>('/economy/idle-collect');

export const getShopItems = () =>
  api.get<{ items: ShopItem[] }>('/economy/shop');

export const buyShopItem = (itemId: string, quantity: number = 1) =>
  api.post<{ message: string; spiritStones: number }>('/economy/shop/buy', { itemId, quantity });

export const sellShopItem = (itemId: string, quantity: number = 1) =>
  api.post<{ message: string; spiritStones: number }>('/economy/shop/sell', { itemId, quantity });

export const getSellPrices = () =>
  api.get<{ prices: { itemId: string; name: string; type: string; rarity: string; sellPrice: number }[] }>('/economy/shop/sell-prices');
