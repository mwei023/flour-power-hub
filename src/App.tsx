import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NewTransaction from "./pages/NewTransaction";
import Customers from "./pages/Customers";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import History from "./pages/History";
import Tenders from "./pages/Tenders";
import MpesaPayments from "./pages/MpesaPayments";
import Login from "./pages/Login";
import { PWAInstallPrompt, PWAUpdateNotification, OnboardingGuide } from "./components/pwa";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { AuthProvider, useAuth, useOnboarding } from "./hooks/useAuth";

const queryClient = new QueryClient();

// Protected Route wrapper - only accessible when logged in
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Login Route - redirects to home if already logged in
function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
}

// PWA Features wrapper - only shows when authenticated
function PWAFeatures() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const [isLoaded, setIsLoaded] = useState(false);
  const [{ isInstallable, isUpdateAvailable, isInstalled }, { promptInstall, updateApp }] = usePWAInstall();

  useEffect(() => {
    if (!authLoading && !onboardingLoading) {
      setIsLoaded(true);
    }
  }, [authLoading, onboardingLoading]);

  if (!isLoaded || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {isInstallable && !isInstalled && (
        <PWAInstallPrompt 
          onInstall={async () => {
            const accepted = await promptInstall();
            if (accepted) {
              localStorage.setItem('pwa-installed', 'true');
            }
          }}
          onDismiss={() => {
            localStorage.setItem('pwa-install-dismissed', 'true');
            const timeout = setTimeout(() => {
              localStorage.removeItem('pwa-install-dismissed');
            }, 24 * 60 * 60 * 1000);
            return () => clearTimeout(timeout);
          }}
        />
      )}
      {isUpdateAvailable && (
        <PWAUpdateNotification 
          onUpdate={updateApp}
          onDismiss={() => {
            localStorage.setItem('pwa-update-dismissed', 'true');
          }}
        />
      )}
      {showOnboarding && (
        <OnboardingGuide 
          onComplete={() => {
            localStorage.setItem('onboarding-completed', 'true');
          }}
        />
      )}
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* AuthProvider wraps everything so all components share one auth state */}
          <AuthProvider>
            <PWAFeatures />
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/new-transaction" element={
                <ProtectedRoute>
                  <NewTransaction />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/tenders" element={
                <ProtectedRoute>
                  <Tenders />
                </ProtectedRoute>
              } />
              <Route path="/mpesa" element={
                <ProtectedRoute>
                  <MpesaPayments />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;