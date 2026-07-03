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
}

export interface DungeonStatusResponse {
  dungeons: Dungeon[];
  isExploring: boolean;
  currentDungeonId: string | null;
  exploreStartedAt: string | null;
}

export interface StartExplorationResponse {
  message: string;
  isExploring: boolean;
  currentDungeonId: string;
  exploreStartedAt: string;
}

export interface ClaimRewardsResponse {
  message: string;
  rewards: {
    spiritStones: number;
    items: { itemId: string; quantity: number }[];
  };
  isExploring: boolean;
}

export const getDungeonStatus = () => api.get<DungeonStatusResponse>('/dungeons');

export const startExploration = (dungeonId: string) => 
  api.post<StartExplorationResponse>('/dungeons/start', { dungeonId });

export const claimDungeonRewards = () => 
  api.post<ClaimRewardsResponse>('/dungeons/claim');
