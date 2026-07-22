import { useState, useEffect, useCallback, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDashboardStats, getAdminUsers, banUser, unbanUser, muteUser, unmuteUser,
  grantResources, adjustStats, getAdminSects, deleteAdminSect, renameAdminSect,
  getAdminAuctions, deleteAdminAuction, getServerConfig, setGlobalBuff,
  setAnnouncement, sendMail, getAuditLogs, getTransactions, getCheatAlerts,
  getRecipesConfig, updateRecipesConfig, resetRecipeConfig,
  getDungeonsConfig, updateDungeonsConfig, resetDungeonConfig,
  createAdminSect,
  type AdminUser, type DashboardStats, type AuditLog, type CheatAlert,
} from '../../services/adminService';
import {
  LayoutDashboard, Users, ShieldOff, Shield, Coins, Sword, Building2,
  Gavel, ShoppingBag, Megaphone, Mail, BarChart3, AlertTriangle,
  History, ChevronRight, Search, RefreshCw, X, Check, LogOut,
  TrendingUp, Zap, Star, Globe, ChevronLeft, ChevronDown, MessageSquareOff,
  MessageSquare, Eye, EyeOff, Send, Trophy, Flame, Crown, ScrollText,
  FlaskConical, Map, Plus, RotateCcw, Edit3, ChevronUp, Swords
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard' | 'users' | 'banned' | 'resources' | 'stats'
  | 'sects' | 'auctions' | 'shop' | 'recipes' | 'dungeons'
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

  // Recipes config state
  const [recipesOverrides, setRecipesOverrides] = useState<Record<string, Record<string, unknown>>>({});
  const [editRecipeModal, setEditRecipeModal] = useState<string | null>(null); // recipeId
  const [editRecipeForm, setEditRecipeForm] = useState<Record<string, unknown>>({});

  // Dungeons config state
  const [dungeonsOverrides, setDungeonsOverrides] = useState<Record<string, Record<string, unknown>>>({});
  const [editDungeonModal, setEditDungeonModal] = useState<string | null>(null); // dungeonId
  const [editDungeonForm, setEditDungeonForm] = useState<Record<string, unknown>>({});

  // Create sect modal
  const [createSectModal, setCreateSectModal] = useState(false);
  const [createSectForm, setCreateSectForm] = useState({ name: '', description: '', maxMembers: 50 });

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

  const loadRecipesConfig = useCallback(async () => {
    try {
      const res = await getRecipesConfig();
      setRecipesOverrides((res.data.overrides || {}) as Record<string, Record<string, unknown>>);
    } catch { toast('Lỗi tải đan phương', 'error'); }
  }, []);

  const loadDungeonsConfig = useCallback(async () => {
    try {
      const res = await getDungeonsConfig();
      setDungeonsOverrides((res.data.overrides || {}) as Record<string, Record<string, unknown>>);
    } catch { toast('Lỗi tải bí cảnh', 'error'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'users' || activeTab === 'banned' || activeTab === 'resources' || activeTab === 'stats') loadUsers();
    if (activeTab === 'sects') loadSects();
    if (activeTab === 'auctions') loadAuctions();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'transactions') loadTransactions();
    if (activeTab === 'cheat') loadCheatAlerts();
    if (activeTab === 'recipes') loadRecipesConfig();
    if (activeTab === 'dungeons') loadDungeonsConfig();
  }, [activeTab, loadDashboard, loadUsers, loadSects, loadAuctions, loadAuditLogs, loadTransactions, loadCheatAlerts, loadRecipesConfig, loadDungeonsConfig]);

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
        { id: 'recipes' as Tab, icon: FlaskConical, label: 'Đan Phương' },
        { id: 'dungeons' as Tab, icon: Map, label: 'Bí Cảnh' },
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Quản lý {sects.length} tông môn trong game</div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCreateSectModal(true); setCreateSectForm({ name: '', description: '', maxMembers: 50 }); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#f2ca50] text-xs font-semibold hover:bg-[#f2ca50]/30 transition-all"
          >
            <Plus size={13} /> Tạo Tông Môn
          </button>
          <button onClick={loadSects} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
        </div>
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

      {/* Modal tạo tông môn */}
      {createSectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#f2ca50]/15 border border-[#f2ca50]/30 flex items-center justify-center">
                <Building2 size={16} className="text-[#f2ca50]" />
              </div>
              <h3 className="text-white font-bold text-lg">Tạo Tông Môn Mới</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tên Tông Môn <span className="text-red-400">*</span></label>
                <input
                  type="text" placeholder="Thiên Kiếm Tông..."
                  value={createSectForm.name}
                  onChange={e => setCreateSectForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mô Tả (tuỳ chọn)</label>
                <textarea
                  rows={2} placeholder="Mô tả về tông môn..."
                  value={createSectForm.description}
                  onChange={e => setCreateSectForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none resize-none focus:border-[#f2ca50]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Số Thành Viên Tối Đa</label>
                <input
                  type="number" min={5} max={500}
                  value={createSectForm.maxMembers}
                  onChange={e => setCreateSectForm(f => ({ ...f, maxMembers: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#f2ca50]/50"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setCreateSectModal(false)} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm">Hủy</button>
              <button onClick={async () => {
                if (!createSectForm.name.trim()) return toast('Vui lòng nhập tên tông môn', 'error');
                setLoading(true);
                try {
                  const res = await createAdminSect(createSectForm);
                  toast(res.data.message, 'success');
                  setCreateSectModal(false);
                  loadSects();
                } catch (e: unknown) {
                  const err = e as { response?: { data?: { message?: string } } };
                  toast(err?.response?.data?.message || 'Lỗi tạo tông môn', 'error');
                } finally { setLoading(false); }
              }} className="px-5 py-2 rounded-lg bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#f2ca50] text-sm font-semibold hover:bg-[#f2ca50]/30 transition-all flex items-center gap-2">
                <Plus size={14} /> Tạo Tông Môn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  // ─── Data static cho đan phương (default values) ─────────────────────────────
  const RECIPES_DEFAULT: Record<string, { name: string; realmRequired: number; successRate: number; ingredients: { itemId: string; quantity: number }[]; output: { itemId: string; quantity: number } }> = {
    'recipe_tu_khi':    { name: 'Luyện Tụ Khí Đan',           realmRequired: 0, successRate: 0.9,  ingredients: [{ itemId: 'mat_huyet_linh_thao', quantity: 3 }],                                                          output: { itemId: 'pill_tu_khi_dan', quantity: 1 } },
    'recipe_truc_co':   { name: 'Luyện Trúc Cơ Đan',          realmRequired: 1, successRate: 0.75, ingredients: [{ itemId: 'mat_kim_dan_thao', quantity: 2 }, { itemId: 'mat_huyet_linh_thao', quantity: 1 }],              output: { itemId: 'pill_truc_co_dan', quantity: 1 } },
    'recipe_tay_tuy':   { name: 'Luyện Tẩy Tủy Đan',          realmRequired: 0, successRate: 0.8,  ingredients: [{ itemId: 'mat_huyet_linh_thao', quantity: 2 }, { itemId: 'mat_kim_dan_thao', quantity: 1 }],              output: { itemId: 'pill_tay_tuy_dan', quantity: 1 } },
    'recipe_linh_khi':  { name: 'Luyện Linh Khí Đan',         realmRequired: 1, successRate: 0.6,  ingredients: [{ itemId: 'mat_kim_dan_thao', quantity: 2 }, { itemId: 'mat_nguyen_anh_thach', quantity: 1 }],             output: { itemId: 'pill_linh_khi_dan', quantity: 1 } },
    'recipe_pha_canh':  { name: 'Luyện Phá Cảnh Đan',         realmRequired: 1, successRate: 0.7,  ingredients: [{ itemId: 'mat_kim_dan_thao', quantity: 3 }, { itemId: 'mat_huyet_linh_thao', quantity: 2 }],              output: { itemId: 'pill_pha_canh_dan', quantity: 1 } },
    'recipe_thien_dieu':{ name: 'Luyện Thiên Diệu Đan',       realmRequired: 2, successRate: 0.5,  ingredients: [{ itemId: 'mat_nguyen_anh_thach', quantity: 2 }, { itemId: 'mat_kim_dan_thao', quantity: 3 }],             output: { itemId: 'pill_thien_dieu_dan', quantity: 1 } },
    'recipe_tho_nguyen':{ name: 'Luyện Thọ Nguyên Quả',       realmRequired: 2, successRate: 0.55, ingredients: [{ itemId: 'mat_nguyen_anh_thach', quantity: 1 }, { itemId: 'mat_hoa_than_tinh', quantity: 1 }],            output: { itemId: 'pill_tho_nguyen_qua', quantity: 1 } },
    'recipe_kim_dan_thượng': { name: 'Luyện Kim Đan (Thượng Phẩm)', realmRequired: 3, successRate: 0.4, ingredients: [{ itemId: 'mat_hoa_than_tinh', quantity: 2 }, { itemId: 'mat_nguyen_anh_thach', quantity: 3 }],      output: { itemId: 'pill_kim_dan', quantity: 1 } },
  };

  const REALM_LABELS = ['Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần'];

  const renderRecipes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400 bg-[#f2ca50]/5 border border-[#f2ca50]/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <FlaskConical size={14} className="text-[#f2ca50]" />
          Chỉnh thuộc tính đan phương — override sẽ ghi đè mặc định. Bấm <span className="text-[#f2ca50] font-semibold">Reset</span> để về mặc định.
        </div>
        <button onClick={loadRecipesConfig} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>

      <div className="grid gap-3">
        {Object.entries(RECIPES_DEFAULT).map(([recipeId, def]) => {
          const override = recipesOverrides[recipeId] || {};
          const current = { ...def, ...override };
          const hasOverride = Object.keys(override).length > 0;
          return (
            <div key={recipeId} className={`bg-[#141518] border rounded-2xl p-5 transition-all ${hasOverride ? 'border-[#f2ca50]/30' : 'border-white/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f2ca50]/10 border border-[#f2ca50]/20 flex items-center justify-center text-sm">⚗️</div>
                  <div>
                    <div className="text-white font-medium text-sm">{current.name}</div>
                    <div className="text-gray-500 text-xs">{recipeId}</div>
                  </div>
                  {hasOverride && <span className="px-2 py-0.5 rounded-full bg-[#f2ca50]/15 border border-[#f2ca50]/30 text-[#f2ca50] text-[10px] font-semibold">Override</span>}
                </div>
                <div className="flex gap-2">
                  {hasOverride && (
                    <button onClick={() => confirmAction('Reset Đan Phương', `Reset "${def.name}" về mặc định?`, async () => {
                      const res = await resetRecipeConfig(recipeId);
                      toast(res.data.message, 'success');
                      loadRecipesConfig();
                    })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                  <button onClick={() => {
                    setEditRecipeModal(recipeId);
                    setEditRecipeForm({
                      successRate: (override.successRate ?? def.successRate) as number,
                      realmRequired: (override.realmRequired ?? def.realmRequired) as number,
                    });
                  }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f2ca50]/10 border border-[#f2ca50]/20 text-[#f2ca50] hover:bg-[#f2ca50]/20 text-xs transition-all">
                    <Edit3 size={11} /> Chỉnh Sửa
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Tỷ Lệ Thành Công</div>
                  <div className={`font-bold ${hasOverride && override.successRate !== undefined ? 'text-[#f2ca50]' : 'text-white'}`}>
                    {Math.round((current.successRate as number) * 100)}%
                  </div>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Yêu Cầu Cảnh Giới</div>
                  <div className={`font-bold ${hasOverride && override.realmRequired !== undefined ? 'text-[#f2ca50]' : 'text-white'}`}>
                    {REALM_LABELS[(current.realmRequired as number)] || `Cảnh ${current.realmRequired}`}
                  </div>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Nguyên Liệu</div>
                  <div className="text-white font-bold">{(current.ingredients as unknown[]).length} loại</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Recipe Modal */}
      {editRecipeModal && (() => {
        const def = RECIPES_DEFAULT[editRecipeModal];
        if (!def) return null;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#f2ca50]/15 border border-[#f2ca50]/30 flex items-center justify-center text-base">⚗️</div>
                <div>
                  <h3 className="text-white font-bold text-lg">Chỉnh Đan Phương</h3>
                  <div className="text-gray-500 text-xs">{def.name}</div>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tỷ Lệ Thành Công (0–1, vd: 0.75 = 75%)</label>
                  <input
                    type="number" step="0.01" min={0} max={1}
                    value={editRecipeForm.successRate as number}
                    onChange={e => setEditRecipeForm(f => ({ ...f, successRate: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f2ca50]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Yêu Cầu Cảnh Giới (0=Luyện Khí … 4=Hóa Thần)</label>
                  <select
                    value={editRecipeForm.realmRequired as number}
                    onChange={e => setEditRecipeForm(f => ({ ...f, realmRequired: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#f2ca50]/50"
                  >
                    {REALM_LABELS.map((r, i) => <option key={i} value={i}>{i} — {r}</option>)}
                  </select>
                </div>
                <div className="bg-white/3 rounded-xl p-3 text-xs text-gray-400">
                  <div className="font-semibold text-gray-300 mb-2">Nguyên Liệu (không thay đổi được)</div>
                  {def.ingredients.map(ing => (
                    <div key={ing.itemId} className="flex justify-between py-0.5">
                      <span>{ing.itemId}</span><span className="text-white">x{ing.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/5 mt-2 pt-2 flex justify-between">
                    <span>Output:</span><span className="text-[#f2ca50]">{def.output.itemId} x{def.output.quantity}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setEditRecipeModal(null)} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm">Hủy</button>
                <button onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await updateRecipesConfig(editRecipeModal, editRecipeForm);
                    toast(res.data.message, 'success');
                    setEditRecipeModal(null);
                    loadRecipesConfig();
                  } catch { toast('Lỗi cập nhật', 'error'); } finally { setLoading(false); }
                }} className="px-5 py-2 rounded-lg bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#f2ca50] text-sm font-semibold hover:bg-[#f2ca50]/30 transition-all">
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // ─── Data static cho bí cảnh (default values) ────────────────────────────────
  const DUNGEONS_DEFAULT: Record<string, { name: string; requiredRealmIndex: number; spiritStonesPerHour: number; floors: number; danger: number; bossData: { name: string; hp: number; atk: number; def: number } | null }> = {
    'dung_thu_thach_coc':   { name: 'Thử Thách Cốc',      requiredRealmIndex: 0, spiritStonesPerHour: 500,   floors: 5,  danger: 10, bossData: { name: 'Thạch Tinh Quái',            hp: 800,   atk: 30,   def: 10  } },
    'dung_thuy_tinh_dong':  { name: 'Thủy Tinh Động',     requiredRealmIndex: 1, spiritStonesPerHour: 1500,  floors: 7,  danger: 30, bossData: { name: 'Thủy Long Vương',            hp: 3000,  atk: 100,  def: 50  } },
    'dung_van_co_cam_dia':  { name: 'Vạn Cổ Cấm Địa',    requiredRealmIndex: 2, spiritStonesPerHour: 5000,  floors: 10, danger: 95, bossData: { name: 'Vạn Cổ Ma Thần',            hp: 12000, atk: 400,  def: 200 } },
    'dung_thien_cung_di_tich': { name: 'Thiên Cung Di Tích', requiredRealmIndex: 3, spiritStonesPerHour: 20000, floors: 10, danger: 99, bossData: { name: 'Thiên Cung Thủ Hộ Thần', hp: 50000, atk: 1500, def: 800 } },
  };

  const DANGER_COLOR = (d: number) => d >= 90 ? 'text-red-400' : d >= 50 ? 'text-yellow-400' : 'text-green-400';

  const renderDungeons = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Map size={14} className="text-blue-400" />
          Thiết lập thuộc tính bí cảnh — chỉnh boss, linh thạch/h, yêu cầu cảnh giới. Override sẽ ghi đè mặc định.
        </div>
        <button onClick={loadDungeonsConfig} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"><RefreshCw size={14} /></button>
      </div>

      <div className="grid gap-3">
        {Object.entries(DUNGEONS_DEFAULT).map(([dungeonId, def]) => {
          const override = dungeonsOverrides[dungeonId] || {};
          const hasOverride = Object.keys(override).length > 0;
          const curStones = (override.spiritStonesPerHour ?? def.spiritStonesPerHour) as number;
          const curRealm = (override.requiredRealmIndex ?? def.requiredRealmIndex) as number;
          const curDanger = (override.danger ?? def.danger) as number;
          const bossOverride = (override.bossData || {}) as Partial<{ name: string; hp: number; atk: number; def: number }>;
          const curBoss = def.bossData ? { ...def.bossData, ...bossOverride } : null;

          return (
            <div key={dungeonId} className={`bg-[#141518] border rounded-2xl p-5 transition-all ${hasOverride ? 'border-blue-500/30' : 'border-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm">🗺️</div>
                  <div>
                    <div className="text-white font-medium text-sm">{def.name}</div>
                    <div className="text-gray-500 text-xs">{dungeonId}</div>
                  </div>
                  {hasOverride && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold">Override</span>}
                </div>
                <div className="flex gap-2">
                  {hasOverride && (
                    <button onClick={() => confirmAction('Reset Bí Cảnh', `Reset "${def.name}" về mặc định?`, async () => {
                      const res = await resetDungeonConfig(dungeonId);
                      toast(res.data.message, 'success');
                      loadDungeonsConfig();
                    })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                  <button onClick={() => {
                    setEditDungeonModal(dungeonId);
                    setEditDungeonForm({
                      spiritStonesPerHour: curStones,
                      requiredRealmIndex: curRealm,
                      danger: curDanger,
                      bossHp: curBoss?.hp ?? 0,
                      bossAtk: curBoss?.atk ?? 0,
                      bossDef: curBoss?.def ?? 0,
                      bossName: curBoss?.name ?? '',
                    });
                  }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs transition-all">
                    <Edit3 size={11} /> Chỉnh Sửa
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Linh Thạch/h</div>
                  <div className={`font-bold ${hasOverride && override.spiritStonesPerHour !== undefined ? 'text-blue-400' : 'text-white'}`}>{curStones.toLocaleString()} 💎</div>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Cảnh Giới Yêu Cầu</div>
                  <div className={`font-bold ${hasOverride && override.requiredRealmIndex !== undefined ? 'text-blue-400' : 'text-white'}`}>{REALM_LABELS[curRealm]}</div>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Độ Nguy Hiểm</div>
                  <div className={`font-bold ${DANGER_COLOR(curDanger)}`}>{curDanger}%</div>
                </div>
                {curBoss && (
                  <div className="bg-white/3 rounded-xl px-3 py-2">
                    <div className="text-gray-500 mb-0.5">Boss HP</div>
                    <div className={`font-bold ${hasOverride && bossOverride.hp !== undefined ? 'text-blue-400' : 'text-white'}`}>{curBoss.hp.toLocaleString()}</div>
                  </div>
                )}
              </div>
              {curBoss && (
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Swords size={11} />Boss: <span className="text-white ml-1">{curBoss.name}</span></span>
                  <span>ATK: <span className={hasOverride && bossOverride.atk !== undefined ? 'text-blue-400 font-bold' : 'text-white font-bold'}>{curBoss.atk}</span></span>
                  <span>DEF: <span className={hasOverride && bossOverride.def !== undefined ? 'text-blue-400 font-bold' : 'text-white font-bold'}>{curBoss.def}</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Dungeon Modal */}
      {editDungeonModal && (() => {
        const def = DUNGEONS_DEFAULT[editDungeonModal];
        if (!def) return null;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1a1b1e] border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-base">🗺️</div>
                <div>
                  <h3 className="text-white font-bold text-lg">Thiết Lập Bí Cảnh</h3>
                  <div className="text-gray-500 text-xs">{def.name}</div>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Linh Thạch/Giờ</label>
                    <input type="number" min={0} value={editDungeonForm.spiritStonesPerHour as number}
                      onChange={e => setEditDungeonForm(f => ({ ...f, spiritStonesPerHour: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Yêu Cầu Cảnh Giới</label>
                    <select value={editDungeonForm.requiredRealmIndex as number}
                      onChange={e => setEditDungeonForm(f => ({ ...f, requiredRealmIndex: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50">
                      {REALM_LABELS.map((r, i) => <option key={i} value={i}>{i} — {r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Độ Nguy Hiểm (0–100)</label>
                  <input type="number" min={0} max={100} value={editDungeonForm.danger as number}
                    onChange={e => setEditDungeonForm(f => ({ ...f, danger: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50" />
                </div>
                {def.bossData && (
                  <>
                    <div className="border-t border-white/5 pt-4">
                      <div className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Swords size={14} className="text-red-400" /> Thuộc Tính Boss</div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Tên Boss</label>
                        <input type="text" value={editDungeonForm.bossName as string}
                          onChange={e => setEditDungeonForm(f => ({ ...f, bossName: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50 mb-3" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'HP', key: 'bossHp' },
                          { label: 'ATK', key: 'bossAtk' },
                          { label: 'DEF', key: 'bossDef' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                            <input type="number" min={0} value={editDungeonForm[f.key] as number}
                              onChange={e => setEditDungeonForm(frm => ({ ...frm, [f.key]: Number(e.target.value) }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setEditDungeonModal(null)} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm">Hủy</button>
                <button onClick={async () => {
                  setLoading(true);
                  try {
                    const updates: Record<string, unknown> = {
                      spiritStonesPerHour: editDungeonForm.spiritStonesPerHour,
                      requiredRealmIndex: editDungeonForm.requiredRealmIndex,
                      danger: editDungeonForm.danger,
                    };
                    if (def.bossData) {
                      updates.bossData = {
                        ...def.bossData,
                        name: editDungeonForm.bossName,
                        hp: editDungeonForm.bossHp,
                        atk: editDungeonForm.bossAtk,
                        def: editDungeonForm.bossDef,
                      };
                    }
                    const res = await updateDungeonsConfig(editDungeonModal, updates);
                    toast(res.data.message, 'success');
                    setEditDungeonModal(null);
                    loadDungeonsConfig();
                  } catch { toast('Lỗi cập nhật', 'error'); } finally { setLoading(false); }
                }} className="px-5 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-all">
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
    recipes: renderRecipes(),
    dungeons: renderDungeons(),
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
    recipes: 'Quản Lý Đan Phương', dungeons: 'Thiết Lập Bí Cảnh',
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
