import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  Wallet,
  Shield,
  TrendingUp,
  Zap,
  Bell,
  Calendar,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../App';
import { formatCurrency, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { useEnrolledCourses, useUserDashboardStats } from '../../lib/queries';
import LoadingScreen from '../../components/LoadingScreen';
import { fetchApi } from '../../lib/api';

const Overview = () => {
  const { user, role } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<any[]>([]);

  const {
    data: courses = [],
    isLoading: coursesLoading,
    error: coursesError
  } = useEnrolledCourses(user?.id);

  const {
    data: userStats,
    isLoading: statsLoading
  } = useUserDashboardStats(user?.id);

  const loading = coursesLoading || statsLoading;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const profileRes = await fetchApi(`/profile/${user.id}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserData(profile);
        }

        const txRes = await fetchApi(`/transactions/${user.id}?limit=5`);
        if (txRes.ok) {
          const txs = await txRes.json();
          setRecentEarnings(Array.isArray(txs) ? txs : []);
        }

        const settingsRes = await fetchApi('/site-settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.global_message) {
            setGlobalMessage(settings.global_message);
          }
        }
      } catch (err) {
        console.error('[Overview] Error fetching supplemental data:', err);
      }
    };

    fetchData();
  }, [user]);

  const unlockedCoursesCount = courses.filter((c: any) => c.is_unlocked !== false).length;

  const stats = [
    {
      label: 'Total Earnings',
      value: userData?.total_earned || 0,
      icon: Zap,
      badge: 'Lifetime',
      isCurrency: true,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      label: 'Active Courses',
      value: unlockedCoursesCount,
      icon: BookOpen,
      badge: `${unlockedCoursesCount} Unlocked`,
      isCurrency: false,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    {
      label: 'Referrals',
      value: userStats?.referralCount || 0,
      icon: Users,
      badge: 'Network',
      isCurrency: false,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      label: 'Wallet Balance',
      value: userData?.wallet_balance || 0,
      icon: Wallet,
      badge: 'Available',
      isCurrency: true,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  if (loading && !userData) return <LoadingScreen fullScreen={false} />;

  const fullName =
    userData?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    userData?.username?.trim() ||
    'Member';

  const rawJoinedDate = userData?.created_at || (user as any)?.created_at;
  const parsedJoinedDate = rawJoinedDate ? new Date(rawJoinedDate) : null;
  const formattedRegistrationDate =
    parsedJoinedDate && !isNaN(parsedJoinedDate.getTime())
      ? parsedJoinedDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {coursesError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 text-red-800">
          <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Connection Issue Detected</p>
            <p className="text-xs mt-1">{(coursesError as Error).message}</p>
          </div>
        </div>
      )}

      {/* Classic Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Account Overview
          </p>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is a quick summary of your performance and earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar size={14} className="text-slate-500" />
            <span>Registered: {formattedRegistrationDate}</span>
          </div>

          {role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-semibold transition-colors shadow-sm"
            >
              <Shield size={14} />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      {/* Global Admin Announcement */}
      {globalMessage && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Official Announcement
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 leading-relaxed">
              {globalMessage}
            </p>
          </div>
        </div>
      )}

      {/* Classic 4-Column Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-md border flex items-center justify-center shrink-0',
                  stat.iconBg
                )}
              >
                <stat.icon size={18} />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                <ArrowUpRight size={11} />
                <span>{stat.badge}</span>
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Classic Recent Earnings Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Earnings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest referral commissions and wallet transactions.
            </p>
          </div>

          <Link
            to="/dashboard/earnings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-semibold transition-colors shadow-sm shrink-0"
          >
            <span>View Wallet</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentEarnings.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {recentEarnings.map((earning, i) => (
              <div
                key={earning.id || i}
                className="p-4 sm:px-6 sm:py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    {earning.description?.charAt(0)?.toUpperCase() || '₹'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {earning.description || 'Referral Earning'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {earning.created_at
                        ? new Date(earning.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recent'}{' '}
                      • Credited
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-emerald-600 shrink-0">
                  +{formatCurrency(earning.amount || 0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <TrendingUp size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              No Recent Earnings
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Share your referral code from the Earnings page to start earning commissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
