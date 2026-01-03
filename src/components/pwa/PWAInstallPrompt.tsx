/**
 * PWA Install Prompt Component
 * 
 * Displays an install banner/modal when the PWA is installable
 * and provides instructions for manual installation on iOS devices.
 */

import { useState, useEffect } from 'react';
import { X, Smartphone, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
  onInstall?: () => void;
}

export function PWAInstallPrompt({ onDismiss, onInstall }: PWAInstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect device type for specific instructions
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent) && !/windows/.test(userAgent));
  }, []);

  useEffect(() => {
    // Show prompt after a delay to not interrupt initial experience
    const timer = setTimeout(() => {
      // Check if user has already dismissed the prompt
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const installed = localStorage.getItem('pwa-installed');
      
      if (!dismissed && !installed) {
        setIsVisible(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  const handleInstallClick = () => {
    setShowManualGuide(true);
  };

  const handleManualInstall = () => {
    onInstall?.();
  };

  const handleIOSInstall = () => {
    // Store that user has seen the guide
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:top-0 md:bottom-auto">
      {!showManualGuide ? (
        // Install Banner
        <div className="mx-auto max-w-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
          <div className="flex items-start gap-4 p-4">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                Install Flour Power Hub
              </h3>
              <p className="text-sm opacity-90 mb-3">
                Get the app for a better experience with offline access and quick access from your home screen.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstallClick}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  How to Install
                </Button>
                <Button
                  size="sm"
                  onClick={handleManualInstall}
                  className="gap-1 bg-white text-primary hover:bg-white/90"
                >
                  Install Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        // Manual Installation Guide
        <div className="mx-auto max-w-lg bg-card text-card-foreground rounded-xl shadow-lg border animate-fade-in-up">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Install App</h3>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {isIOS ? (
              // iOS Installation Guide
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install Flour Power Hub on your iPhone or iPad:
                </p>
                
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Tap the <strong>Share</strong> button <span className="inline-block transform rotate-90">↑</span> in the Safari browser</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Tap <strong>"Add"</strong> in the top right corner</span>
                  </li>
                </ol>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> The app will appear on your home screen and work like a native app with offline support.
                  </p>
                </div>
              </div>
            ) : isAndroid ? (
              // Android Installation Guide
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install Flour Power Hub on your Android device:
                </p>
                
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Tap the <strong>menu</strong> (three dots) in Chrome</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Tap <strong>"Install"</strong> to confirm</span>
                  </li>
                </ol>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> If you don't see the install option, try tapping the address bar - the install banner should appear.
                  </p>
                </div>
              </div>
            ) : (
              // Desktop Installation Guide
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install Flour Power Hub on your computer:
                </p>
                
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Look for the install icon <span className="inline-block">⬇</span> in your browser's address bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Click the icon and select <strong>"Install"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Follow the installation prompts</span>
                  </li>
                </ol>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> On Chrome, you can also find this in the menu → "Install Flour Power Hub"
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualGuide(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleIOSInstall}
                className="flex-1"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWAInstallPrompt;

