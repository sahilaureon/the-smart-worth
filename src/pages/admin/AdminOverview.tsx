import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Trash2,
  MessageSquare,
  Bell,
  Settings,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  X,
  Search,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { invokeAdminFunction } from '../../lib/supabase';
import { formatCurrency, cn } from '../../lib/utils';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import LoadingScreen from '../../components/LoadingScreen';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div
        className={cn(
          'p-3 rounded-xl',
          color === '[#615DFA]' ? 'bg-[#615DFA]/10 text-[#615DFA]' : `bg-${color}-50 text-${color}-600`
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div
          className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="font-medium">{trendValue}%</span>
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

export default function AdminOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEarnings: 0,
    activePackages: 0,
    totalCourses: 0,
    pendingWithdrawals: 0,
    recentTransactions: [] as any[],
    allTransactions: [] as any[],
    recentUsers: [] as any[],
    allUsers: [] as any[]
  });

  // Modals & User Search state
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const loadStats = async (isSilent = false, retryCount = 0) => {
    if (!isSilent && retryCount === 0) setLoading(true);
    else if (isSilent) setRefreshing(true);

    let isRetrying = false;
    try {
      const data = await invokeAdminFunction('admin-get-stats');
      setStats({
        totalUsers: data?.totalUsers || 0,
        totalEarnings: data?.totalEarnings || 0,
        activePackages: data?.activePackages || 0,
        totalCourses: data?.totalCourses || 0,
        pendingWithdrawals: data?.pendingWithdrawals || 0,
        recentTransactions: Array.isArray(data?.recentTransactions) ? data.recentTransactions : [],
        allTransactions: Array.isArray(data?.allTransactions)
          ? data.allTransactions
          : Array.isArray(data?.recentTransactions)
          ? data.recentTransactions
          : [],
        recentUsers: Array.isArray(data?.recentUsers) ? data.recentUsers : [],
        allUsers: Array.isArray(data?.allUsers) ? data.allUsers : []
      });
      setError(null);
    } catch (err: any) {
      if (retryCount < 2) {
        isRetrying = true;
        setTimeout(() => loadStats(isSilent, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      setError(err.message);
    } finally {
      if (!isRetrying) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadStats(false);
    const onFastReload = () => loadStats(true);
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleQuickAction = async (action: string) => {
    try {
      setLoading(true);
      if (action === 'Clear Old Tickets') {
        await invokeAdminFunction('admin-action', {
          action: 'delete',
          table: 'support_tickets',
          query: { eq: { column: 'status', value: 'closed' } }
        });
      } else if (action === 'Clear Notifications') {
        await invokeAdminFunction('admin-action', {
          action: 'delete',
          table: 'notifications',
          query: { eq: { column: 'read', value: true } }
        });
      }
      await loadStats(false);
    } catch (err: any) {
      console.error('Quick action error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (tx: any, newStatus: 'paid' | 'failed' | 'pending') => {
    try {
      setUpdatingStatusId(tx.id);
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'razorpay_orders',
        payload: { id: tx.id, data: { status: newStatus } }
      });
      if (selectedTx && selectedTx.id === tx.id) {
        setSelectedTx({ ...selectedTx, status: newStatus });
      }
      await loadStats(true);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (loading) return <LoadingScreen fullScreen={false} />;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const normalizeTxStatus = (statusStr?: string): 'paid' | 'failed' | 'pending' => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'paid' || s === 'approved' || s === 'completed' || s === 'success') return 'paid';
    if (s === 'failed' || s === 'rejected' || s === 'cancelled') return 'failed';
    return 'pending';
  };

  const renderStatusBadge = (rawStatus?: string) => {
    const st = normalizeTxStatus(rawStatus);
    if (st === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>SUCCESS</span>
        </span>
      );
    }
    if (st === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" />
          <span>FAILED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        <span>PENDING</span>
      </span>
    );
  };

  const allHistoryList =
    stats.allTransactions.length > 0 ? stats.allTransactions : stats.recentTransactions;

  const filteredHistory = allHistoryList.filter((tx) => {
    const st = normalizeTxStatus(tx.status);
    const matchesTab = historyFilter === 'all' || st === historyFilter;
    const q = historySearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(tx.description || '').toLowerCase().includes(q) ||
      String(tx.user_name || '').toLowerCase().includes(q) ||
      String(tx.user_email || '').toLowerCase().includes(q) ||
      String(tx.username || '').toLowerCase().includes(q) ||
      String(tx.order_id || '').toLowerCase().includes(q) ||
      String(tx.payment_id || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const allUsersList = stats.allUsers.length > 0 ? stats.allUsers : stats.recentUsers;
  const normalizedUserQuery = userSearch.trim().toLowerCase();
  const filteredUsersList = allUsersList.filter((u) => {
    if (!normalizedUserQuery) return true;
    return (
      String(u.full_name || '').toLowerCase().includes(normalizedUserQuery) ||
      String(u.email || '').toLowerCase().includes(normalizedUserQuery) ||
      String(u.username || '').toLowerCase().includes(normalizedUserQuery) ||
      String(u.phone || '').toLowerCase().includes(normalizedUserQuery) ||
      String(u.package_name || '').toLowerCase().includes(normalizedUserQuery)
    );
  });
  const displayedDashboardUsers = normalizedUserQuery
    ? filteredUsersList.slice(0, 15)
    : stats.recentUsers;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Real-time platform analytics, orders, and user activity.</p>
        </div>
        <button
          type="button"
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
          title="Reload Overview Data"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", refreshing && "animate-spin")} />
          <span>Reload</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col space-y-4 text-rose-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-lg font-black">Connection Issue Detected</p>
            </div>
          </div>
          <div className="bg-white/50 p-4 rounded-xl text-sm space-y-2">
            <p className="font-bold">
              We&apos;re having trouble connecting to the admin services. This is usually temporary.
            </p>
            <p className="text-xs">
              Please check your internet connection or try refreshing the page.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="up"
          trendValue="12.5"
          color="[#615DFA]"
        />
        <StatCard
          title="Total Revenue (Verified)"
          value={formatCurrency(stats.totalEarnings)}
          icon={TrendingUp}
          trend="up"
          trendValue="8.2"
          color="emerald"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses.toString()}
          icon={Package}
          trend="up"
          trendValue="5.4"
          color="amber"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingWithdrawals.toString()}
          icon={Clock}
          trend="up"
          trendValue="15.0"
          color="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleQuickAction('Clear Old Tickets')}
            className="flex items-center justify-between px-4 py-3 rounded-md bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors border border-slate-300 hover:border-rose-300 shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-sm">Clear Closed Tickets</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction('Clear Notifications')}
            className="flex items-center justify-between px-4 py-3 rounded-md bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors border border-slate-300 hover:border-amber-300 shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-sm">Clear Read Notifications</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
          <Link
            to="/admin/support"
            className="flex items-center justify-between px-4 py-3 rounded-md bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors border border-slate-300 hover:border-indigo-300 shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-sm">View All Tickets</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live Razorpay status &amp; customer details
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadStats(true)}
                disabled={refreshing}
                className="p-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Sync Live Razorpay Status"
              >
                <RefreshCw className={cn('w-4 h-4 text-indigo-600', refreshing && 'animate-spin')} />
              </button>
              <button
                type="button"
                onClick={() => setShowAllHistoryModal(true)}
                className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                View All ({allHistoryList.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No transactions recorded yet.
              </div>
            ) : (
              stats.recentTransactions.map((tx) => {
                const st = normalizeTxStatus(tx.status);
                return (
                  <div
                    key={tx.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl shrink-0 mt-0.5',
                          st === 'paid'
                            ? 'bg-emerald-50 text-emerald-600'
                            : st === 'failed'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        )}
                      >
                        {st === 'paid' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : st === 'failed' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                          <span className="font-bold text-slate-800">
                            {tx.user_name || 'Customer'}
                          </span>
                          {tx.user_email && tx.user_email !== 'Not provided (Pre-signup)'
                            ? ` • ${tx.user_email}`
                            : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>{formatDate(tx.created_at)}</span>
                          {tx.order_id && (
                            <span className="font-mono text-slate-500 truncate">
                              • {tx.order_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                        <p
                          className={cn(
                            'font-black text-base',
                            st === 'paid'
                              ? 'text-emerald-600'
                              : st === 'failed'
                              ? 'text-rose-600 line-through'
                              : 'text-amber-600'
                          )}
                        >
                          {st === 'paid' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </p>
                        {renderStatusBadge(tx.status)}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>User Details</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* New Users with Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">New Users</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search &amp; manage registered students ({allUsersList.length} total)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllUsersModal(true)}
                  className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  View All ({allUsersList.length || stats.totalUsers})
                </button>
              </div>
            </div>

            {/* User Search Bar by Name or Email */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#615DFA] focus:ring-2 focus:ring-[#615DFA]/15 transition-all"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {normalizedUserQuery && (
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Found <strong className="text-slate-800">{filteredUsersList.length}</strong> matching{' '}
                  {filteredUsersList.length === 1 ? 'user' : 'users'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/users?search=${encodeURIComponent(userSearch.trim())}`)}
                  className="text-[#615DFA] font-bold hover:underline cursor-pointer"
                >
                  Open in User Management →
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {displayedDashboardUsers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">No users match "{userSearch}"</p>
                <p className="text-xs text-slate-400">
                  Try searching with a different name or email address.
                </p>
              </div>
            ) : (
              displayedDashboardUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center overflow-hidden shrink-0 font-bold">
                      {user.profile_pic ? (
                        <img
                          src={optimizeCloudinaryUrl(user.profile_pic, 80, 80)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.full_name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{user.full_name || 'Student'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-indigo-600">{user.package_name}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(user.created_at)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      title="View User Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: VIEW ALL TRANSACTIONS & PAYMENT HISTORY
      ===================================================================== */}
      {showAllHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b-2 border-amber-500">
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  All Transactions &amp; Payment History ({allHistoryList.length})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Complete history of package enrollments, customer details &amp; payment statuses
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllHistoryModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Tabs */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by customer name, email, order ID, package..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'paid', label: 'Success' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'failed', label: 'Failed' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryFilter(tab.id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer',
                      historyFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full History List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No transactions match your filter.
                </div>
              ) : (
                filteredHistory.map((tx) => {
                  const st = normalizeTxStatus(tx.status);
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 sm:p-4 rounded-2xl hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={cn(
                            'p-2.5 rounded-xl shrink-0 mt-0.5',
                            st === 'paid'
                              ? 'bg-emerald-50 text-emerald-600'
                              : st === 'failed'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-amber-50 text-amber-600'
                          )}
                        >
                          {st === 'paid' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : st === 'failed' ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {tx.description}
                            </p>
                            {renderStatusBadge(tx.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1">
                            👤 {tx.user_name || 'Guest Customer'}{' '}
                            <span className="text-slate-500 font-normal">
                              (@{tx.username || 'student'})
                            </span>
                            {tx.user_email ? ` • ✉️ ${tx.user_email}` : ''}
                            {tx.user_phone ? ` • 📞 +91 ${tx.user_phone}` : ''}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-1">
                            Order: {tx.order_id || tx.id}
                            {tx.payment_id ? ` • Txn: ${tx.payment_id}` : ''} •{' '}
                            {formatDateTime(tx.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span
                          className={cn(
                            'text-base sm:text-lg font-black',
                            st === 'paid'
                              ? 'text-emerald-600'
                              : st === 'failed'
                              ? 'text-rose-600 line-through'
                              : 'text-amber-600'
                          )}
                        >
                          {st === 'paid' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>User Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAllHistoryModal(false);
                  navigate('/admin/transactions');
                }}
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:underline"
              >
                Open Full Transactions Page →
              </button>
              <button
                type="button"
                onClick={() => setShowAllHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: COMPLETE USER & TRANSACTION DETAILS MODAL (KAUN USER KIYA HAI)
      ===================================================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-slate-200 border-t-4 border-t-amber-500 overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b-2 border-amber-500">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  Customer &amp; Payment Record
                </span>
                <h3 className="text-lg font-serif font-bold text-white">
                  User &amp; Transaction Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Customer Profile Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  {selectedTx.user_profile_pic ? (
                    <img
                      src={optimizeCloudinaryUrl(selectedTx.user_profile_pic, 100, 100)}
                      alt={selectedTx.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(selectedTx.user_name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-slate-900 text-base truncate">
                      {selectedTx.user_name || 'Valued Customer'}
                    </h4>
                    {renderStatusBadge(selectedTx.status)}
                  </div>
                  <p className="text-xs font-bold text-indigo-600 truncate">
                    @{selectedTx.username || 'student'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedTx.user_email || 'No email recorded'}
                  </p>
                </div>
              </div>

              {/* Customer Details Ledger (Kaun User Kiya Hai) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-amber-300 px-4 py-2.5 text-xs font-serif font-bold uppercase tracking-wider">
                  Customer Details (Kaun User Kiya Hai)
                </div>
                <div className="divide-y divide-dashed divide-slate-200 px-4 py-1 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> Full Name
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_name || 'Guest Customer'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Username</span>
                    <span className="font-bold text-indigo-700 text-right">
                      @{selectedTx.username || 'student'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Address
                    </span>
                    <span className="font-bold text-slate-900 text-right break-all">
                      {selectedTx.user_email || 'N/A'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" /> Mobile Number
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_phone ? `+91 ${selectedTx.user_phone}` : 'Not provided'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Address
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_address || 'India'}
                    </span>
                  </div>
                  {selectedTx.referral_code && (
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-slate-500 font-semibold">Referral Code</span>
                      <span className="font-extrabold text-emerald-700 text-right">
                        {selectedTx.referral_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Package Details Ledger */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-amber-300 px-4 py-2.5 text-xs font-serif font-bold uppercase tracking-wider">
                  Package &amp; Payment Details
                </div>
                <div className="divide-y divide-dashed divide-slate-200 px-4 py-1 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Package Name</span>
                    <span className="font-serif font-bold text-slate-950 text-right">
                      {selectedTx.package_name || selectedTx.description}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Amount</span>
                    <span className="text-base font-black text-indigo-700 text-right">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Order ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs text-right break-all">
                      {selectedTx.order_id || selectedTx.id}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs text-right break-all">
                      {selectedTx.payment_id || 'Not captured / N/A'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Date &amp; Time</span>
                    <span className="font-bold text-slate-800 text-right">
                      {formatDateTime(selectedTx.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download PDF Receipt & View Classic Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`/api/payment/receipt-pdf/${encodeURIComponent(
                    selectedTx.order_id || selectedTx.id
                  )}?payment_id=${encodeURIComponent(
                    selectedTx.payment_id || ''
                  )}&email=${encodeURIComponent(
                    selectedTx.user_email || ''
                  )}&status=${encodeURIComponent(
                    normalizeTxStatus(selectedTx.status) === 'paid' ? 'paid' : 'failed'
                  )}`}
                  download={`TheSmartWorth-Receipt-${selectedTx.order_id || selectedTx.id}.pdf`}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Receipt</span>
                </a>
                <a
                  href={`/api/payment/invoice/${encodeURIComponent(
                    selectedTx.order_id || selectedTx.id
                  )}?payment_id=${encodeURIComponent(
                    selectedTx.payment_id || ''
                  )}&email=${encodeURIComponent(
                    selectedTx.user_email || ''
                  )}&status=${encodeURIComponent(
                    normalizeTxStatus(selectedTx.status) === 'paid' ? 'paid' : 'failed'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Classic Invoice</span>
                </a>
              </div>

              {/* Admin Status Control */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600">Update Order Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingStatusId === selectedTx.id}
                    onClick={() => handleUpdateOrderStatus(selectedTx, 'paid')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                  >
                    Mark Success
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatusId === selectedTx.id}
                    onClick={() => handleUpdateOrderStatus(selectedTx, 'failed')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                  >
                    Mark Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: VIEW ALL USERS DIRECTORY WITH SEARCH
      ===================================================================== */}
      {showAllUsersModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b-2 border-indigo-500">
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  All Registered Users ({allUsersList.length})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Search through the complete user list by name, email, username, or package
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllUsersModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600"
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAllUsersModal(false);
                  navigate(
                    userSearch.trim()
                      ? `/admin/users?search=${encodeURIComponent(userSearch.trim())}`
                      : '/admin/users'
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
              >
                Open Full User Management →
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
              {filteredUsersList.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  No users found matching "{userSearch}".
                </div>
              ) : (
                filteredUsersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 sm:p-4 rounded-2xl hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center overflow-hidden shrink-0 font-bold">
                        {u.profile_pic ? (
                          <img
                            src={optimizeCloudinaryUrl(u.profile_pic, 80, 80)}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{u.full_name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {u.full_name || 'Student'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        {u.phone && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm font-bold text-indigo-600">
                          {u.package_name || 'No Package'}
                        </p>
                        <p className="text-[11px] text-slate-500">{formatDate(u.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: QUICK USER DETAILS MODAL
      ===================================================================== */}
      {selectedUser && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-2 border-indigo-500">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg overflow-hidden shrink-0">
                  {selectedUser.profile_pic ? (
                    <img
                      src={optimizeCloudinaryUrl(selectedUser.profile_pic, 100, 100)}
                      alt={selectedUser.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(selectedUser.full_name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black truncate">{selectedUser.full_name || 'Student'}</h3>
                  <p className="text-xs text-slate-300 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200">
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{selectedUser.full_name || 'N/A'}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Email Address</span>
                  <a
                    href={`mailto:${selectedUser.email}`}
                    className="font-bold text-indigo-600 hover:underline break-all text-right"
                  >
                    {selectedUser.email || 'N/A'}
                  </a>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Mobile Number</span>
                  <span className="font-bold text-slate-900">{selectedUser.phone || 'Not provided'}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Enrolled Package</span>
                  <span className="font-extrabold text-indigo-600">
                    {selectedUser.package_name || 'No Package'}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Role</span>
                  <span className="uppercase text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                    {selectedUser.role || 'user'}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Joined On</span>
                  <span className="font-bold text-slate-700">
                    {formatDateTime(selectedUser.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const emailToFind = selectedUser.email || selectedUser.full_name || '';
                    setSelectedUser(null);
                    navigate(`/admin/users?search=${encodeURIComponent(emailToFind)}`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Manage User in User Management →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
