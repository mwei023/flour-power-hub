/**
 * PWA Update Notification Component
 * 
 * Notifies users when a new version of the app is available
 * and provides options to update or dismiss.
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAUpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function PWAUpdateNotification({ onUpdate, onDismiss }: PWAUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Show notification when update is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000); // Show after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    onUpdate?.();
    
    // The actual update is handled by the service worker
    // This is just for visual feedback
    setTimeout(() => {
      setIsUpdating(false);
      setIsVisible(false);
    }, 2000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card text-card-foreground rounded-xl shadow-lg border animate-fade-in">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary animate-spin-slow" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Update Available
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              A new version of Flour Power Hub is ready. Update now for the latest features and improvements.
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 gap-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isUpdating}
              >
                Later
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
            className="p-1 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAUpdateNotification;

