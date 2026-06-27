import api from '../lib/axios';

export interface InventoryItem {
  itemId: string;
  quantity: number;
  name: string;
  type: string;
  subType: string | null;
  description: string;
  rarity: string;
  effects: any;
}

export interface InventoryBuff {
  buffType: string;
  multiplier: number;
  expiresAt: string;
}

export interface InventoryData {
  maxSlots: number;
  currentSlots: number;
  equipment: {
    weapon: string | null;
    armor: string | null;
  };
  activeBuffs: InventoryBuff[];
  items: InventoryItem[];
  speedBuffMultiplier: number;
}

export interface InventoryResponse {
  inventory: InventoryData;
  message?: string;
}

export const getInventoryStatus = () =>
  api.get<InventoryResponse>('/inventory');

export const addTestItem = (itemId: string, quantity: number = 1) =>
  api.post<InventoryResponse>('/inventory/add-test-item', { itemId, quantity });

export const useItem = (itemId: string, quantity: number = 1) =>
  api.post<InventoryResponse>('/inventory/use', { itemId, quantity });
