/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, Component, ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase, checkSupabaseConnection, isValidAuthUser, sanitizeStoredAuthSessions } from './lib/supabase';
import { ContentProtection } from './components/ContentProtection';
import LoadingScreen from './components/LoadingScreen';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import Packages from './pages/Packages';
import PackageDetails from './pages/PackageDetails';
import PublicCourses from './pages/PublicCourses';
import CourseDetails from './pages/CourseDetails';
import Ebooks from './pages/Ebooks';
import EbookDetails from './pages/EbookDetails';
import { preloadCatalogData } from './lib/packageUtils';
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const UserUploads = lazy(() => import('./pages/dashboard/UserUploads'));
const ManageUserFiles = lazy(() => import('./pages/admin/ManageUserFiles'));
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'));
const NotFound = lazy(() => import('./pages/NotFound'));

import ScrollToTop from './components/ScrollToTop';
import BrutalistButton from './components/BrutalistButton';

import { isConfigured, CONFIG } from './lib/config';
import { SettingsProvider } from './contexts/SettingsContext';

// Auth Context
interface AuthContextType {
  user: any | null;
  role: 'user' | 'admin' | 'owner' | 'support' | null;
  loading: boolean;
  isConnected: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  role: null, 
  loading: true, 
  isConnected: true,
  error: null
});
export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = new Set([
  String(CONFIG.ADMIN_EMAIL || '').trim().toLowerCase(),
  'sahilbaislaa@gmail.com',
  'sahilaureon@gmail.com',
  'helplinesmartworth@gmail.com',
  'theotpworth@gmail.com'
]);

