import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, logoutApi, UserData } from '../services/authService';

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserData, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: UserData) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) { setIsLoading(false); return; }
      try {
        const res = await getMe();
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = (newToken: string, newUser: UserData, newRefreshToken?: string) => {
    localStorage.setItem('token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      const savedRefreshToken = localStorage.getItem('refreshToken');
      if (savedRefreshToken) {
        await logoutApi(savedRefreshToken);
      }
    } catch {
      // Bỏ qua lỗi khi logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (newUser: UserData) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
};
