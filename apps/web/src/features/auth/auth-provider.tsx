import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
  type LoginResponse,
  setTokens,
  clearTokens,
  getRefreshToken,
} from '@/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'sge_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [isInitializing] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    const res: LoginResponse = await apiLogin(email, password);
    setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await apiLogout(refresh);
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitializing,
      signIn,
      signOut,
    }),
    [user, isInitializing, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
