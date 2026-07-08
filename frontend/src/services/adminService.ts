import api from '../lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  spiritStones: number;
  role: string;
  isBanned: boolean;
  isMuted: boolean;
  isCharacterCreated: boolean;
  spiritRoot: string | null;
  spiritRootGrade: string | null;
  gender: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  totalStones: number;
  bannedCount: number;
  totalSects: number;
  activeAuctions: number;
  dailyRegistrations: Record<string, number>;
  realmDistribution: number[];
  globalBuff: { enabled: boolean; multiplier: number; label: string; expires_at: string | null } | null;
  announcement: { enabled: boolean; message: string; type: string } | null;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CheatAlert {
  type: string;
  severity: 'warning' | 'danger';
  userId: string;
  username: string;
  detail: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get<DashboardStats>('/admin/dashboard');

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAdminUsers = (params: { search?: string; page?: number; limit?: number; isBanned?: boolean }) =>
  api.get<{ users: AdminUser[]; total: number; page: number }>('/admin/users', { params });

export const getAdminUserDetail = (id: string) =>
  api.get<{ user: AdminUser; cultivation: unknown; inventory: unknown }>(`/admin/users/${id}`);

export const banUser = (id: string, reason?: string) =>
  api.post<{ message: string }>(`/admin/users/${id}/ban`, { reason });

export const unbanUser = (id: string) =>
  api.post<{ message: string }>(`/admin/users/${id}/unban`);

export const muteUser = (id: string) =>
  api.post<{ message: string }>(`/admin/users/${id}/mute`);

export const unmuteUser = (id: string) =>
  api.post<{ message: string }>(`/admin/users/${id}/unmute`);

export const grantResources = (id: string, data: { spiritStones?: number; itemId?: string; itemQuantity?: number; reason?: string }) =>
  api.post<{ message: string }>(`/admin/users/${id}/grant-resources`, data);

export const adjustStats = (id: string, data: { expAccumulated?: number; realmIndex?: number; lifespan?: number; spiritRoot?: string; spiritRootGrade?: string; reason?: string }) =>
  api.post<{ message: string }>(`/admin/users/${id}/adjust-stats`, data);

// ─── Sects ────────────────────────────────────────────────────────────────────
export const getAdminSects = () =>
  api.get<{ sects: Array<{ name: string; memberCount: number }> }>('/admin/sects');

export const deleteAdminSect = (sectName: string, reason?: string) =>
  api.delete<{ message: string }>(`/admin/sects/${encodeURIComponent(sectName)}`, { data: { reason } });

export const renameAdminSect = (sectName: string, newName: string, reason?: string) =>
  api.patch<{ message: string }>(`/admin/sects/${encodeURIComponent(sectName)}/rename`, { newName, reason });

// ─── Auctions ─────────────────────────────────────────────────────────────────
export const getAdminAuctions = (params: { status?: string; page?: number; limit?: number }) =>
  api.get<{ listings: unknown[]; total: number }>('/admin/auctions', { params });

export const deleteAdminAuction = (id: string, reason?: string) =>
  api.delete<{ message: string }>(`/admin/auctions/${id}`, { data: { reason } });

// ─── Server Config ────────────────────────────────────────────────────────────
export const getServerConfig = () =>
  api.get<{ globalBuff: unknown; announcement: unknown }>('/admin/server-config');

export const setGlobalBuff = (data: { enabled: boolean; multiplier?: number; label?: string; expiresAt?: string | null }) =>
  api.patch<{ message: string }>('/admin/server-config/global-buff', data);

export const setAnnouncement = (data: { enabled: boolean; message?: string; type?: string }) =>
  api.patch<{ message: string }>('/admin/server-config/announcement', data);

// ─── Mail ─────────────────────────────────────────────────────────────────────
export const sendMail = (data: { recipientId?: string; subject: string; body: string; attachment?: unknown; broadcast?: boolean }) =>
  api.post<{ message: string }>('/admin/mail/send', data);

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAuditLogs = (params: { page?: number; limit?: number }) =>
  api.get<{ logs: AuditLog[]; total: number }>('/admin/audit-logs', { params });

export const getTransactions = (params: { page?: number; limit?: number }) =>
  api.get<{ transactions: unknown[]; total: number }>('/admin/transactions', { params });

export const getCheatAlerts = () =>
  api.get<{ alerts: CheatAlert[]; total: number }>('/admin/cheat-alerts');
