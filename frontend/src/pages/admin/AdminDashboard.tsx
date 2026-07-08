import { useState, useEffect, useCallback, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDashboardStats, getAdminUsers, banUser, unbanUser, muteUser, unmuteUser,
  grantResources, adjustStats, getAdminSects, deleteAdminSect, renameAdminSect,
  getAdminAuctions, deleteAdminAuction, getServerConfig, setGlobalBuff,
  setAnnouncement, sendMail, getAuditLogs, getTransactions, getCheatAlerts,
  type AdminUser, type DashboardStats, type AuditLog, type CheatAlert,
} from '../../services/adminService';
import {
  LayoutDashboard, Users, ShieldOff, Shield, Coins, Sword, Building2,
  Gavel, ShoppingBag, Megaphone, Mail, BarChart3, AlertTriangle,
  History, ChevronRight, Search, RefreshCw, X, Check, LogOut,
  TrendingUp, Zap, Star, Globe, ChevronLeft, ChevronDown, MessageSquareOff,
  MessageSquare, Eye, EyeOff, Send, Trophy, Flame, Crown, ScrollText
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard' | 'users' | 'banned' | 'resources' | 'stats'
  | 'sects' | 'auctions' | 'shop'
  | 'events' | 'mail' | 'audit' | 'transactions' | 'cheat';

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; message: string; type: 'success' | 'error' | 'info' }
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const add = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, add };
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-sm">
            Hủy
          </button>
          <button onClick={onConfirm} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${danger ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30' : 'bg-[#f2ca50]/20 border border-[#f2ca50]/50 text-[#f2ca50] hover:bg-[#f2ca50]/30'}`}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: ComponentType<{ size?: number; className?: string }>; color: string; sub?: string;
}) {
  return (
    <div className={`relative bg-[#141518] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-all duration-300`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.includes('yellow') ? 'bg-yellow-500/10 text-yellow-400' : color.includes('green') ? 'bg-green-500/10 text-green-400' : color.includes('red') ? 'bg-red-500/10 text-red-400' : color.includes('blue') ? 'bg-blue-500/10 text-blue-400' : color.includes('purple') ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'}`}>
            <Icon size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, variant }: { children: ReactNode; variant: 'success' | 'danger' | 'warning' | 'info' | 'muted' }) {
  const cls = {
    success: 'bg-green-500/15 text-green-400 border-green-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    muted: 'bg-white/5 text-gray-400 border-white/10',
  }[variant];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cls}`}>{children}</span>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
      <span>Trang {page}/{totalPages} — {total} kết quả</span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:border-white/30 transition-all">
          <ChevronLeft size={14} />
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:border-white/30 transition-all">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, add: toast } = useToast();
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void; danger?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userFilter, setUserFilter] = useState<'all' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  // Modals
  const [grantModal, setGrantModal] = useState<AdminUser | null>(null);
  const [statsModal, setStatsModal] = useState<AdminUser | null>(null);
  const [mailModal, setMailModal] = useState(false);

  // Sects state
  const [sects, setSects] = useState<Array<{ name: string; memberCount: number }>>([]);

  // Auctions state
  const [auctions, setAuctions] = useState<unknown[]>([]);
  const [auctionPage, setAuctionPage] = useState(1);
  const [auctionTotal, setAuctionTotal] = useState(0);
  const [auctionFilter, setAuctionFilter] = useState('active');

  // Events state
  const [globalBuff, setGlobalBuffState] = useState({ enabled: false, multiplier: 2, label: '', expires_at: null as string | null });
  const [announcement, setAnnouncementState] = useState({ enabled: false, message: '', type: 'info' });

  // Mail state
  const [mailForm, setMailForm] = useState({ subject: '', body: '', broadcast: true, recipientId: '' });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Transactions
  const [transactions, setTransactions] = useState<unknown[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  // Cheat alerts
  const [alerts, setAlerts] = useState<CheatAlert[]>([]);

  // Grant form
  const [grantForm, setGrantForm] = useState({ spiritStones: 0, itemId: '', itemQuantity: 1, reason: '' });
  // Stats form
  const [statsForm, setStatsForm] = useState({ expAccumulated: 0, realmIndex: 0, lifespan: 100, spiritRoot: '', spiritRootGrade: '', reason: '' });

  // ── Data loaders ─────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
      if (res.data.globalBuff) setGlobalBuffState(res.data.globalBuff as typeof globalBuff);
      if (res.data.announcement) setAnnouncementState(res.data.announcement as typeof announcement);
    } catch { toast('Lỗi tải dashboard', 'error'); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await getAdminUsers({ search: userSearch, page: userPage, limit: 20, isBanned: userFilter === 'banned' ? true : undefined });
      setUsers(res.data.users);
      setUserTotal(res.data.total);
    } catch { toast('Lỗi tải danh sách user', 'error'); }
  }, [userSearch, userPage, userFilter]);

  const loadSects = useCallback(async () => {
    try { const res = await getAdminSects(); setSects(res.data.sects); }
    catch { toast('Lỗi tải tông môn', 'error'); }
  }, []);

  const loadAuctions = useCallback(async () => {
    try {
      const res = await getAdminAuctions({ status: auctionFilter, page: auctionPage, limit: 20 });
      setAuctions(res.data.listings);
      setAuctionTotal(res.data.total);
    } catch { toast('Lỗi tải đấu giá', 'error'); }
  }, [auctionFilter, auctionPage]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await getAuditLogs({ page: auditPage, limit: 50 });
      setAuditLogs(res.data.logs);
      setAuditTotal(res.data.total);
    } catch { toast('Lỗi tải audit log', 'error'); }
  }, [auditPage]);

  const loadTransactions = useCallback(async () => {
    try {
      const res = await getTransactions({ page: txPage, limit: 50 });
      setTransactions(res.data.transactions);
      setTxTotal(res.data.total);
    } catch { toast('Lỗi tải lịch sử giao dịch', 'error'); }
  }, [txPage]);

  const loadCheatAlerts = useCallback(async () => {
    try { const res = await getCheatAlerts(); setAlerts(res.data.alerts); }
    catch { toast('Lỗi tải cảnh báo', 'error'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'users' || activeTab === 'banned' || activeTab === 'resources' || activeTab === 'stats') loadUsers();
    if (activeTab === 'sects') loadSects();
    if (activeTab === 'auctions') loadAuctions();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'transactions') loadTransactions();
    if (activeTab === 'cheat') loadCheatAlerts();
  }, [activeTab, loadDashboard, loadUsers, loadSects, loadAuctions, loadAuditLogs, loadTransactions, loadCheatAlerts]);

  useEffect(() => { if (activeTab === 'users' || activeTab === 'banned') loadUsers(); }, [userSearch, userPage, userFilter]);
  useEffect(() => { if (activeTab === 'auctions') loadAuctions(); }, [auctionFilter, auctionPage]);
  useEffect(() => { if (activeTab === 'audit') loadAuditLogs(); }, [auditPage]);
  useEffect(() => { if (activeTab === 'transactions') loadTransactions(); }, [txPage]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const doAction = async (fn: () => Promise<{ data: { message: string } }>, successMsg?: string) => {
    setLoading(true);
    try {
      const res = await fn();
      toast(successMsg || res.data.message, 'success');
      loadUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast(err?.response?.data?.message || 'Lỗi thao tác', 'error');
    } finally { setLoading(false); }
  };

  const confirmAction = (title: string, message: string, fn: () => Promise<void>, danger = false) => {
    setConfirm({ title, message, onConfirm: () => { setConfirm(null); fn(); }, danger });
  };

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navGroups = [
    {
      label: 'Tổng Quan',
      items: [
        { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      label: 'Người Chơi',
      items: [
        { id: 'users' as Tab, icon: Users, label: 'Danh Sách' },
        { id: 'banned' as Tab, icon: ShieldOff, label: 'Ban / Mute' },
        { id: 'resources' as Tab, icon: Coins, label: 'Tài Nguyên' },
        { id: 'stats' as Tab, icon: Sword, label: 'Chỉ Số' },
      ]
    },
    {
      label: 'Nội Dung',
      items: [
        { id: 'sects' as Tab, icon: Building2, label: 'Tông Môn' },
        { id: 'auctions' as Tab, icon: Gavel, label: 'Đấu Giá' },
      ]
    },
    {
      label: 'Vận Hành',
      items: [
        { id: 'events' as Tab, icon: Globe, label: 'Sự Kiện' },
        { id: 'mail' as Tab, icon: Mail, label: 'Hệ Thống Thư' },
      ]
    },
    {
      label: 'Thống Kê',
      items: [
        { id: 'audit' as Tab, icon: ScrollText, label: 'Audit Log' },
        { id: 'transactions' as Tab, icon: History, label: 'Giao Dịch' },
        { id: 'cheat' as Tab, icon: AlertTriangle, label: 'Cheat Detection' },
      ]
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER TABS
  // ─────────────────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng Tu Sĩ" value={stats?.totalUsers || 0} icon={Users} color="from-yellow-500/5 to-transparent" sub={`+${stats?.newUsers7d || 0} tuần này`} />
        <StatCard label="Đăng Ký Tháng" value={stats?.newUsers30d || 0} icon={TrendingUp} color="from-green-500/5 to-transparent" sub="30 ngày gần nhất" />
        <StatCard label="Linh Thạch LT" value={stats?.totalStones || 0} icon={Zap} color="from-purple-500/5 to-transparent" sub="Tổng lưu thông" />
        <StatCard label="Tài Khoản Khóa" value={stats?.bannedCount || 0} icon={ShieldOff} color="from-red-500/5 to-transparent" sub="Đang bị ban" />
        <StatCard label="Tông Môn" value={stats?.totalSects || 0} icon={Building2} color="from-blue-500/5 to-transparent" />
        <StatCard label="Đấu Giá Active" value={stats?.activeAuctions || 0} icon={Gavel} color="from-orange-500/5 to-transparent" />
        <StatCard label="Global Buff" value={stats?.globalBuff?.enabled ? `x${stats.globalBuff.multiplier}` : 'Tắt'} icon={Flame} color="from-red-500/5 to-transparent" sub={stats?.globalBuff?.label || ''} />
        <StatCard label="Server Status" value="Online" icon={Globe} color="from-green-500/5 to-transparent" sub="Hoạt động bình thường" />
      </div>

      {/* Realm Distribution */}
      <div className="bg-[#141518] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-[#f2ca50]" />Phân Bố Cảnh Giới</h3>
        <div className="space-y-3">
          {['Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần'].map((realm, i) => {
            const count = stats?.realmDistribution?.[i] || 0;
            const max = Math.max(...(stats?.realmDistribution || [1]));
            const pct = max > 0 ? (count / max) * 100 : 0;
            const colors = ['#7ed99e', '#f2ca50', '#ff9f43', '#b066ff', '#ff4757'];
            return (
              <div key={realm} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 text-right">{realm}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i] }} />
                </div>
                <span className="text-xs text-gray-400 w-10">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Registrations */}
      {stats?.dailyRegistrations && Object.keys(stats.dailyRegistrations).length > 0 && (
        <div className="bg-[#141518] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-[#7ed99e]" />Đăng Ký 7 Ngày Gần Nhất</h3>
          <div className="flex items-end gap-2 h-24">
            {Object.entries(stats.dailyRegistrations).map(([date, count]) => {
              const maxC = Math.max(...(Object.values(stats.dailyRegistrations) as number[]));
              const h = maxC > 0 ? ((count as number) / maxC) * 100 : 0;
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{count}</span>
                  <div className="w-full bg-[#7ed99e]/30 rounded-t" style={{ height: `${h}%`, minHeight: (count as number) > 0 ? 4 : 0 }} />
                  <span className="text-[10px] text-gray-600">{date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // User table (shared between tabs)
  const renderUserTable = (extraActions?: (u: AdminUser) => ReactNode) => (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" placeholder="Tìm username, email..."
            value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f2ca50]/50"
          />
        </div>
        <button onClick={loadUsers} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Username</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Email</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Linh Thạch</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Trạng Thái</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Ngày ĐK</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium text-xs uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f2ca50]/20 to-[#b066ff]/20 flex items-center justify-center text-xs font-bold text-[#f2ca50]">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{u.username}</div>
                        {u.role === 'admin' && <Badge variant="warning">Admin</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-[#f2ca50] font-mono">{(u.spiritStones || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.isBanned ? <Badge variant="danger">Bị Ban</Badge> : <Badge variant="success">Active</Badge>}
                      {u.isMuted && <Badge variant="warning">Muted</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {extraActions?.(u)}
                      {u.role !== 'admin' && (
                        <>
                          {u.isBanned ? (
                            <button onClick={() => confirmAction('Mở Khóa', `Mở khóa tài khoản ${u.username}?`, () => doAction(() => unbanUser(u.id)))}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all" title="Mở khóa">
                              <Shield size={13} />
                            </button>
                          ) : (
                            <button onClick={() => confirmAction('Ban', `Khóa tài khoản ${u.username}?`, () => doAction(() => banUser(u.id)), true)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Ban">
                              <ShieldOff size={13} />
                            </button>
                          )}
                          {u.isMuted ? (
                            <button onClick={() => doAction(() => unmuteUser(u.id))}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all" title="Bỏ mute">
                              <MessageSquare size={13} />
                            </button>
                          ) : (
                            <button onClick={() => doAction(() => muteUser(u.id))}
                              className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all" title="Mute">
                              <MessageSquareOff size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={userPage} total={userTotal} limit={20} onChange={setUserPage} />
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'banned'] as const).map(f => (
          <button key={f} onClick={() => { setUserFilter(f); setUserPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${userFilter === f ? 'bg-[#f2ca50]/20 text-[#f2ca50] border border-[#f2ca50]/30' : 'border border-white/10 text-gray-400 hover:border-white/30'}`}>
            {f === 'all' ? 'Tất Cả' : 'Bị Ban'}
          </button>
        ))}
      </div>
      {renderUserTable()}
    </div>
  );

  const renderBanned = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-400 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
        <AlertTriangle size={16} className="text-red-400 shrink-0" />
        Danh sách người chơi đang bị ban hoặc mute. Dùng bảng Danh Sách để lọc.
      </div>
      {renderUserTable()}
    </div>
  );

  const renderResources = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 bg-[#f2ca50]/5 border border-[#f2ca50]/20 rounded-xl p-4">
        Chọn người chơi từ bảng → nhấn nút <span className="text-[#f2ca50]">Tặng Tài Nguyên</span> để mở form.
      </div>
      {renderUserTable((u) => (
        <button onClick={() => { setGrantModal(u); setGrantForm({ spiritStones: 0, itemId: '', itemQuantity: 1, reason: '' }); }}
          className="p-1.5 rounded-lg bg-[#f2ca50]/10 text-[#f2ca50] hover:bg-[#f2ca50]/20 transition-all" title="Tặng tài nguyên">
          <Coins size={13} />
        </button>
      ))}
      {grantModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-5">Tặng Tài Nguyên — {grantModal.username}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Linh Thạch (âm để trừ)</label>
                <input type="number" value={grantForm.spiritStones}
                  onChange={e => setGrantForm(f => ({ ...f, spiritStones: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Item ID (tuỳ chọn)</label>
                <input type="text" placeholder="pill_tu_khi_dan" value={grantForm.itemId}
                  onChange={e => setGrantForm(f => ({ ...f, itemId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Số lượng</label>
                <input type="number" min={1} value={grantForm.itemQuantity}
                  onChange={e => setGrantForm(f => ({ ...f, itemQuantity: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Lý do</label>
                <input type="text" value={grantForm.reason}
                  onChange={e => setGrantForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setGrantModal(null)} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm">Hủy</button>
              <button onClick={async () => {
                setLoading(true);
                try {
                  const res = await grantResources(grantModal.id, grantForm);
                  toast(res.data.message, 'success');
                  setGrantModal(null);
                } catch (e: unknown) {
                  const err = e as { response?: { data?: { message?: string } } };
                  toast(err?.response?.data?.message || 'Lỗi', 'error');
                } finally { setLoading(false); }
              }} className="px-5 py-2 rounded-lg bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#f2ca50] text-sm font-semibold hover:bg-[#f2ca50]/30 transition-all">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 bg-[#b066ff]/5 border border-[#b066ff]/20 rounded-xl p-4">
        Chọn người chơi → nhấn <span className="text-[#b066ff]">Điều Chỉnh Chỉ Số</span> để sửa EXP, Cảnh giới, Thọ nguyên, Linh căn.
      </div>
      {renderUserTable((u) => (
        <button onClick={() => { setStatsModal(u); setStatsForm({ expAccumulated: 0, realmIndex: 0, lifespan: 100, spiritRoot: u.spiritRoot || '', spiritRootGrade: u.spiritRootGrade || '', reason: '' }); }}
          className="p-1.5 rounded-lg bg-[#b066ff]/10 text-[#b066ff] hover:bg-[#b066ff]/20 transition-all" title="Điều chỉnh chỉ số">
          <Star size={13} />
        </button>
      ))}
      {statsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-5">Điều Chỉnh Chỉ Số — {statsModal.username}</h3>
            <div className="space-y-4 text-sm">
              {[
                { label: 'EXP Tích Lũy', key: 'expAccumulated', type: 'number' },
                { label: 'Cảnh Giới (0-4)', key: 'realmIndex', type: 'number' },
                { label: 'Thọ Nguyên', key: 'lifespan', type: 'number' },
                { label: 'Linh Căn (vd: Hỏa)', key: 'spiritRoot', type: 'text' },
                { label: 'Phẩm Linh Căn', key: 'spiritRootGrade', type: 'text' },
                { label: 'Lý Do', key: 'reason', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(statsForm as Record<string, string | number>)[f.key]}
                    onChange={e => setStatsForm(s => ({ ...s, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#b066ff]/50" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setStatsModal(null)} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 text-sm">Hủy</button>
              <button onClick={async () => {
                setLoading(true);
                try {
                  const res = await adjustStats(statsModal.id, statsForm);
                  toast(res.data.message, 'success');
                  setStatsModal(null);
                } catch { toast('Lỗi', 'error'); } finally { setLoading(false); }
              }} className="px-5 py-2 rounded-lg bg-[#b066ff]/20 border border-[#b066ff]/40 text-[#b066ff] text-sm font-semibold">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSects = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={loadSects} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>
      <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Tông Môn</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase">Thành Viên</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium text-xs uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {sects.map(s => (
              <tr key={s.name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <Crown size={14} className="text-[#f2ca50]" />{s.name}
                </td>
                <td className="px-4 py-3 text-gray-400">{s.memberCount} người</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => {
                      const newName = window.prompt(`Đổi tên "${s.name}" thành:`);
                      if (newName) confirmAction('Đổi tên', `Đổi "${s.name}" → "${newName}"?`, async () => {
                        const res = await renameAdminSect(s.name, newName);
                        toast(res.data.message, 'success');
                        loadSects();
                      });
                    }} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
                      Đổi Tên
                    </button>
                    <button onClick={() => confirmAction('Giải Tán', `Giải tán tông môn "${s.name}"? Tất cả thành viên sẽ bị kick.`, async () => {
                      const res = await deleteAdminSect(s.name);
                      toast(res.data.message, 'success');
                      loadSects();
                    }, true)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all">
                      Giải Tán
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sects.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">Không có tông môn</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuctions = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['active', 'sold', 'cancelled', 'expired', 'all'] as const).map(f => (
          <button key={f} onClick={() => { setAuctionFilter(f); setAuctionPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${auctionFilter === f ? 'bg-[#f2ca50]/20 text-[#f2ca50] border border-[#f2ca50]/30' : 'border border-white/10 text-gray-400 hover:border-white/30'}`}>
            {f === 'active' ? 'Đang Diễn Ra' : f === 'sold' ? 'Đã Bán' : f === 'cancelled' ? 'Đã Hủy' : f === 'expired' ? 'Hết Hạn' : 'Tất Cả'}
          </button>
        ))}
        <button onClick={loadAuctions} className="ml-auto p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>
      <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Vật Phẩm</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Người Bán</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Giá Hiện Tại</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Hết Hạn</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-right text-gray-500 text-xs uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {(auctions as Array<Record<string, string | number>>).map(a => (
                <tr key={a.id as string} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white">{a.item_name as string} <span className="text-gray-500">x{a.quantity as number}</span></td>
                  <td className="px-4 py-3 text-gray-400">{a.seller_name as string}</td>
                  <td className="px-4 py-3 text-[#f2ca50] font-mono">{(a.current_bid as number).toLocaleString()} 💎</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(a.expires_at as string)?.slice(0, 16)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === 'active' ? 'success' : a.status === 'sold' ? 'info' : 'muted'}>{a.status as string}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'active' && (
                      <div className="flex justify-end">
                        <button onClick={() => confirmAction('Xóa Listing', `Xóa listing "${a.item_name}"? Sẽ hoàn tiền cho người đặt thầu.`, async () => {
                          const res = await deleteAdminAuction(a.id as string);
                          toast(res.data.message, 'success');
                          loadAuctions();
                        }, true)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all">
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {auctions.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={auctionPage} total={auctionTotal} limit={20} onChange={setAuctionPage} />
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      {/* Global Buff */}
      <div className="bg-[#141518] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><Flame size={16} className="text-red-400" />Global Buff Tu Luyện</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setGlobalBuffState(s => ({ ...s, enabled: !s.enabled }))}
                className={`w-10 h-6 rounded-full transition-all duration-300 relative ${globalBuff.enabled ? 'bg-[#7ed99e]' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${globalBuff.enabled ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-300">{globalBuff.enabled ? 'Đang bật' : 'Đang tắt'}</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Hệ Số (x2, x3...)</label>
              <input type="number" min={1} max={10} value={globalBuff.multiplier}
                onChange={e => setGlobalBuffState(s => ({ ...s, multiplier: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#7ed99e]/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tên Sự Kiện</label>
              <input type="text" placeholder="Sự kiện Tết..." value={globalBuff.label}
                onChange={e => setGlobalBuffState(s => ({ ...s, label: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#7ed99e]/50" />
            </div>
          </div>
          <button onClick={async () => {
            try {
              const res = await setGlobalBuff({ enabled: globalBuff.enabled, multiplier: globalBuff.multiplier, label: globalBuff.label });
              toast(res.data.message, 'success');
            } catch { toast('Lỗi cập nhật buff', 'error'); }
          }} className="px-6 py-2 rounded-xl bg-[#7ed99e]/20 border border-[#7ed99e]/40 text-[#7ed99e] text-sm font-semibold hover:bg-[#7ed99e]/30 transition-all">
            Lưu Buff
          </button>
        </div>
      </div>

      {/* Announcement */}
      <div className="bg-[#141518] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><Megaphone size={16} className="text-blue-400" />Thông Báo Server</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div onClick={() => setAnnouncementState(s => ({ ...s, enabled: !s.enabled }))}
              className={`w-10 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${announcement.enabled ? 'bg-blue-400' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${announcement.enabled ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-300">{announcement.enabled ? 'Đang hiển thị' : 'Tắt'}</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Loại</label>
            <select value={announcement.type} onChange={e => setAnnouncementState(s => ({ ...s, type: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none w-full">
              <option value="info">Thông Báo</option>
              <option value="warning">Cảnh Báo</option>
              <option value="maintenance">Bảo Trì</option>
              <option value="event">Sự Kiện</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nội Dung</label>
            <textarea rows={3} value={announcement.message}
              onChange={e => setAnnouncementState(s => ({ ...s, message: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none resize-none focus:border-blue-400/50" />
          </div>
          <button onClick={async () => {
            try {
              const res = await setAnnouncement({ enabled: announcement.enabled, message: announcement.message, type: announcement.type });
              toast(res.data.message, 'success');
            } catch { toast('Lỗi cập nhật thông báo', 'error'); }
          }} className="px-6 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-all">
            Lưu Thông Báo
          </button>
        </div>
      </div>
    </div>
  );

  const renderMail = () => (
    <div className="bg-[#141518] border border-white/5 rounded-2xl p-6 space-y-5">
      <h3 className="text-white font-semibold flex items-center gap-2"><Mail size={16} className="text-[#f2ca50]" />Gửi Thư Cho Người Chơi</h3>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={mailForm.broadcast} onChange={e => setMailForm(f => ({ ...f, broadcast: e.target.checked }))} className="w-4 h-4 accent-[#f2ca50]" />
          <span className="text-sm text-gray-300">Gửi cho tất cả người chơi</span>
        </label>
      </div>
      {!mailForm.broadcast && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">User ID người nhận</label>
          <input type="text" value={mailForm.recipientId} onChange={e => setMailForm(f => ({ ...f, recipientId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
        </div>
      )}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Tiêu Đề</label>
        <input type="text" value={mailForm.subject} onChange={e => setMailForm(f => ({ ...f, subject: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Nội Dung</label>
        <textarea rows={5} value={mailForm.body} onChange={e => setMailForm(f => ({ ...f, body: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none resize-none focus:border-[#f2ca50]/50" />
      </div>
      <button onClick={async () => {
        if (!mailForm.subject || !mailForm.body) return toast('Vui lòng nhập đầy đủ thông tin', 'error');
        confirmAction(
          mailForm.broadcast ? 'Gửi Broadcast' : 'Gửi Thư',
          mailForm.broadcast ? 'Gửi thư tới TẤT CẢ người chơi?' : `Gửi thư tới ${mailForm.recipientId}?`,
          async () => {
            try {
              const res = await sendMail({ ...mailForm });
              toast(res.data.message, 'success');
              setMailForm(f => ({ ...f, subject: '', body: '' }));
            } catch { toast('Lỗi gửi thư', 'error'); }
          }
        );
      }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#f2ca50] text-sm font-semibold hover:bg-[#f2ca50]/30 transition-all">
        <Send size={14} />
        {mailForm.broadcast ? 'Gửi Broadcast' : 'Gửi Thư'}
      </button>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={loadAuditLogs} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>
      <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Thời Gian</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Admin</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Hành Động</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Mục Tiêu</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{log.created_at?.slice(0, 19).replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-[#f2ca50] text-xs font-medium">{log.admin_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      log.action.includes('BAN') ? 'danger' :
                      log.action.includes('GRANT') || log.action.includes('SEND') ? 'success' :
                      log.action.includes('DELETE') ? 'danger' : 'info'
                    }>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{log.target_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-[200px] truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Chưa có log</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={auditPage} total={auditTotal} limit={50} onChange={setAuditPage} />
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={loadTransactions} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>
      <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Vật Phẩm</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Người Bán</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Người Mua</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Giá</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Trạng Thái</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {(transactions as Array<Record<string, string | number>>).map(tx => (
                <tr key={tx.id as string} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white">{tx.item_name as string} <span className="text-gray-500">x{tx.quantity as number}</span></td>
                  <td className="px-4 py-3 text-gray-400">{tx.seller_name as string}</td>
                  <td className="px-4 py-3 text-gray-400">{(tx.bidder_name as string) || '—'}</td>
                  <td className="px-4 py-3 text-[#f2ca50] font-mono">{(tx.current_bid as number).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.status === 'sold' ? 'success' : tx.status === 'cancelled' ? 'danger' : 'muted'}>{tx.status as string}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(tx.updated_at as string)?.slice(0, 10)}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Không có giao dịch</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={txPage} total={txTotal} limit={50} onChange={setTxPage} />
        </div>
      </div>
    </div>
  );

  const renderCheat = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Phát hiện {alerts.length} cảnh báo bất thường</div>
        <button onClick={loadCheatAlerts} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>
      {alerts.length === 0 && (
        <div className="bg-[#141518] border border-white/5 rounded-2xl p-10 text-center text-gray-500">
          <Check size={32} className="mx-auto mb-3 text-green-400" />
          Không phát hiện bất thường
        </div>
      )}
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${alert.severity === 'danger' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
            <AlertTriangle size={18} className={alert.severity === 'danger' ? 'text-red-400 mt-0.5 shrink-0' : 'text-yellow-400 mt-0.5 shrink-0'} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={alert.severity === 'danger' ? 'danger' : 'warning'}>{alert.type}</Badge>
                <span className="text-white font-medium text-sm">{alert.username}</span>
              </div>
              <div className="text-gray-400 text-sm">{alert.detail}</div>
              <div className="text-gray-600 text-xs mt-1">{alert.userId}</div>
            </div>
            <button onClick={() => confirmAction('Ban User', `Ban ${alert.username} vì nghi ngờ gian lận?`, () => doAction(() => banUser(alert.userId, 'Cheat Detection'), `Đã ban ${alert.username}`), true)}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-all whitespace-nowrap">
              Ban Ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tabContent: Record<Tab, ReactNode> = {
    dashboard: renderDashboard(),
    users: renderUsers(),
    banned: renderBanned(),
    resources: renderResources(),
    stats: renderStats(),
    sects: renderSects(),
    auctions: renderAuctions(),
    shop: <div className="text-gray-400 p-8 text-center">Shop Config — Coming soon (đang phát triển thêm)</div>,
    events: renderEvents(),
    mail: renderMail(),
    audit: renderAuditLogs(),
    transactions: renderTransactions(),
    cheat: renderCheat(),
  };

  const tabLabels: Record<Tab, string> = {
    dashboard: 'Dashboard', users: 'Danh Sách Người Chơi', banned: 'Ban / Mute',
    resources: 'Tặng Tài Nguyên', stats: 'Điều Chỉnh Chỉ Số',
    sects: 'Quản Lý Tông Môn', auctions: 'Quản Lý Đấu Giá', shop: 'Cấu Hình Shop',
    events: 'Sự Kiện & Global Buff', mail: 'Hệ Thống Thư',
    audit: 'Audit Log', transactions: 'Lịch Sử Giao Dịch', cheat: 'Cheat Detection',
  };

  // ─── LAYOUT ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0b0d] flex font-body-md">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} shrink-0 bg-[#0e0f12] border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden sticky top-0 h-screen z-30`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f2ca50] to-[#b066ff] flex items-center justify-center shrink-0">
            <Shield size={16} className="text-black" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-sm leading-none">Admin</div>
              <div className="text-gray-500 text-[10px]">Tu Tiên Control</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navGroups.map(group => (
            <div key={group.label} className="mb-4">
              {sidebarOpen && <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">{group.label}</div>}
              {group.items.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <item.icon size={16} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-2">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            {sidebarOpen && <span>Thu gọn</span>}
          </button>
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm">
            <LogOut size={15} className="shrink-0" />
            {sidebarOpen && <span>Về Game</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-[#0e0f12]/80 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-white font-semibold text-lg">{tabLabels[activeTab]}</h1>
            <div className="text-gray-500 text-xs">Tu Tiên Admin Dashboard</div>
          </div>
          <div className="flex items-center gap-4">
            {alerts.length > 0 && (
              <button onClick={() => setActiveTab('cheat')} className="relative p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                <AlertTriangle size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{alerts.length}</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f2ca50] to-[#b066ff] flex items-center justify-center text-xs font-bold text-black">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="text-sm text-white">{user?.username}</div>
              <Badge variant="warning">Admin</Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {tabContent[activeTab]}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[300] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl text-sm font-medium animate-slide-in-right ${
            t.type === 'success' ? 'bg-[#0e0f12] border-green-500/30 text-green-400' :
            t.type === 'error' ? 'bg-[#0e0f12] border-red-500/30 text-red-400' :
            'bg-[#0e0f12] border-[#f2ca50]/30 text-[#f2ca50]'
          }`}>
            {t.type === 'success' ? <Check size={14} /> : t.type === 'error' ? <X size={14} /> : <Zap size={14} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          danger={confirm.danger}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[400] bg-black/30 flex items-center justify-center backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full border-2 border-[#f2ca50]/30 border-t-[#f2ca50] animate-spin" />
        </div>
      )}
    </div>
  );
}
