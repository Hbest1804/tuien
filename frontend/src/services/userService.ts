import api from '../lib/axios';

export interface PublicProfile {
  username: string;
  gender: 'male' | 'female' | null;
  spiritRoot: string | null;
  spiritRootGrade: 'Thiên' | 'Địa' | 'Huyền' | 'Hoàng' | null;
  isCharacterCreated: boolean;
  realm: string | null;
  realmLevel: number | null;
  totalExp: number;
  sectName: string | null;
  sectLevel: number | null;
  createdAt: string;
}

export const getPublicProfile = (username: string) =>
  api.get<{ profile: PublicProfile }>(`/users/${username}`);
