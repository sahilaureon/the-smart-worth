import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  MessageSquare,
  FileCheck,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

// Admin Sub-pages
import AdminOverview from './admin/AdminOverview';
import UserManagement from './admin/UserManagement';
import TransactionManagement from './admin/TransactionManagement';
import PackageManagement from './admin/PackageManagement';
import ProfileRequests from './admin/ProfileRequests';
import CourseManagement from './admin/CourseManagement';
import EbookManagement from './admin/EbookManagement';
import WithdrawalManagement from './admin/WithdrawalManagement';
import SupportManagement from './admin/SupportManagement';
import KYCManagement from './admin/KYCManagement';
import CertificateManagement from './admin/CertificateManagement';
import UnknownUsersManagement from './admin/UnknownUsersManagement';
import PaymentHelperManagement from './admin/PaymentHelperManagement';
import ReferredCodeTracker from './admin/ReferredCodeTracker';
import { LifeBuoy, Share2 } from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Users, label: 'Unknown Users', path: '/admin/unknown-users' },
  { icon: LifeBuoy, label: 'Payment Helper', path: '/admin/payment-helper' },
  { icon: Bell, label: 'Profile Requests', path: '/admin/profile-requests' },
  { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
  { icon: CreditCard, label: 'Withdrawals', path: '/admin/withdrawals' },
  { icon: Share2, label: 'Referred Code Tracker', path: '/admin/referral-tracker' },
  { icon: Package, label: 'Packages', path: '/admin/packages' },
  { icon: LayoutDashboard, label: 'Courses', path: '/admin/courses' },
  { icon: BookOpen, label: 'E-Books', path: '/admin/ebooks' },
  { icon: FileCheck, label: 'Certificates', path: '/admin/certificates' },
  { icon: MessageSquare, label: 'Support', path: '/admin/support' },
  { icon: FileCheck, label: 'KYC Records', path: '/admin/kyc' },
  { icon: LayoutDashboard, label: 'User Dashboard', path: '/dashboard' },
];

import LoadingScreen from '../components/LoadingScreen';

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isReloading, setIsReloading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleFastReload = () => {
    setIsReloading(true);
    window.dispatchEvent(new CustomEvent('admin-fast-reload'));
    setTimeout(() => setIsReloading(false), 600);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const getPageTitle = (path: string) => {
    const normalized = path.replace(/\/+$/, '') || '/admin';
    switch (normalized) {
      case '/admin': return 'Overview';
      case '/admin/users': return 'Users';
      case '/admin/unknown-users': return 'Unknown Users';
      case '/admin/payment-helper': return 'Payment Helper';
      case '/admin/transactions': return 'Transactions';
      case '/admin/withdrawals': return 'Withdrawals';
      case '/admin/referral-tracker': return 'Referred Code Tracker';
      case '/admin/packages': return 'Packages';
      case '/admin/courses': return 'Courses';
      case '/admin/ebooks': return 'E-Books';
      case '/admin/profile-requests': return 'Profile Requests';
      case '/admin/support': return 'Support';
      case '/admin/certificates': return 'Certificates';
      case '/admin/kyc': return 'KYC Records';
      default: return 'Admin Panel';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
        <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none -translate-x-full lg:translate-x-0">
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-72">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-8 sticky top-0 z-40">
            <div className="flex items-center min-w-0">
              <div className="p-2 rounded-lg text-slate-600 lg:hidden">
                <Menu className="w-6 h-6" />
              </div>
              <div className="flex flex-col justify-center ml-2 sm:ml-3 min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#615DFA] leading-none mb-0.5">
                  Admin Panel
                </span>
                <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
                  {getPageTitle(location.pathname)}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-16 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-9 w-9 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <LoadingScreen fullScreen={false} />
          </main>
        </div>
      </div>
    );
  }

  const isAdminUser =
    role === 'admin' ||
    role === 'owner' ||
    user?.role === 'admin' ||
    user?.email === 'sahilbaislaa@gmail.com' ||
    user?.email === 'sahilaureon@gmail.com' ||
    user?.email === 'helplinesmartworth@gmail.com';

  if (!isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('tsw_fallback_session');
      await supabase.auth.signOut().catch(() => {});
      window.dispatchEvent(new Event('tsw-auth-change'));
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-slate-200 flex flex-col shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
            <Link to="/admin" className="flex flex-col">
              <span className="text-xl font-display font-black tracking-tighter leading-none">
                <span className="text-slate-900">Admin</span>
                <span className="text-indigo-600 ml-1">Panel</span>
              </span>
              <div className="h-[2px] w-full bg-indigo-600 mt-0.5 rounded-full" />
            </Link>
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="py-2 px-3 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors border",
                      isActive 
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs" 
                        : "text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200 bg-slate-50 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold transition-colors text-sm shadow-2xs cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              <span>User Dashboard</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 font-semibold transition-colors text-sm shadow-2xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:ml-72" : "ml-0"
      )}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-8 sticky top-0 z-40 gap-2">
          <div className="flex items-center min-w-0 flex-1">
            {!isSidebarOpen && (
              <button 
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shrink-0 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col justify-center ml-2 sm:ml-3 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#615DFA] leading-none mb-0.5">
                Admin Panel
              </span>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('adminGlobalUserSearch') as HTMLInputElement | null;
                const q = input?.value?.trim() || '';
                navigate(q ? `/admin/users?search=${encodeURIComponent(q)}` : '/admin/users');
              }}
              className="hidden md:flex items-center bg-slate-50 focus-within:bg-white border border-slate-300 focus-within:border-indigo-600 rounded-md px-3 py-1.5 ml-6 w-64 xl:w-96 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                name="adminGlobalUserSearch"
                placeholder="Search users by name or email..."
                className="bg-transparent border-none outline-none focus:ring-0 text-sm ml-2 w-full text-slate-800 placeholder:text-slate-400"
              />
            </form>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              type="button"
              onClick={handleFastReload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Reload Page Data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", isReloading && "animate-spin")} />
              <span>Reload</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/profile-requests')}
              className="p-2 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 relative transition-colors shadow-2xs cursor-pointer"
              title="View Profile Requests & Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center space-x-3 pl-2 sm:pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#615DFA]/10 flex items-center justify-center text-[#615DFA] font-bold text-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/unknown-users" element={<UnknownUsersManagement />} />
                <Route path="/payment-helper" element={<PaymentHelperManagement />} />
                <Route path="/transactions" element={<TransactionManagement />} />
                <Route path="/withdrawals" element={<WithdrawalManagement />} />
                <Route path="/referral-tracker" element={<ReferredCodeTracker />} />
                <Route path="/packages" element={<PackageManagement />} />
                <Route path="/courses" element={<CourseManagement />} />
                <Route path="/ebooks" element={<EbookManagement />} />
                <Route path="/certificates" element={<CertificateManagement />} />
                <Route path="/support" element={<SupportManagement />} />
                <Route path="/kyc" element={<KYCManagement />} />
                <Route path="/profile-requests" element={<ProfileRequests />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
