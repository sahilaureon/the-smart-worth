import React, { useState, useEffect, useRef } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Package,
  BookOpen,
  Award,
  Wallet,
  LogOut,
  Search,
  Menu,
  X,
  MessageSquare,
  RefreshCw,
  Edit3,
  Camera,
  Phone,
  Mail,
  FileText,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Ban,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Dashboard Sub-pages
import Overview from './dashboard/Overview';
import MyPackages from './dashboard/MyPackages';
import Courses from './dashboard/Courses';
import CoursePlayer from './dashboard/CoursePlayer';
import Earning from './dashboard/Earning';
import UserSettings from './dashboard/Settings';
import Certificate from './dashboard/Certificate';
import Support from './dashboard/Support';
import NotificationsDropdown from '../components/dashboard/NotificationsDropdown';
import ImageCropperModal from '../components/dashboard/ImageCropperModal';

import { useAuth } from '../App';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { optimizeCloudinaryUrl } from '../lib/imageUtils';
import { storageService } from '../services/storageService';
import { CONFIG } from '../lib/config';
import { useSettings } from '../contexts/SettingsContext';

const Dashboard = () => {
  const { user, role } = useAuth();
  const { settings } = useSettings();
  const [userData, setUserData] = useState<any>(null);
  const [packageName, setPackageName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [reloadKey, setReloadKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!userData?.is_banned) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [userData?.is_banned]);

  // Sidebar Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingDp, setUploadingDp] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    full_name: '',
    mobile: '',
    bio: '',
    dob: '',
    gender: '',
    state: '',
    profile_pic: ''
  });

  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (path: string) => {
    const p = path.toLowerCase();
    if (p.includes('/packages')) return 'My Packages';
    if (p.includes('/courses')) return 'My Courses';
    if (p.includes('/certificates')) return 'My Certificates';
    if (p.includes('/earnings')) return 'Earnings & Wallet';
    if (p.includes('/support')) return 'Support Center';
    if (p.includes('/profile')) return 'My Profile';
    if (p.includes('/kyc')) return 'KYC Panel';
    if (p.includes('/settings')) return 'Account Settings';
    if (p.includes('/dashboard')) return 'Dashboard';
    return 'Dashboard';
  };

  const getBreadcrumb = (path: string) => {
    const p = path.toLowerCase();
    if (p.includes('/packages')) return 'PACKAGE';
    if (p.includes('/courses')) return 'COURSE';
    if (p.includes('/certificates')) return 'CERTIFICATE';
    if (p.includes('/earnings')) return 'EARNING';
    if (p.includes('/support')) return 'SUPPORT';
    if (p.includes('/profile')) return 'PROFILE';
    if (p.includes('/kyc')) return 'KYC';
    if (p.includes('/settings')) return 'SETTING';
    if (p.includes('/dashboard')) return 'DASHBOARD';
    return 'DASHBOARD';
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

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async (retryCount = 0) => {
      let isRetrying = false;
      try {
        if (retryCount === 0 && !userData) setLoading(true);

        const response = await fetchApi(`/profile/${user.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch profile');
        }
        const data = await response.json();

        if (data) {
          setUserData(data);
          setEditForm({
            full_name: data.full_name || user?.user_metadata?.full_name || '',
            mobile: data.mobile || data.phone || '',
            bio: data.bio || '',
            dob: data.dob || '',
            gender: data.gender || '',
            state: data.state || '',
            profile_pic: data.profile_pic || data.avatar_url || ''
          });

          if (data.package_id) {
            const pkgRes = await fetchApi('/packages');
            if (pkgRes.ok) {
              const packagesData = await pkgRes.json();
              const packages = Array.isArray(packagesData)
                ? packagesData
                : packagesData?.packages || packagesData?.data || packagesData?.raw || [];
              const pkg = packages.find((p: any) => p.id === data.package_id);
              setPackageName(pkg?.name || 'Package not found');
            } else {
              setPackageName('Error loading package');
            }
          } else {
            setPackageName('No Package');
          }
        } else {
          setPackageName('New Member');
        }
      } catch (err: any) {
        if (retryCount < 2) {
          isRetrying = true;
          setTimeout(() => fetchUserData(retryCount + 1), 1200 * (retryCount + 1));
          return;
        }
        // Fallback to auth user metadata so dashboard still renders smoothly
        setUserData((prev: any) =>
          prev || {
            id: user.id,
            email: user.email,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
            mobile: user?.user_metadata?.mobile || '',
            profile_pic: user?.user_metadata?.profile_pic || '',
            created_at: user?.created_at || new Date().toISOString()
          }
        );
      } finally {
        if (!isRetrying) setLoading(false);
      }
    };

    fetchUserData();
  }, [user, reloadKey]);

  const handleFastReload = () => {
    setIsReloading(true);
    setReloadKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent('app-fast-reload'));
    setTimeout(() => setIsReloading(false), 600);
  };

  const openEditProfileModal = () => {
    setProfileNotice(null);
    setEditForm({
      full_name: userData?.full_name || user?.user_metadata?.full_name || '',
      mobile: userData?.mobile || userData?.phone || '',
      bio: userData?.bio || '',
      dob: userData?.dob || '',
      gender: userData?.gender || '',
      state: userData?.state || '',
      profile_pic: userData?.profile_pic || userData?.avatar_url || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleDpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!user) return;
    setShowCropper(false);
    setUploadingDp(true);
    setProfileNotice(null);

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      const { compressedBlob, dataUrl } = await new Promise<{ compressedBlob: Blob; dataUrl: string }>((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          const dUrl = canvas.toDataURL('image/jpeg', 0.85);
          canvas.toBlob((b) => resolve({ compressedBlob: b!, dataUrl: dUrl }), 'image/jpeg', 0.85);
        };
      });

      const file = new File([compressedBlob], `avatar-${user.id}.jpg`, { type: 'image/jpeg' });
      let publicUrl = '';
      try {
        publicUrl = await storageService.uploadToCloudinary(file, 'user_dp');
      } catch {
        try {
          publicUrl = await storageService.uploadImage(file, 'avatars', `profiles/${user.id}/${Date.now()}.jpg`);
        } catch {
          publicUrl = dataUrl;
        }
      }

      const finalDpUrl = publicUrl || dataUrl;
      setEditForm((prev) => ({ ...prev, profile_pic: finalDpUrl }));

      const updateRes = await fetchApi('/update-profile', {
        method: 'POST',
        body: JSON.stringify({ profile_pic: finalDpUrl })
      });

      if (updateRes.ok) {
        const updated = await updateRes.json();
        setUserData((prev: any) => ({ ...prev, ...updated, profile_pic: finalDpUrl }));
        setProfileNotice({ type: 'success', text: 'Profile photo (DP) updated!' });
      }
    } catch (error: any) {
      console.error('Error uploading DP:', error);
      setProfileNotice({ type: 'error', text: 'Failed to upload DP. Please try again.' });
    } finally {
      setUploadingDp(false);
      setSelectedImage(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = editForm.full_name.trim();
    if (!trimmedName) {
      setProfileNotice({ type: 'error', text: 'Please enter your Full Name.' });
      return;
    }

    setSavingProfile(true);
    setProfileNotice(null);

    try {
      const payload = {
        full_name: trimmedName,
        mobile: editForm.mobile.trim(),
        bio: editForm.bio.trim(),
        dob: editForm.dob || null,
        gender: editForm.gender || null,
        state: editForm.state.trim() || null,
        profile_pic: editForm.profile_pic || userData?.profile_pic || null
      };

      const res = await fetchApi('/update-profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updated = await res.json();
      setUserData((prev: any) => ({
        ...prev,
        ...updated,
        ...payload
      }));

      setProfileNotice({ type: 'success', text: 'Profile details updated successfully!' });
      setReloadKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent('app-fast-reload'));

      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileNotice(null);
      }, 900);
    } catch (err: any) {
      console.error('Profile save error:', err);
      setProfileNotice({
        type: 'error',
        text: err.message || 'Could not update profile. Please try again.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const vipMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Courses', icon: BookOpen, path: '/dashboard/courses' },
    { name: 'Certificate', icon: Award, path: '/dashboard/certificates' },
    { name: 'Earnings', icon: Wallet, path: '/dashboard/earnings' },
    { name: 'Support', icon: MessageSquare, path: '/dashboard/support' }
  ];

  const isAdmin =
    role === 'admin' ||
    userData?.role === 'admin' ||
    user?.email === CONFIG.ADMIN_EMAIL ||
    user?.email === 'sahilbaislaa@gmail.com' ||
    user?.email === 'sahilaureon@gmail.com' ||
    user?.email === 'helplinesmartworth@gmail.com';

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

  const displayFullName =
    userData?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    userData?.username?.trim() ||
    'Member';

  // If the user's account is banned, block dashboard access and display full ban details
  if (userData?.is_banned) {
    const bd = userData.ban_details || {};
    const isPerm = (bd.ban_type || userData.ban_type) === 'permanent' || !(bd.ban_until || userData.ban_until);
    const bannedAtIso = bd.banned_at || userData.banned_at || userData.updated_at || new Date().toISOString();
    const banUntilIso = bd.ban_until || userData.ban_until || null;
    const banReasonText = bd.ban_reason || userData.ban_reason || 'Violation of platform rules and terms of service';

    const fmtDate = (iso: any) => {
      if (!iso) return 'N/A';
      const d = new Date(iso);
      return isNaN(d.getTime())
        ? 'N/A'
        : d.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
    };
    const fmtTime = (iso: any) => {
      if (!iso) return 'N/A';
      const d = new Date(iso);
      return isNaN(d.getTime())
        ? 'N/A'
        : d.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }) + ' IST';
    };

    let countdownStr: string | null = null;
    if (!isPerm && banUntilIso) {
      const diff = new Date(banUntilIso).getTime() - nowMs;
      if (diff > 0) {
        const totalSec = Math.floor(diff / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        countdownStr =
          days > 0
            ? `${days}d ${hours}h ${minutes}m ${seconds}s`
            : hours > 0
              ? `${hours}h ${minutes}m ${seconds}s`
              : `${minutes}m ${seconds}s`;
      } else {
        countdownStr = 'Ban Expired — Click Refresh below';
      }
    }

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden"
        >
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Ban size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider truncate">
                  Your Account is Banned
                </h1>
                <p className="text-[11px] text-slate-500 truncate">
                  {displayFullName} ({userData.email || user?.email})
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <ShieldAlert size={11} />
              {isPerm ? 'Permanent Ban' : 'Temporary Ban'}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isPerm
                ? 'Your account has been permanently suspended by the administrator due to a violation of our platform rules. You can no longer access your dashboard or courses.'
                : 'Your account has been temporarily suspended by the administrator. Your dashboard access will be restored automatically once the suspension period expires.'}
            </p>

            <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-slate-50/40 text-xs sm:text-sm">
              <div className="px-3.5 py-2.5 flex items-start justify-between gap-3">
                <span className="font-semibold text-slate-500">Reason</span>
                <span className="font-bold text-slate-900 text-right">{banReasonText}</span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-500">Banned Date</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {bd.banned_date_formatted || fmtDate(bannedAtIso)}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-500">Banned Time</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {bd.banned_time_formatted || fmtTime(bannedAtIso)}
                </span>
              </div>

              {!isPerm ? (
                <>
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-500">Unban Date</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {bd.unban_date_formatted || fmtDate(banUntilIso)}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-500">Unban Time</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {bd.unban_time_formatted || fmtTime(banUntilIso)}
                    </span>
                  </div>
                  {countdownStr && (
                    <div className="px-3.5 py-2.5 bg-slate-100/80 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Time Remaining
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs">
                        {countdownStr}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-100/80 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-500">Ban Duration</span>
                  <span className="font-bold text-red-700">
                    Permanent (Until Manually Unbanned)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Check Status</span>
            </button>
            <div className="flex items-center gap-2">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <MessageSquare size={13} />
                <span>Contact Support</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main flex overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] w-72 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-[#E2E8F0] flex flex-col shadow-2xl lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* User Mini Profile Header with Edit Button */}
          <div className="p-5 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar 1:1 with quick edit trigger */}
                <button
                  type="button"
                  onClick={openEditProfileModal}
                  title="Change DP & Edit Profile"
                  className="relative group shrink-0 cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-slate-900 p-0.5 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {userData?.profile_pic ? (
                        <img
                          src={userData.profile_pic}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-lg font-bold text-slate-800">
                          {displayFullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center shadow-xs">
                    <Camera size={10} />
                  </span>
                </button>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 truncate leading-tight">
                    {displayFullName}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 truncate font-mono mt-0.5">
                    ID: {userData?.tsw_id || `TSW${user?.id?.slice(0, 6).toUpperCase()}`}
                  </span>
                  {(userData?.mobile || userData?.phone) && (
                    <span className="text-[11px] text-slate-500 truncate mt-0.5">
                      {userData.mobile || userData.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Classic Edit Button in Sidebar Top Header */}
              <button
                type="button"
                onClick={openEditProfileModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200 hover:border-slate-900 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                title="Edit Profile (DP, Full Name, Number, Bio)"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {userData?.bio && (
              <p className="mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {userData.bio}
              </p>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="pt-2">
              {vipMenuItems.map((item) => {
                const isActive =
                  item.path === '/dashboard'
                    ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                    : location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`) ||
                      (item.path === '/dashboard/courses' &&
                        location.pathname.startsWith('/dashboard/course'));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-6 py-5 transition-all relative overflow-hidden border-b border-gray-100',
                      isActive
                        ? 'bg-indigo-50/50 text-[#615DFA]'
                        : 'text-[#0A0E27] hover:bg-gray-50'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#615DFA] shadow-[0_0_20px_rgba(97,93,250,0.8)]"
                      />
                    )}
                    <span className="text-lg font-bold tracking-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="mt-4">
                <p className="px-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">
                  Administration
                </p>
                <div className="border-t border-gray-100">
                  <Link
                    to="/admin"
                    className={cn(
                      'flex items-center px-6 py-5 transition-all relative overflow-hidden border-b border-gray-100',
                      location.pathname.startsWith('/admin')
                        ? 'bg-indigo-50/50 text-indigo-600'
                        : 'text-[#0A0E27] hover:bg-gray-50'
                    )}
                  >
                    {location.pathname.startsWith('/admin') && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />
                    )}
                    <span className="text-lg font-bold tracking-tight">Admin Panel</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="p-6 mt-auto border-t border-gray-100 bg-white shrink-0">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm text-center transition-colors flex items-center justify-center space-x-2 border border-slate-950 shadow-2xs cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen w-full',
          isSidebarOpen ? 'lg:ml-72' : 'ml-0'
        )}
      >
        {/* Header */}
        <header className="h-20 bg-[#0A0E27] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-lg border-b border-white/10">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <Menu size={20} />
            </button>

            {/* Logo - Matching Homepage Navbar */}
            <Link to="/dashboard" className="flex items-center ml-2">
              <div className="flex flex-col">
                <span className="text-white text-lg md:text-xl font-display font-black tracking-tighter leading-none">
                  <span>{settings.site_title?.split(' ')[0] || 'The'}</span>
                  <span className="ml-1">
                    {settings.site_title?.split(' ').slice(1).join(' ') || 'Smart Worth'}
                  </span>
                </span>
                <div className="h-[2.5px] w-full bg-[#00A3FF] mt-1 rounded-full" />
              </div>
            </Link>

            <div className="hidden md:flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl w-64 ml-6">
              <Search size={18} className="text-white/40 mr-2" />
              <input
                type="text"
                placeholder="Search courses..."
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 md:space-x-5">
            <button
              type="button"
              onClick={handleFastReload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
              title="Fast Reload Page Data"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-[#00A3FF]', isReloading && 'animate-spin')} />
              <span>Reload</span>
            </button>
            <div className="text-white ring-white/10">
              <NotificationsDropdown />
            </div>
            <button
              type="button"
              onClick={openEditProfileModal}
              className="flex items-center space-x-3 pl-3 md:pl-6 border-l border-white/10 text-left cursor-pointer"
              title="Edit Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-white">{displayFullName}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {packageName}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                {userData?.profile_pic ? (
                  <img
                    src={optimizeCloudinaryUrl(userData.profile_pic, 80, 80)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black">
                    {displayFullName
                      .split(' ')
                      .map((n: any) => n[0])
                      .join('')
                      .slice(0, 2) || 'S'}
                  </span>
                )}
              </div>
            </button>
          </div>
        </header>

        <div>
          <PageHeader
            title={getPageTitle(location.pathname)}
            breadcrumb={getBreadcrumb(location.pathname)}
            onReload={handleFastReload}
          />
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8" key={reloadKey}>
          {loading ? (
            <LoadingScreen fullScreen={false} className="min-h-[60vh]" />
          ) : (
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/packages" element={<MyPackages />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CoursePlayer />} />
              <Route path="/certificates" element={<Certificate />} />
              <Route path="/earnings" element={<Earning />} />
              <Route path="/support" element={<Support />} />
              <Route path="/settings" element={<UserSettings />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          )}
        </div>

        <Footer />
      </main>

      {/* Classic Edit Profile Modal (Triggered from Sidebar Top Edit Button) */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Edit Profile Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your DP, Full Name, Mobile Number, and Bio
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto">
                {profileNotice && (
                  <div
                    className={cn(
                      'p-3 rounded-md border flex items-center gap-2.5 text-xs font-semibold',
                      profileNotice.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    )}
                  >
                    {profileNotice.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                    )}
                    <span>{profileNotice.text}</span>
                  </div>
                )}

                {/* DP (1:1 Profile Picture) Section */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-900 bg-white overflow-hidden flex items-center justify-center shrink-0">
                      {editForm.profile_pic ? (
                        <img
                          src={editForm.profile_pic}
                          alt="Profile DP"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-slate-700">
                          {(editForm.full_name || displayFullName).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Profile Photo (1:1 DP)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Used on your sidebar, dashboard & certificates
                      </p>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={uploadingDp}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingDp ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Camera size={14} />
                      )}
                      <span>{uploadingDp ? 'Uploading...' : 'Change DP'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDpFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="e.g. Md Sahil Ahmed"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* Mobile Number & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        readOnly
                        value={userData?.email || user?.email || ''}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-slate-100 border border-slate-200 text-sm font-medium text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* DOB, Gender, State */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
                        className="w-full pl-8 pr-2.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      State / City
                    </label>
                    <div className="relative">
                      <MapPin
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
                        placeholder="State"
                        className="w-full pl-8 pr-2.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bio / About
                  </label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={editForm.bio}
                      onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Write a short bio about yourself..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-md bg-white border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile || uploadingDp}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1:1 Image Cropper Modal for DP */}
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          setSelectedImage(null);
        }}
        imageSrc={selectedImage || ''}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Dashboard;
