import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Ban,
  Clock,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isValidAuthUser, sanitizeStoredAuthSessions } from '../lib/supabase';
import { fetchApi } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import Checkbox from '../components/Checkbox';
import SEO from '../components/SEO';

const formatISTDateLocal = (isoOrDate: any): string => {
  if (!isoOrDate) return 'N/A';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const formatISTTimeLocal = (isoOrDate: any): string => {
  if (!isoOrDate) return 'N/A';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return 'N/A';
    return (
      d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST'
    );
  } catch {
    return 'N/A';
  }
};

const formatCountdown = (untilIso: string | null | undefined, nowMs: number): string | null => {
  if (!untilIso) return null;
  const targetMs = new Date(untilIso).getTime();
  if (isNaN(targetMs)) return null;
  const diff = targetMs - nowMs;
  if (diff <= 0) return 'Expired (You may log in now)';

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banDetails, setBanDetails] = useState<any | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!banDetails) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [banDetails]);

  useEffect(() => {
    if (error || banDetails) {
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const fieldError = document.querySelector('.field-error-message');
          if (fieldError) {
            fieldError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }, [error, banDetails]);

  useEffect(() => {
    sanitizeStoredAuthSessions();

    const verifyExistingSession = async (sessionUser: any) => {
      if (!isValidAuthUser(sessionUser)) return;
      try {
        const res = await fetchApi(`/profile/${sessionUser.id}`);
        if (res.ok) {
          const prof = await res.json();
          if (prof?.is_banned) {
            localStorage.removeItem('tsw_fallback_session');
            await supabase.auth.signOut().catch(() => {});
            window.dispatchEvent(new Event('tsw-auth-change'));
            setBanDetails(
              prof.ban_details || {
                is_banned: true,
                ban_type: prof.ban_type || (prof.ban_until ? 'temporary' : 'permanent'),
                ban_reason: prof.ban_reason || 'Violation of platform rules and terms of service',
                banned_at: prof.banned_at || prof.updated_at || new Date().toISOString(),
                ban_until: prof.ban_until || null
              }
            );
            setError('Your Account is Banned.');
            return;
          }
        }
      } catch {}
      navigate('/dashboard');
    };

    try {
      const saved = localStorage.getItem('tsw_fallback_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidAuthUser(parsed?.user)) {
          verifyExistingSession(parsed.user);
          return;
        }
      }
    } catch {}

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isValidAuthUser(session?.user)) {
        verifyExistingSession(session!.user);
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setBanDetails(null);

    try {
      sanitizeStoredAuthSessions();
      const response = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Unable to sign in right now. Please try again.');
      }

      if (!response.ok || data?.banned || data?.ban_details || data?.login_error) {
        if (data?.ban_details) {
          setBanDetails(data.ban_details);
        }
        if (data?.error?.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password.');
        }
        throw new Error(data?.error || 'Login failed');
      }

      if (data.session) {
        const cleanSession = {
          ...data.session,
          user: {
            ...(data.session.user || data.user),
            user_metadata: {
              ...((data.session.user || data.user)?.user_metadata || {})
            }
          }
        };
        if (
          cleanSession.user?.user_metadata?.profile_pic &&
          String(cleanSession.user.user_metadata.profile_pic).length > 500
        ) {
          delete cleanSession.user.user_metadata.profile_pic;
        }
        localStorage.setItem('tsw_fallback_session', JSON.stringify(cleanSession));
        window.dispatchEvent(new Event('tsw-auth-change'));
        if (cleanSession.access_token && String(cleanSession.access_token).length <= 4000) {
          try {
            await supabase.auth.setSession({
              access_token: cleanSession.access_token,
              refresh_token: cleanSession.refresh_token
            });
          } catch {}
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const isPermanentBan =
    banDetails?.ban_type === 'permanent' || !banDetails?.ban_until;
  const bannedDateStr =
    banDetails?.banned_date_formatted || formatISTDateLocal(banDetails?.banned_at);
  const bannedTimeStr =
    banDetails?.banned_time_formatted || formatISTTimeLocal(banDetails?.banned_at);
  const unbanDateStr =
    banDetails?.unban_date_formatted || formatISTDateLocal(banDetails?.ban_until);
  const unbanTimeStr =
    banDetails?.unban_time_formatted || formatISTTimeLocal(banDetails?.ban_until);
  const remainingStr = !isPermanentBan
    ? formatCountdown(banDetails?.ban_until, nowMs)
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <SEO
        title="Login | The Smart Worth - Access Your Learning Dashboard"
        description="Log in to your The Smart Worth account to access your courses and manage your earning dashboard."
      />
      <Navbar />

      <PageHeader title="Login" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-14 relative z-20">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 md:p-8 border border-gray-50 relative overflow-hidden"
          >
            {/* Logo in Card */}
            <div className="flex justify-center mb-6">
              <svg width="140" height="35" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
                <defs>
                  <linearGradient id="logoGradientLogin" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#615DFA" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
                <text x="0" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="url(#logoGradientLogin)" letterSpacing="-1">The</text>
                <text x="50" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="#0A0E27" letterSpacing="-1">Smart Worth</text>
                <rect x="0" y="42" width="195" height="3" rx="1.5" fill="url(#logoGradientLogin)" />
              </svg>
            </div>

            <div className="mb-6">
              <h2 className="text-[#615DFA] font-bold text-xs mb-1 tracking-wide">Login Account</h2>
              <h3 className="text-2xl font-black text-[#0A0E27] tracking-tight">Welcome Back! 🤩</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Classic Banned User Notice Card */}
              {banDetails ? (
                <motion.div
                  ref={errorRef}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-lg bg-white border border-slate-300 shadow-xs overflow-hidden"
                >
                  {/* Classic Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <Ban size={14} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider truncate">
                        Your Account is Banned
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <ShieldAlert size={10} />
                      {isPermanentBan ? 'Permanent Ban' : 'Temporary Ban'}
                    </span>
                  </div>

                  {/* Classic Body & Data Table */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isPermanentBan
                        ? 'Your account has been permanently suspended by the administrator and cannot access the platform.'
                        : 'Your account has been temporarily suspended by the administrator. Access will be restored once the suspension period ends.'}
                    </p>

                    <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-slate-50/40 text-xs">
                      <div className="px-3 py-2 flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-500">Reason</span>
                        <span className="font-bold text-slate-900 text-right">
                          {banDetails.ban_reason || 'Violation of platform rules'}
                        </span>
                      </div>

                      <div className="px-3 py-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">Banned Date</span>
                        <span className="font-semibold text-slate-800 font-mono">{bannedDateStr}</span>
                      </div>

                      <div className="px-3 py-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-500">Banned Time</span>
                        <span className="font-semibold text-slate-800 font-mono">{bannedTimeStr}</span>
                      </div>

                      {!isPermanentBan ? (
                        <>
                          <div className="px-3 py-2 flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-500">Unban Date</span>
                            <span className="font-semibold text-slate-800 font-mono">{unbanDateStr}</span>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-500">Unban Time</span>
                            <span className="font-semibold text-slate-800 font-mono">{unbanTimeStr}</span>
                          </div>
                          {remainingStr && (
                            <div className="px-3 py-2 bg-slate-100/80 flex items-center justify-between gap-3">
                              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                Time Remaining
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs">
                                {remainingStr}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-3 py-2 bg-slate-100/80 flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-500">Ban Duration</span>
                          <span className="font-bold text-red-700">
                            Permanent (Until Unbanned by Admin)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Classic Footer */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      Need help with your account?
                    </span>
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider border border-slate-900 transition-colors"
                    >
                      Contact Support
                    </Link>
                  </div>
                </motion.div>
              ) : (
                error &&
                !error.toLowerCase().includes('email') &&
                !error.toLowerCase().includes('password') &&
                !error.toLowerCase().includes('invalid') && (
                  <motion.div
                    ref={errorRef}
                    initial={{ opacity: 0, scale: 0.95, x: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: [0, -10, 10, -10, 10, 0]
                    }}
                    transition={{ duration: 0.4 }}
                    className="p-3 rounded-xl bg-red-50 border-2 border-red-200 flex items-center space-x-2 text-red-600 shadow-sm"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <span className="font-bold text-xs">{error}</span>
                  </motion.div>
                )
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                        setBanDetails(null);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      className={`w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                        setBanDetails(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#615DFA] transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {!banDetails &&
                    error &&
                    (error.toLowerCase().includes('email') ||
                      error.toLowerCase().includes('password') ||
                      error.toLowerCase().includes('invalid')) && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1"
                      >
                        <AlertCircle size={12} />
                        <span>{error}</span>
                      </motion.div>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-medium">
                <Checkbox label="Remember Me" className="w-3.5 h-3.5" />
                <Link to="/forgot-password" title="Reset Password" className="text-[#615DFA] hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <BrutalistButton
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full"
                size="lg"
                fullWidth
              >
                Login Account
              </BrutalistButton>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 font-medium">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#615DFA] font-black hover:underline ml-1">
                    Create One
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
