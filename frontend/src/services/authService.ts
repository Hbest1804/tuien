import api from '../lib/axios';

export interface AuthPayload {
  username?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: { id: string; username: string; email: string };
}

export const register = (data: AuthPayload) =>
  api.post<AuthResponse>('/auth/register', data);

export const login = (data: AuthPayload) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () =>
  api.get<{ user: AuthResponse['user'] }>('/auth/me');
