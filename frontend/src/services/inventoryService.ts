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

export interface EquippedStats {
  atkBonus: number;
  defBonus: number;
  tribulationDefense: number;
}

export interface InventoryData {
  maxSlots: number;
  currentSlots: number;
  equipment: {
    weapon: string | null;
    armor: string | null;
  };
  equippedWeapon: (InventoryItem & { itemId: string }) | null;
  equippedArmor: (InventoryItem & { itemId: string }) | null;
  equippedStats: EquippedStats;
  techniquePassiveBonus: number;
  activeBuffs: InventoryBuff[];
  items: InventoryItem[];
  speedBuffMultiplier: number;
  totalSpeedMultiplier: number;
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

export const equipItem = (itemId: string) =>
  api.post<InventoryResponse>('/inventory/equip', { itemId });

export const unequipItem = (slot: 'weapon' | 'armor') =>
  api.post<InventoryResponse>('/inventory/unequip', { slot });

export const learnTechnique = (itemId: string) =>
  api.post<InventoryResponse>('/inventory/learn-technique', { itemId });
