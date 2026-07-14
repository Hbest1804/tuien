import api from '../lib/axios';

export interface Drop {
  itemId: string;
  dropRate: number;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  recommendedRealmIndex: number;
  spiritStonesPerHour: number;
  drops: Drop[];
  top: string;
  left: string;
  type: string;
  color: string;
  danger: number;
  floors: number;
  bossData: { name: string; hp: number; atk: number; def: number; desc: string } | null;
  legendaryDrops: { itemId: string; quantity: number; chance: number }[];
}

export interface DungeonStatusResponse {
  dungeons: Dungeon[];
  isExploring: boolean;
  currentDungeonId: string | null;
  exploreStartedAt: string | null;
  currentFloor: number;
  floorEvents: any[];
}

export const getDungeonStatus = () => api.get<DungeonStatusResponse>('/dungeons');
export const startExploration = (dungeonId: string) => api.post('/dungeons/start', { dungeonId });
export const advanceFloor = () => api.post('/dungeons/advance-floor');
export const resolveFloorEvent = () => api.post('/dungeons/resolve-event');
export const fightBoss = () => api.post('/dungeons/fight-boss');
export const claimDungeonRewards = () => api.post('/dungeons/claim');
