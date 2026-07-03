import api from '../lib/axios';

export interface SectMission {
  id: string;
  level: 'Thiên' | 'Địa' | 'Huyền' | 'Hoàng';
  title: string;
  description: string;
  reward: number;
  durationSeconds: number;
  status: 'pending' | 'active' | 'completed';
  startedAt: string | null;
}

export interface SectMissionsResponse {
  missions: SectMission[];
  sectRank: string;
  sectContribution: number;
}

export const getSectMissions = () => 
  api.get<SectMissionsResponse>('/sect/missions');

export const startSectMission = (missionId: string) => 
  api.post<{ message: string; missions: SectMission[] }>('/sect/missions/start', { missionId });

export const completeSectMission = (missionId: string) => 
  api.post<SectMissionsResponse & { message: string }>('/sect/missions/complete', { missionId });
