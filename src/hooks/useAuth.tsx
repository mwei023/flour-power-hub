/**
 * Authentication Hook
 *
 * Provides authentication state and helpers for checking if user is logged in.
 * Uses React Context to share state across all components.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Shared context — single source of truth for all components
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setAuthState({ isAuthenticated: true, isLoading: false, user });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setAuthState({ isAuthenticated: false, isLoading: false, user: null });
      }
    } else {
      setAuthState({ isAuthenticated: false, isLoading: false, user: null });
    }
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ isAuthenticated: true, isLoading: false, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setAuthState({ isAuthenticated: false, isLoading: false, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/**
 * Hook to track onboarding completion
 */
export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('onboarding-completed');
      const authToken = localStorage.getItem('auth_token');
      if (authToken && !completed) {
        setIsCompleted(false);
        setShowOnboarding(true);
      } else {
        setIsCompleted(true);
        setShowOnboarding(false);
      }
      setIsLoading(false);
    };
    const timer = setTimeout(checkOnboarding, 100);
    return () => clearTimeout(timer);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true');
    setIsCompleted(true);
    setShowOnboarding(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true');
    setIsCompleted(true);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboarding-completed');
    setIsCompleted(false);
    setShowOnboarding(true);
  }, []);

  return {
    isCompleted,
    showOnboarding,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}

export default useAuth;