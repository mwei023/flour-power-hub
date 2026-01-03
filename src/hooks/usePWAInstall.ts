/**
 * PWA Install Hook
 * 
 * This hook manages PWA installation state and provides methods
 * to trigger installation prompts and check installation status.
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  needsRefresh: boolean;
  updateReady: boolean;
}

interface PWAInstallActions {
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  updateApp: () => void;
}

export function usePWAInstall(): [PWAInstallState, PWAInstallActions] {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as { standalone?: boolean }).standalone === true ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle PWA update via service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedsRefresh(true);
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SKIP_WAITING') {
          setUpdateReady(true);
        }
      });
    }
  }, []);

  // Check if update is available
  useEffect(() => {
    const checkForUpdate = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setUpdateReady(true);
        }
      }
    };

    const interval = setInterval(checkForUpdate, 30000); // Check every 30 seconds
    checkForUpdate();

    return () => clearInterval(interval);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false;
    }

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await installPrompt.userChoice;

    // Reset the prompt variable
    setInstallPrompt(null);

    // Track the outcome
    if (outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [installPrompt]);

  const dismissPrompt = useCallback(() => {
    setInstallPrompt(null);
  }, []);

  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }, []);

  return [
    {
      isInstallable: !!installPrompt && !isInstalled,
      isInstalled,
      isUpdateAvailable: updateReady,
      needsRefresh,
      updateReady,
    },
    {
      promptInstall,
      dismissPrompt,
      updateApp,
    },
  ];
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mql = window.matchMedia('(max-width: 768px)');
      setIsMobile(mql.matches);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default usePWAInstall;

