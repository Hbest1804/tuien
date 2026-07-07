import api from '../lib/axios';

export interface AuthPayload {
  username?: string;
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  _id: string;
  username: string;
  email: string;
  isCharacterCreated: boolean;
  gender: 'male' | 'female' | null;
  spiritRoot: string | null;
  spiritRootGrade: 'Thiên' | 'Địa' | 'Huyền' | 'Hoàng' | null;
  spiritStones?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: UserData;
}

export const register = (data: AuthPayload) =>
  api.post<AuthResponse>('/auth/register', data);

export const login = (data: AuthPayload) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () =>
  api.get<{ user: UserData }>('/auth/me');

export const setupCharacter = (gender: 'male' | 'female') =>
  api.post<{ message: string; user: UserData }>('/auth/setup-character', { gender });

export const refreshToken = (token: string) =>
  api.post<{ token: string; refreshToken: string; user: UserData }>('/auth/refresh', { refreshToken: token });

export const logoutApi = (token?: string) =>
  api.post<{ message: string }>('/auth/logout', { refreshToken: token });
