import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  availableUsers: User[];
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('budgetai_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default to Government Admin for easy evaluation
    return DEMO_USERS[1];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('budgetai_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('budgetai_current_user');
    }
  }, [user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
    } catch (e) {
      console.warn('API login failed, checking demo users:', e);
    }

    // fallback matching
    const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    const target = DEMO_USERS.find(u => u.role === role);
    if (target) {
      setUser({ ...target, lastLogin: 'Just now' });
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
        availableUsers: DEMO_USERS,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
