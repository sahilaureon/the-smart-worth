import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  Eye,
  X,
  Zap,
  UserPlus,
  Package,
  ArrowUpCircle,
  Loader2,
  RefreshCw,
  Download,
  Clock,
  Ban,
  Save,
  KeyRound,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { invokeAdminFunction } from '../../lib/supabase';
import { useAuth } from '../../App';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import CertificateModal from '../../components/admin/CertificateModal';
import LoadingScreen from '../../components/LoadingScreen';

// Helper to download user DP / profile photo directly
const downloadUserImage = async (imageUrl: string, fullName: string) => {
  if (!imageUrl) return;
  const safeName = (fullName || 'user')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = `${safeName || 'User'}_DP.jpg`;

  try {
    if (imageUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const response = await fetch(imageUrl, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch {
    // Fallback via canvas or direct link
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

// Format remaining milliseconds into a live countdown string
const formatRemainingTime = (untilIso: string | null | undefined, nowMs: number): string | null => {
  if (!untilIso) return null;
  const targetMs = new Date(untilIso).getTime();
  if (isNaN(targetMs)) return null;
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

const ClassicReadOnlyField = ({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={value || 'Not Provided'}
      className={cn(
        'w-full px-3.5 py-2 rounded-md border text-xs sm:text-sm font-semibold outline-none',
        highlight
          ? 'bg-slate-100 border-slate-300 text-slate-900 font-mono'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      )}
    />
  </div>
);

const UserCertificatesModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'certificates',
          query: { eq: { column: 'user_id', value: user.id } }
        });
        setCerts(data || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                User Certificates
              </h2>
              <p className="text-xs text-slate-500">
                Issued records for {user.full_name || user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-semibold">
              Loading certificate records...
            </div>
          ) : certs.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Award size={22} />
              </div>
              <p className="text-slate-800 font-bold text-sm">No Certificates Issued</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the Issue Certificate action in the table to upload a certificate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certs.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <div className="aspect-[1.414] bg-slate-100 overflow-hidden border-b border-slate-200">
                    <img
                      src={cert.certificate_url}
                      alt={cert.package_name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 uppercase truncate">
                        {cert.package_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cert.created_at
                          ? new Date(cert.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Issued'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`/certificate/${encodeURIComponent(cert.certificate_id || cert.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Open Public Verification"
                      >
                        <ExternalLink size={12} />
                        <span>Verify</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadUserImage(cert.certificate_url, `${user.full_name}_${cert.package_name}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const UserDetailModal = ({
  user,
  onClose,
  onUpdated,
  onOpenBanModal,
  onUnbanUser
}: {
  user: any;
  onClose: () => void;
  onUpdated: () => void;
  onOpenBanModal: () => void;
  onUnbanUser: () => void;
}) => {
  const [payoutStats, setPayoutStats] = useState({ pending: 0, total: 0 });
  const [packages, setPackages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [downloadingDp, setDownloadingDp] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [editFields, setEditFields] = useState({
    full_name: user.full_name || '',
    username: user.username || (user.email ? user.email.split('@')[0] : ''),
    mobile: user.mobile || user.phone || '',
    password: user.password || '',
    dob: user.dob || '',
    gender: user.gender || '',
    state: user.state || user.city || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const payouts = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'payouts',
          query: { eq: { column: 'user_id', value: user.id } }
        });

        const stats = (payouts || []).reduce(
          (acc: any, p: any) => {
            if (p.status === 'pending') acc.pending += Number(p.amount);
            if (p.status === 'paid' || p.status === 'approved') acc.total += Number(p.amount);
            return acc;
          },
          { pending: 0, total: 0 }
        );

        setPayoutStats(stats);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchData();
  }, [user.id]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'packages',
          query: { select: 'id, name, price' }
        });
        setPackages(data || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };
    fetchPackages();
  }, []);

  const selectedPackage = packages.find((p) => p.id === user.package_id);

  const handleSaveUserFields = async () => {
    setSaving(true);
    setSaveSuccess(null);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: user.id,
          data: {
            full_name: editFields.full_name.trim(),
            username: editFields.username.trim().replace(/^@/, ''),
            mobile: editFields.mobile.trim(),
            password: editFields.password.trim(),
            dob: editFields.dob || null,
            gender: editFields.gender || null,
            state: editFields.state.trim() || null
          }
        }
      });
      setSaveSuccess('User details & credentials updated!');
      onUpdated();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update user details:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDp = async () => {
    if (!user.profile_pic) return;
    setDownloadingDp(true);
    try {
      await downloadUserImage(user.profile_pic, editFields.full_name || user.full_name || 'User');
    } finally {
      setDownloadingDp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
        {/* Modal Header with User DP & Download Image Button */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {user.profile_pic ? (
              <img
                src={user.profile_pic}
                alt={user.full_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-900 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider truncate">
                User Profile Report
              </h2>
              <p className="text-xs text-slate-500 truncate">
                ID: {user.tsw_id || 'TSW-USER'} • {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user.profile_pic && (
              <button
                type="button"
                onClick={handleDownloadDp}
                disabled={downloadingDp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                title="Download User Profile Photo (DP)"
              >
                {downloadingDp ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                <span>Download Image</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {saveSuccess && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Account Status & Quick Ban / Unban Bar */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {user.is_banned ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                  <Ban size={13} />
                  <span>
                    {user.ban_type === 'permanent' || !user.ban_until
                      ? 'Permanently Banned'
                      : 'Temporarily Banned'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} />
                  <span>Account Active</span>
                </span>
              )}
              {user.is_banned && user.banned_at && (
                <span className="text-xs font-semibold text-slate-600">
                  Banned:{' '}
                  {new Date(user.banned_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
              {user.is_banned && user.ban_until && user.ban_type !== 'permanent' && (
                <span className="text-xs font-semibold text-slate-600">
                  Until:{' '}
                  {new Date(user.ban_until).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user.is_banned ? (
                <>
                  <button
                    type="button"
                    onClick={onUnbanUser}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ShieldCheck size={13} />
                    <span>Unban User</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBanModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Clock size={13} />
                    <span>Edit Ban Timer</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onOpenBanModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ShieldAlert size={13} />
                  <span>Ban / Set Timer</span>
                </button>
              )}
            </div>
          </div>

          {/* Core Identity & Credentials (Editable by Admin) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Core Identity & Credentials
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                Admin can view or edit fields below
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFields.full_name}
                  onChange={(e) => setEditFields((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editFields.username}
                  onChange={(e) => setEditFields((p) => ({ ...p, username: e.target.value }))}
                  placeholder="username"
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  readOnly
                  value={user.email || 'Not Provided'}
                  className="w-full px-3.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editFields.mobile}
                  onChange={(e) => setEditFields((p) => ({ ...p, mobile: e.target.value }))}
                  placeholder="Mobile number"
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <KeyRound
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={editFields.password}
                    onChange={(e) => setEditFields((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Enter or view password"
                    className="w-full pl-8 pr-3.5 py-2 rounded-md bg-amber-50/60 border border-amber-300 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editFields.dob}
                  onChange={(e) => setEditFields((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Package & Location / Demographics */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Demographics, Location & Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  State / City
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={editFields.state}
                    onChange={(e) => setEditFields((p) => ({ ...p, state: e.target.value }))}
                    placeholder="e.g. New Delhi / Bihar / Mumbai"
                    className="w-full pl-8 pr-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={editFields.gender}
                  onChange={(e) => setEditFields((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <ClassicReadOnlyField
                label="Active Package"
                value={selectedPackage?.name || 'No Package'}
              />
              <ClassicReadOnlyField
                label="Referred By"
                value={user.referred_by || 'Direct Signup'}
              />
            </div>
          </section>

          {/* Wallet & Earnings */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Wallet & Earnings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <ClassicReadOnlyField
                label="Wallet Balance"
                value={`₹${user.wallet_balance || 0}`}
                highlight
              />
              <ClassicReadOnlyField label="Pending Payouts" value={`₹${payoutStats.pending}`} />
              <ClassicReadOnlyField label="Total Withdrawn" value={`₹${payoutStats.total}`} />
            </div>
          </section>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Report
          </button>

          <button
            type="button"
            onClick={handleSaveUserFields}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save User Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const BanUserModal = ({
  user,
  onClose,
  onSuccess
}: {
  user: any;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) => {
  const [banMode, setBanMode] = useState<'temporary' | 'permanent'>(
    user.ban_type === 'permanent' ? 'permanent' : 'temporary'
  );
  const [days, setDays] = useState<number>(1);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [banReason, setBanReason] = useState(user.ban_reason || 'Violation of platform rules');
  const [isProcessing, setIsProcessing] = useState(false);

  const applyQuickPreset = (d: number, h: number, m: number) => {
    setBanMode('temporary');
    setDays(d);
    setHours(h);
    setMinutes(m);
  };

  const totalMinutes = days * 1440 + hours * 60 + minutes;
  const previewExpiryDate = new Date(Date.now() + Math.max(totalMinutes, 1) * 60 * 1000);

  const handleApplyBan = async () => {
    setIsProcessing(true);
    try {
      const isPermanent = banMode === 'permanent';
      const untilIso = isPermanent
        ? null
        : new Date(Date.now() + Math.max(totalMinutes, 1) * 60 * 1000).toISOString();

      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: user.id,
          data: {
            is_banned: true,
            ban_type: isPermanent ? 'permanent' : 'temporary',
            ban_reason: banReason.trim() || 'Restricted by Administrator',
            banned_at: new Date().toISOString(),
            ban_until: untilIso
          }
        }
      });

      onSuccess(
        isPermanent
          ? `${user.full_name || 'User'} has been permanently banned.`
          : `Temporary ban timer set for ${user.full_name || 'User'}.`
      );
      onClose();
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanNow = async () => {
    setIsProcessing(true);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: user.id,
          data: {
            is_banned: false,
            ban_type: null,
            banned_at: null,
            ban_until: null,
            ban_reason: null
          }
        }
      });
      onSuccess(`${user.full_name || 'User'} has been unbanned!`);
      onClose();
    } catch (error) {
      console.error('Error unbanning user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ban & Timer Management
              </h2>
              <p className="text-xs text-slate-500">
                {user.full_name || 'User'} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* If user is already banned, show instant Unban box */}
          {user.is_banned && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  User is Currently Banned
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {user.ban_type === 'permanent' || !user.ban_until
                    ? 'Status: Permanent Ban'
                    : `Temporary Ban until ${new Date(user.ban_until).toLocaleString('en-IN')}`}
                </p>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleUnbanNow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Unban User</span>
              </button>
            </div>
          )}

          {/* Mode Selector: Temporary Ban (Timer) vs Permanent Ban */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Ban Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBanMode('temporary')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors cursor-pointer flex items-center gap-2.5',
                  banMode === 'temporary'
                    ? 'bg-slate-900 text-white border-slate-950'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                )}
              >
                <Clock size={16} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Temporary Ban</p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5',
                      banMode === 'temporary' ? 'text-slate-300' : 'text-slate-500'
                    )}
                  >
                    Set custom countdown timer
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBanMode('permanent')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors cursor-pointer flex items-center gap-2.5',
                  banMode === 'permanent'
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                )}
              >
                <Ban size={16} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Permanent Ban</p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5',
                      banMode === 'permanent' ? 'text-red-100' : 'text-slate-500'
                    )}
                  >
                    Block until manually unbanned
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Temporary Ban Timer Controls */}
          {banMode === 'temporary' ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quick Timer Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '30 Mins', d: 0, h: 0, m: 30 },
                    { label: '1 Hour', d: 0, h: 1, m: 0 },
                    { label: '6 Hours', d: 0, h: 6, m: 0 },
                    { label: '12 Hours', d: 0, h: 12, m: 0 },
                    { label: '1 Day', d: 1, h: 0, m: 0 },
                    { label: '3 Days', d: 3, h: 0, m: 0 },
                    { label: '7 Days', d: 7, h: 0, m: 0 },
                    { label: '30 Days', d: 30, h: 0, m: 0 }
                  ].map((preset) => {
                    const active =
                      days === preset.d && hours === preset.h && minutes === preset.m;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyQuickPreset(preset.d, preset.h, preset.m)}
                        className={cn(
                          'px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer',
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Custom Timer (Days / Hours / Minutes)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Days
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={3650}
                      value={days}
                      onChange={(e) => setDays(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Hours
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={hours}
                      onChange={(e) => setHours(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Minutes
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Auto-Unban Time:</span>
                <span className="font-bold text-slate-900">
                  {previewExpiryDate.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider">Permanent Account Ban</p>
              <p className="text-red-700 leading-relaxed">
                This user will be permanently blocked from signing in or accessing courses until you manually click &ldquo;Unban&rdquo;.
              </p>
            </div>
          )}

          {/* Ban Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ban Reason
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter reason for restriction..."
              className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 h-20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyBan}
            disabled={isProcessing || (banMode === 'temporary' && totalMinutes <= 0)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer border',
              banMode === 'permanent'
                ? 'bg-red-600 hover:bg-red-700 border-red-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-950'
            )}
          >
            {isProcessing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : banMode === 'permanent' ? (
              <Ban size={14} />
            ) : (
              <Clock size={14} />
            )}
            <span>
              {banMode === 'permanent' ? 'Apply Permanent Ban' : 'Start Temporary Ban Timer'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CreateUserModal = ({
  packages,
  onClose,
  onSuccess
}: {
  packages: any[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    package_id: packages[0]?.id || '',
    role: 'user'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'create-user',
        payload: formData
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Create Manual User
              </h2>
              <p className="text-xs text-slate-500">Provision a new platform account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                required
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 font-semibold text-sm text-slate-900 outline-none focus:border-slate-900"
                placeholder="Sahil Aureon"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 font-semibold text-sm text-slate-900 outline-none focus:border-slate-900"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Password
              </label>
              <input
                required
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 font-semibold text-sm text-slate-900 outline-none focus:border-slate-900"
                placeholder="Secure@123"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                User Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 font-semibold text-sm text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="user">Standard User</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign Package
            </label>
            <div className="grid grid-cols-1 gap-2">
              {packages.map((pkg) => {
                const selected = formData.package_id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, package_id: pkg.id })}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-md border transition-colors text-left cursor-pointer',
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
                    )}
                  >
                    <span className="font-bold text-xs uppercase tracking-wider">{pkg.name}</span>
                    {selected && <CheckCircle2 size={15} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              <span>Create User</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UpgradePackageModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const [selectedPackage, setSelectedPackage] = useState(user.package_id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'packages',
          query: {
            eq: { column: 'status', value: 'active' },
            order: { column: 'created_at', ascending: true }
          }
        });
        setPackages(data || []);
      } catch (err) {
        console.error('Error fetching packages:', err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const handleUpgrade = async () => {
    setIsUpdating(true);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: { id: user.id, data: { package_id: selectedPackage } }
      });
      onClose();
    } catch (error) {
      console.error('Error upgrading package:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-lg w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <ArrowUpCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Update User Package
              </h2>
              <p className="text-xs text-slate-500">Assign or upgrade learning package</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Select Package
            </label>
            <div className="grid grid-cols-1 gap-2">
              {loadingPackages ? (
                <div className="p-4 text-center text-slate-500 text-xs font-semibold">
                  Loading packages...
                </div>
              ) : packages.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">No packages available.</div>
              ) : (
                packages.map((pkg) => {
                  const selected = selectedPackage === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-md border transition-colors text-left cursor-pointer',
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
                      )}
                    >
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wider">{pkg.name}</p>
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            selected ? 'text-slate-300' : 'text-slate-500'
                          )}
                        >
                          ₹{pkg.price}
                        </p>
                      </div>
                      {selected && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isUpdating || selectedPackage === user.package_id}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
            <span>Save Package</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function UserManagement() {
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Tick every second so temporary ban countdown timers update live
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isViewCertsModalOpen, setIsViewCertsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allPackages, setAllPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllPackages = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'packages',
          query: { select: 'id, name' }
        });
        if (Array.isArray(data)) {
          setAllPackages(data);
        }
      } catch {
        // Fallback if packages query is temporarily unavailable
        setAllPackages([]);
      }
    };
    fetchAllPackages();
  }, []);

  const fetchUsers = async (showToast = false, retryCount = 0) => {
    let isRetrying = false;
    try {
      if (retryCount === 0) setLoading(true);
      const data = await invokeAdminFunction('admin-get-users');
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      if (viewingUser) {
        const updatedViewing = list.find((u: any) => u.id === viewingUser.id);
        if (updatedViewing) setViewingUser(updatedViewing);
      }
      setError(null);
      if (showToast) {
        setActionMessage({ type: 'success', text: 'User records synchronized!' });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      if (retryCount < 2) {
        isRetrying = true;
        setTimeout(() => fetchUsers(showToast, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      setError(err.message);
    } finally {
      if (!isRetrying) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const onFastReload = () => fetchUsers(true);
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleUnban = async (userId: string) => {
    try {
      setActionLoading(userId);
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: userId,
          data: {
            is_banned: false,
            ban_type: null,
            banned_at: null,
            ban_until: null,
            ban_reason: null
          }
        }
      });
      setActionMessage({ type: 'success', text: 'User unbanned successfully!' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      setActionMessage({ type: 'error', text: `Error unbanning: ${error.message}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDelete = async (userId: string) => {
    if (deleteConfirmId !== userId) {
      setDeleteConfirmId(userId);
      setTimeout(() => setDeleteConfirmId(null), 5000);
      return;
    }

    try {
      setActionLoading(userId);
      await invokeAdminFunction('admin-action', {
        action: 'delete-user',
        payload: { id: userId }
      });

      setActionMessage({ type: 'success', text: 'User permanently deleted!' });
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setActionMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.tsw_id?.toLowerCase().includes(q) ||
      user.mobile?.toLowerCase().includes(q);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter((u) => !u.is_banned).length;
  const bannedCount = users.filter((u) => u.is_banned).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-5">
      {/* Classic Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Platform Directory
          </p>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View user credentials, download user DP, and manage temporary or permanent bans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Create User</span>
          </button>
          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Reload Users"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-600', loading && 'animate-spin')} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start justify-between gap-3 text-red-800">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Connection Issue Detected</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Feedback Toast */}
      {actionMessage && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 px-4 py-3 rounded-md shadow-lg border text-xs font-semibold flex items-center gap-2',
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600" />
          ) : (
            <ShieldAlert size={16} className="text-red-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Classic Compact 4-Column Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Users
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{users.length}</h3>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 text-slate-700 hidden sm:flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Users
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">{activeCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hidden sm:flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Banned Users
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{bannedCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-md bg-red-50 border border-red-200 text-red-600 hidden sm:flex items-center justify-center shrink-0">
            <Ban size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Admins
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{adminCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 text-slate-700 hidden sm:flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
        </div>
      </div>

      {/* Classic Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or TSW ID..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-900 focus:border-slate-900 outline-none"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (searchParams.has('search')) {
                  if (val.trim()) setSearchParams({ search: val }, { replace: true });
                  else setSearchParams({}, { replace: true });
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (searchParams.has('search')) setSearchParams({}, { replace: true });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-semibold text-slate-800 focus:border-slate-900 outline-none cursor-pointer"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Users Only</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500 px-1">
          Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> of{' '}
          <span className="font-bold text-slate-900">{users.length}</span> users
        </div>
      </div>

      {/* Classic Users Directory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Contact & ID
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Status & Ban Timer
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Users size={20} />
                    </div>
                    <p className="text-slate-800 font-bold text-sm">No Users Found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search query or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const pkgName =
                    allPackages.find((p) => p.id === user.package_id)?.name || 'No Package';
                  const formattedDate = user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  const remainingTimer =
                    user.is_banned && user.ban_type !== 'permanent'
                      ? formatRemainingTime(user.ban_until, nowMs)
                      : null;

                  const isEffectiveBanned =
                    user.is_banned &&
                    (user.ban_type === 'permanent' || !user.ban_until || Boolean(remainingTimer));

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isEffectiveBanned && 'bg-red-50/30'
                      )}
                    >
                      {/* User Profile + Download DP option */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <div className="w-10 h-10 rounded-full border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center">
                              {user.profile_pic ? (
                                <img
                                  src={user.profile_pic}
                                  alt={user.full_name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-sm font-bold text-slate-700">
                                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            {user.profile_pic && (
                              <button
                                type="button"
                                onClick={() => downloadUserImage(user.profile_pic, user.full_name)}
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white border border-white flex items-center justify-center shadow-xs hover:bg-slate-700 cursor-pointer"
                                title="Download User DP"
                              >
                                <Download size={10} />
                              </button>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate flex items-center gap-1.5">
                              <span>{user.full_name || 'Unnamed User'}</span>
                              {isEffectiveBanned && (
                                <ShieldAlert size={13} className="text-red-600 shrink-0" />
                              )}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                              @{user.username || 'user'}
                              {user.gender ? ` • ${user.gender}` : ''}
                              {user.state ? ` • ${user.state}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & ID */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className="inline-block font-mono text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {user.tsw_id || 'TSW-USER'}
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-medium truncate max-w-[180px]">
                              {user.email}
                            </span>
                          </div>
                          {(user.mobile || user.phone) && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span className="text-[11px] font-medium">
                                {user.mobile || user.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Package */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                          <Package size={13} className="text-slate-500 shrink-0" />
                          <span className="truncate max-w-[130px]">{pkgName}</span>
                        </span>
                      </td>

                      {/* Status & Ban Timer */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isEffectiveBanned ? (
                              user.ban_type === 'permanent' || !user.ban_until ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white border border-red-700">
                                  <Ban size={10} />
                                  <span>Permanent Ban</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock size={10} />
                                  <span>Temp Ban: {remainingTimer}</span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={10} />
                                <span>Active</span>
                              </span>
                            )}

                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                                user.role === 'admin'
                                  ? 'bg-slate-900 text-white border-slate-950'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              )}
                            >
                              {user.role || 'user'}
                            </span>
                          </div>

                          {isEffectiveBanned && (
                            <button
                              type="button"
                              onClick={() => handleUnban(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <ShieldCheck size={10} />
                              <span>Unban Now</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Inspect / Edit User Profile Report */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewingUser(user);
                              setIsDetailModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-md transition-colors cursor-pointer"
                            title="View Password, DOB, Gender, State & Download DP"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Download User DP directly */}
                          {user.profile_pic && (
                            <button
                              type="button"
                              onClick={() => downloadUserImage(user.profile_pic, user.full_name)}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-md transition-colors cursor-pointer"
                              title="Download User Image (DP)"
                            >
                              <Download size={14} />
                            </button>
                          )}

                          {/* View Certificates */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewingUser(user);
                              setIsViewCertsModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-md transition-colors cursor-pointer"
                            title="View Issued Certificates"
                          >
                            <Award size={14} />
                          </button>

                          {/* Update Package */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewingUser(user);
                              setIsUpgradeModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-md transition-colors cursor-pointer"
                            title="Update Package"
                          >
                            <ArrowUpCircle size={14} />
                          </button>

                          {/* Issue Certificate */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsCertModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-md transition-colors cursor-pointer"
                            title="Issue Certificate"
                          >
                            <Zap size={14} />
                          </button>

                          {/* Ban / Temporary Timer / Permanent Ban / Unban Modal Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setViewingUser(user);
                              setIsBanModalOpen(true);
                            }}
                            className={cn(
                              'w-8 h-8 flex items-center justify-center transition-colors rounded-md border cursor-pointer',
                              isEffectiveBanned
                                ? 'text-white bg-red-600 border-red-700 hover:bg-red-700'
                                : 'text-slate-700 bg-white border-slate-300 hover:text-red-600 hover:bg-red-50 hover:border-red-300'
                            )}
                            title={
                              isEffectiveBanned
                                ? 'Manage Ban / Unban User'
                                : 'Temporary Ban Timer / Permanent Ban'
                            }
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldAlert size={14} />
                            )}
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading === user.id}
                            className={cn(
                              'w-8 h-8 flex items-center justify-center transition-colors rounded-md border cursor-pointer',
                              deleteConfirmId === user.id
                                ? 'text-white bg-red-600 border-red-700 hover:bg-red-700'
                                : 'text-red-600 bg-white border-red-200 hover:bg-red-50',
                              actionLoading === user.id && 'opacity-50 cursor-not-allowed'
                            )}
                            title={
                              deleteConfirmId === user.id
                                ? 'Click again to confirm delete'
                                : 'Delete User'
                            }
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : deleteConfirmId === user.id ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => {
            setIsDetailModalOpen(false);
            setViewingUser(null);
          }}
          onUpdated={() => fetchUsers()}
          onOpenBanModal={() => {
            setIsDetailModalOpen(false);
            setIsBanModalOpen(true);
          }}
          onUnbanUser={() => {
            handleUnban(viewingUser.id);
            setIsDetailModalOpen(false);
            setViewingUser(null);
          }}
        />
      )}

      {isViewCertsModalOpen && viewingUser && (
        <UserCertificatesModal
          user={viewingUser}
          onClose={() => {
            setIsViewCertsModalOpen(false);
            setViewingUser(null);
          }}
        />
      )}

      {isCertModalOpen && selectedUser && (
        <CertificateModal
          user={selectedUser}
          onClose={() => {
            setIsCertModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {isUpgradeModalOpen && viewingUser && (
        <UpgradePackageModal
          user={viewingUser}
          onClose={() => {
            setIsUpgradeModalOpen(false);
            setViewingUser(null);
            fetchUsers();
          }}
        />
      )}

      {isBanModalOpen && viewingUser && (
        <BanUserModal
          user={viewingUser}
          onClose={() => {
            setIsBanModalOpen(false);
            setViewingUser(null);
          }}
          onSuccess={(msg) => {
            setActionMessage({ type: 'success', text: msg });
            setTimeout(() => setActionMessage(null), 3500);
            fetchUsers();
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateUserModal
          packages={allPackages}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchUsers(true)}
        />
      )}
    </div>
  );
}
