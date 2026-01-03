/**
 * Authentication Hook
 *
 * Provides authentication state and helpers for checking if user is logged in.
 */

import { useState, useEffect, useCallback } from 'react';

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

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
          });
        } catch {
          // Invalid user data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    };

    // Small delay to ensure hydration
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
}

/**
 * Hook to track onboarding completion
 */
export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(true); // Default to true to avoid flash
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('onboarding-completed');
      const authToken = localStorage.getItem('auth_token');

      // Only show onboarding if user is logged in and hasn't completed it
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
