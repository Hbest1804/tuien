import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../lib/axios';

interface EconomyContextType {
  spiritStones: number | null;
  pendingStones: number;
  isCollecting: boolean;
  fetchBalance: () => Promise<void>;
  collectStones: () => Promise<string>;
  spendStones: (amount: number) => void;
}

const EconomyContext = createContext<EconomyContextType | null>(null);

export function EconomyProvider({ children }: { children: ReactNode }) {
  const [spiritStones, setSpiritStones] = useState<number | null>(null);
  const [pendingStones, setPendingStones] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.get<{ spiritStones: number; pendingStones: number }>('/economy/balance');
      setSpiritStones(res.data.spiritStones);
      setPendingStones(res.data.pendingStones);
    } catch {
      // User chưa đăng nhập hoặc chưa tạo nhân vật — bỏ qua
    }
  }, []);

  const collectStones = useCallback(async () => {
    setIsCollecting(true);
    try {
      const res = await api.post<{ spiritStones: number; collected: number; message: string }>(
        '/economy/idle-collect'
      );
      setSpiritStones(res.data.spiritStones);
      setPendingStones(0);
      return res.data.message;
    } finally {
      setIsCollecting(false);
    }
  }, []);

  // Cập nhật optimistic sau khi mua (UI không cần refetch)
  const spendStones = useCallback((amount: number) => {
    setSpiritStones(prev => (prev !== null ? Math.max(0, prev - amount) : prev));
  }, []);

  return (
    <EconomyContext.Provider value={{ spiritStones, pendingStones, isCollecting, fetchBalance, collectStones, spendStones }}>
      {children}
    </EconomyContext.Provider>
  );
}

export const useEconomy = () => {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error('useEconomy phải dùng trong EconomyProvider');
  return ctx;
};
