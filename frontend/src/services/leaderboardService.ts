import api from '../lib/axios';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  spiritRoot: string | null;
  spiritRootGrade: 'Thiên' | 'Địa' | 'Huyền' | 'Hoàng' | null;
  spiritStones: number;
  realmIndex: number;
  realmName: string;
  realmColor: string;
  expAccumulated: number;
  sectName: string | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  type: string;
}

export const getLeaderboard = (type: 'realm' | 'stones' = 'realm') =>
  api.get<LeaderboardResponse>('/leaderboard', { params: { type } });
