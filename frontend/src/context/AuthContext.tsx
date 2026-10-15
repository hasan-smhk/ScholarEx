import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { register, login, loginAdmin } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
  hasUsedFreeSession?: boolean;
  marksPercentage?: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  registerUser: (name: string, email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string, expectedRole?: 'STUDENT' | 'COUNSELOR') => Promise<User>;
  adminLoginUser: (email: string, password: string) => Promise<void>;
  markFreeSessionUsed: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);


  const registerUser = async (name: string, email: string, password: string) => {
    const { data } = await register(name, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const loginUser = async (
    email: string,
    password: string,
    expectedRole?: 'STUDENT' | 'COUNSELOR'
  ) => {
    const { data } = await login(email, password);
    if (expectedRole && data.user.role !== expectedRole) {
      throw new Error(
        expectedRole === 'COUNSELOR'
          ? 'This is not a counselor account. Please use student sign in.'
          : 'This is not a student account. Please use counselor sign in.'
      );
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user as User;
  };

  const adminLoginUser = async (email: string, password: string) => {
    const { data } = await loginAdmin(email, password);
    if (data.user.role !== 'ADMIN') {
      throw new Error('Administrator access is required');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const markFreeSessionUsed = () => {
    if (!user) return;
    const updatedUser = { ...user, hasUsedFreeSession: true };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        registerUser,
        loginUser,
        adminLoginUser,
        markFreeSessionUsed,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
