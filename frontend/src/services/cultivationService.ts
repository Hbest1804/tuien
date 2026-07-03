import api from '../lib/axios';

export interface CultivationData {
  isTraining: boolean;
  trainingStartedAt: string | null;
  expAccumulated: number;
  currentExp: number;
  speed: number;
  realmIndex: number;
  realmName: string;
  realmColor: string;
  realmExpRequired: number | null;
  realmStages: string[];
  stageIndex: number;
  stageName: string;
  nextRealmName: string | null;
  progress: number;
  sectName: string | null;
  sectJoinedAt: string | null;
  isSectMember: boolean;
  sectContribution: number;
  sectRank: string;
  baseSpeed: number;
  spiritRootMultiplier: number;
  inventorySpeedMultiplier: number;
  // Breakthrough & Lifespan
  isBreakthroughReady: boolean;
  breakthroughReadyAt: string | null;
  yearsWaiting: number;
  lifespan: number;
  lifespanMax: number | null;
  createdAt: string;
  lastStoppedAt: string | null;
}

interface CultivationResponse {
  cultivation: CultivationData;
  message?: string;
  gained?: number;
}

export const getCultivationStatus = () =>
  api.get<CultivationResponse>('/cultivation/status');

export const startCultivation = () =>
  api.post<CultivationResponse>('/cultivation/start');

export const stopCultivation = () =>
  api.post<CultivationResponse>('/cultivation/stop');

export const doBreakthrough = (itemsUsed?: { itemId: string; quantity: number }[]) =>
  api.post<CultivationResponse>('/cultivation/breakthrough', { itemsUsed });

export const joinSect = (sectName: string) =>
  api.post<CultivationResponse>('/cultivation/join-sect', { sectName });

export const leaveSect = () =>
  api.post<CultivationResponse>('/cultivation/leave-sect');