const isInstantAdminUser = (u: any): boolean => {
  if (!isValidAuthUser(u)) return false;
  const cleanEmail = String(u.email || '').trim().toLowerCase();
  if (cleanEmail && ADMIN_EMAILS.has(cleanEmail)) return true;
  if (u.role === 'admin' || u.role === 'owner' || u.user_metadata?.role === 'admin') return true;
  return false;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | 'owner' | 'support' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    sanitizeStoredAuthSessions();

    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3500);

    const loadFallbackUser = () => {
      sanitizeStoredAuthSessions();
      try {
        const saved = localStorage.getItem('tsw_fallback_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (isValidAuthUser(parsed?.user)) return parsed.user;
        }
      } catch {}

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              const session = parsed?.currentSession || parsed?.session || parsed;
              if (isValidAuthUser(session?.user)) return session.user;
            }
          }
        }
      } catch {}

      return null;
    };

    const resolveUserRole = async (targetUser: any): Promise<'user' | 'admin' | 'owner' | 'support'> => {
      if (!isValidAuthUser(targetUser)) return 'user';
      if (isInstantAdminUser(targetUser)) return 'admin';
      try {
        const { fetchApi } = await import('./lib/api');
        const res = await fetchApi(`/profile/${targetUser.id}`);
        if (res.ok) {
          const profile = await res.json();
          if (profile?.role) {
            return profile.role as 'user' | 'admin' | 'owner' | 'support';
          }
        }
      } catch {}
      return (targetUser.role as any) || 'user';
    };

    const initAuth = async () => {
      try {
        let resolvedUser = loadFallbackUser();

        if (!resolvedUser && supabase && supabase.auth) {
          const { data } = await supabase.auth.getUser();
          if (isValidAuthUser(data?.user)) {
            resolvedUser = data.user;
          }
        }

        if (isValidAuthUser(resolvedUser)) {
          const initialRole = isInstantAdminUser(resolvedUser)
            ? 'admin'
            : await resolveUserRole(resolvedUser);
          if (isMounted) {
            setUser(resolvedUser);
            setRole(initialRole);
            setIsConnected(true);
            setError(null);
          }
        } else if (isMounted) {
          setUser(null);
          setRole(null);
        }
      } catch {
        const fb = loadFallbackUser();
        if (isMounted) {
          setUser(isValidAuthUser(fb) ? fb : null);
          setRole(isValidAuthUser(fb) ? (isInstantAdminUser(fb) ? 'admin' : 'user') : null);
          setIsConnected(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const handleFallbackAuthChange = async () => {
      if (!isMounted) return;
      const fbUser = loadFallbackUser();
      if (!isValidAuthUser(fbUser)) {
        setUser(null);
        setRole(null);
      } else {
        setUser(fbUser);
        const nextRole = await resolveUserRole(fbUser);
        if (isMounted) setRole(nextRole);
      }
    };
    window.addEventListener('tsw-auth-change', handleFallbackAuthChange);

    let subscription: any = null;
    try {
      if (supabase && supabase.auth) {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (event === 'SIGNED_OUT') {
            const fbUser = loadFallbackUser();
            if (!isValidAuthUser(fbUser)) {
              setUser(null);
              setRole(null);
            }
          } else if (isValidAuthUser(session?.user)) {
            setUser(session.user);
            if (isInstantAdminUser(session.user)) {
              setRole('admin');
            } else {
              const nextRole = await resolveUserRole(session.user);
              if (isMounted) setRole(nextRole);
            }
            setIsConnected(true);
          }
        });
        subscription = data.subscription;
      }
    } catch (e) {
      console.warn('[Auth] Failed to setup auth listener:', e);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      window.removeEventListener('tsw-auth-change', handleFallbackAuthChange);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    let isMounted = true;

    const fetchRole = async () => {
      if (isInstantAdminUser(user)) {
        if (isMounted) setRole('admin');
        return;
      }
      try {
        const { fetchApi } = await import('./lib/api');
        const res = await fetchApi(`/profile/${user.id}`);
        if (res.ok) {
          const profile = await res.json();
          if (isMounted && profile?.role) {
            setRole(profile.role as 'user' | 'admin' | 'owner' | 'support');
            return;
          }
        }
        if (isMounted) setRole((prev) => prev || (user.role as any) || 'user');
      } catch {
        if (isMounted) setRole((prev) => prev || (user.role as any) || 'user');
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, role, loading, isConnected, error }}>{children}</AuthContext.Provider>;
};

import { AlertCircle, Shield } from 'lucide-react';

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    // Show shell for dashboard routes during initial load
    if (location.pathname.startsWith('/admin')) {
      return (
        <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none translate-x-0">
            <div className="h-full flex flex-col">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#615DFA] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <span className="ml-3 font-bold text-xl text-slate-900">AdminPanel</span>
                </div>
              </div>
              <nav className="flex-1 py-6 px-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </nav>
            </div>
          </aside>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
              <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <LoadingScreen fullScreen={false} />
            </main>
          </div>
        </div>
      );
    }

    if (location.pathname.startsWith('/dashboard')) {
      return (
        <div className="min-h-screen bg-main flex overflow-x-hidden">
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out translate-x-0">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b-2 border-gray-100 bg-white">
                <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
              </div>
              <nav className="flex-1 py-6 px-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </nav>
            </div>
          </aside>
          <div className="flex-1 lg:ml-72">
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8">
              <div className="h-10 w-64 bg-slate-50 rounded-xl animate-pulse" />
              <div className="h-10 w-10 bg-slate-50 rounded-xl animate-pulse" />
            </header>
            <main className="p-4 md:p-8">
              <LoadingScreen fullScreen={false} />
            </main>
          </div>
        </div>
      );
    }

    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    const activeTimers = new WeakMap<HTMLButtonElement, number>();

    const handleGlobalButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button') as HTMLButtonElement | null;
      if (!btn || btn.disabled || btn.hasAttribute('data-brutalist-btn')) return;

      if (!btn.textContent?.trim() && !btn.querySelector('svg')) {
        btn.setAttribute('data-empty-btn', 'true');
      } else {
        btn.removeAttribute('data-empty-btn');
      }

      btn.setAttribute('data-clicking', 'true');

      const prevTimer = activeTimers.get(btn);
      if (prevTimer) window.clearTimeout(prevTimer);

      const checkAndClear = () => {
        if (!btn.isConnected) return;
        if (btn.disabled) {
          const nextTimer = window.setTimeout(checkAndClear, 200);
          activeTimers.set(btn, nextTimer);
        } else {
          btn.removeAttribute('data-clicking');
          activeTimers.delete(btn);
        }
      };

      const timer = window.setTimeout(checkAndClear, 450);
      activeTimers.set(btn, timer);
    };

    document.addEventListener('click', handleGlobalButtonClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalButtonClick, true);
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <ContentProtection>
                <Router>
                  <ScrollToTop />
                  <div className="min-h-screen bg-transparent relative">
                    <Suspense fallback={<LoadingScreen />}>
                      <AppRoutes />
                    </Suspense>
                  </div>
                </Router>
              </ContentProtection>
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

const AppRoutes = () => {
  const { user } = useAuth();

  useEffect(() => {
    void preloadCatalogData();
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        (typeof window !== 'undefined' && window.location.hostname.toLowerCase().startsWith('verify.'))
          ? <CertificateVerify />
          : (user ? <Navigate to="/dashboard" replace /> : <Home />)
      } />
      <Route path="/about" element={<About />} />
      <Route path="/courses" element={<PublicCourses />} />
      <Route path="/courses/:courseId" element={<CourseDetails />} />
      <Route path="/course/:courseId" element={<CourseDetails />} />
      <Route path="/ebooks" element={<Ebooks />} />
      <Route path="/ebooks/:ebookId" element={<EbookDetails />} />
      <Route path="/ebook/:ebookId" element={<EbookDetails />} />
      <Route path="/packages" element={<Packages />} />
      <Route path="/packages/:packageId" element={<PackageDetails />} />
      <Route path="/package/:packageId" element={<PackageDetails />} />
      <Route path="/creator-worth" element={<PackageDetails />} />
      <Route path="/business-worth" element={<PackageDetails />} />
      <Route path="/tech-worth" element={<PackageDetails />} />
      <Route path="/next-worth" element={<PackageDetails />} />
      <Route path="/finance-worth" element={<PackageDetails />} />
      <Route path="/success-worth" element={<PackageDetails />} />
      <Route path="/pro-worth" element={<PackageDetails />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<PaymentGateway />} />
      <Route path="/payment-gateway" element={<PaymentGateway />} />
      <Route path="/checkout" element={<PaymentGateway />} />
      <Route path="/checkout-pay" element={<PaymentGateway />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/certificate/:certId" element={<CertificateVerify />} />
      <Route path="/certificate" element={<CertificateVerify />} />
      <Route path="/verify/:certId" element={<CertificateVerify />} />
      <Route path="/verify" element={<CertificateVerify />} />
      <Route path="/verify-certificate/:certId" element={<CertificateVerify />} />
      <Route path="/404" element={<NotFound />} />

      {/* Protected Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Routes>
            <Route path="uploads" element={<UserUploads />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute adminOnly>
          <Routes>
            <Route path="user-files" element={<ManageUserFiles />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Dynamic Root-Level Package SEO Slug Route (e.g. /creator-worth/ or any custom package slug) */}
      <Route path="/:packageId" element={<PackageDetails />} />

      {/* 404 Not Found Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
