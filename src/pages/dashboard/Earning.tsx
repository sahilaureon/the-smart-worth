import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  TrendingUp,
  Users,
  Copy,
  Check,
  CreditCard,
  Landmark,
  QrCode,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Percent,
  IndianRupee,
  AlertCircle,
  X,
  Download,
  Share2,
  Shield,
  RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency, cn } from '../../lib/utils';
import { useAuth } from '../../App';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import { fetchApi } from '../../lib/api';
import LoadingScreen from '../../components/LoadingScreen';

const Earning = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [referralCodes, setReferralCodes] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState<any>(null);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // New Code Form State
  const [newCodeName, setNewCodeName] = useState('');
  const [earningPercent, setEarningPercent] = useState(60);
  const [creatingCode, setCreatingCode] = useState(false);
  const [codeModalError, setCodeModalError] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawModalError, setWithdrawModalError] = useState<string | null>(null);

  // Method Form State
  const [methodType, setMethodType] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    ifsc: '',
    bank_name: '',
    holder_name: ''
  });
  const [savingMethod, setSavingMethod] = useState(false);
  const [methodModalError, setMethodModalError] = useState<string | null>(null);

  const fetchReferralCodes = async () => {
    if (!user) return;
    try {
      const response = await fetchApi(`/referral-codes/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferralCodes(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.warn('[Earning] Error fetching referral codes:', err);
    }
  };

  const fetchPayouts = async () => {
    if (!user) return;
    try {
      const response = await fetchApi(`/payouts/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayouts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[Earning] Error fetching payouts:', err);
    }
  };

  const fetchWithdrawalMethods = async () => {
    if (!user) return;
    try {
      const response = await fetchApi(`/withdrawal-methods/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setWithdrawalMethods(list);
        if (list.length > 0 && !selectedMethodId) {
          setSelectedMethodId(list[0].id);
        }
      }
    } catch (err) {
      console.warn('[Earning] Error fetching withdrawal methods:', err);
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;
    setLoadingReferrals(true);
    try {
      const response = await fetchApi(`/referrals/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferrals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[Earning] Error fetching referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let profileData: any = null;

      // 1. Try specific user profile by ID
      try {
        const response = await fetchApi(`/profile/${user.id}`);
        if (response.ok) {
          profileData = await response.json();
        }
      } catch (pErr) {
        console.warn('[Earning] Direct profile fetch notice:', pErr);
      }

      // 2. Try current authenticated session profile
      if (!profileData) {
        try {
          const generalResponse = await fetchApi('/profile');
          if (generalResponse.ok) {
            profileData = await generalResponse.json();
          }
        } catch {}
      }

      // 3. Fallback to current authenticated user state
      if (!profileData) {
        profileData = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.full_name || user.email?.split('@')[0] || 'Member',
          wallet_balance: Number(user.wallet_balance || 0),
          pending_balance: Number(user.pending_balance || 0),
          approved_balance: Number(user.approved_balance || 0),
          total_earned: Number(user.total_earned || 0),
          package_id: user.package_id || 'silver',
          referral_code: user.referral_code || null
        };
      }

      setUserData(profileData);

      // Fetch supplementary earning items concurrently and safely
      await Promise.allSettled([
        fetchReferralCodes(),
        fetchPayouts(),
        fetchWithdrawalMethods(),
        fetchReferrals()
      ]);
      setError(null);
    } catch (err: any) {
      console.warn('[Earning] Notice in fetchUserData:', err);
      setUserData((prev: any) => prev || {
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || 'Member',
        wallet_balance: 0,
        pending_balance: 0,
        approved_balance: 0,
        total_earned: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
    const onReload = () => {
      if (user) fetchUserData();
    };
    window.addEventListener('app-fast-reload', onReload);
    return () => window.removeEventListener('app-fast-reload', onReload);
  }, [user]);

  const handleCreateCode = async () => {
    setCodeModalError(null);
    if (!newCodeName || newCodeName.trim().length < 4) {
      setCodeModalError('Referral code must be at least 4 characters.');
      return;
    }

    if (!user) {
      setCodeModalError('User session not found. Please log in again.');
      return;
    }

    setCreatingCode(true);
    try {
      const discount = 70 - earningPercent;
      const response = await fetchApi('/referral-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: newCodeName.toUpperCase().trim().replace(/\s+/g, ''),
          earning_percent: earningPercent,
          discount_percent: discount
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setCodeModalError(errData.error || 'This referral code is not available. Please choose another code.');
        return;
      }

      setShowCreateModal(false);
      setNewCodeName('');
      setEarningPercent(60);
      await fetchReferralCodes();
      setFeedback({ type: 'success', text: 'Referral code saved successfully.' });
    } catch (err: any) {
      setCodeModalError(err?.message || 'Failed to save referral code. Please try another code.');
    } finally {
      setCreatingCode(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!deleteCodeId) return;
    try {
      const response = await fetchApi(`/referral-codes/${deleteCodeId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete code');
      await fetchReferralCodes();
      setDeleteCodeId(null);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete code.' });
    }
  };

  const getReferralLink = (code: string) => {
    return `${window.location.origin}/register?ref=${code}`;
  };

  const handleCopy = (code: string) => {
    const link = getReferralLink(code);
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadQRCode = (code: string) => {
    const svg = document.getElementById(`qr-${code}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${code}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const handleWithdraw = async () => {
    setWithdrawModalError(null);
    if (!user || !userData) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawModalError('Please enter a valid withdrawal amount.');
      return;
    }
    if (amount > (userData.wallet_balance || 0)) {
      setWithdrawModalError('Insufficient withdrawable wallet balance.');
      return;
    }
    if (!selectedMethodId) {
      setWithdrawModalError('Please select a payout method.');
      return;
    }

    const method = withdrawalMethods.find((m) => m.id === selectedMethodId);
    if (!method) return;

    setIsWithdrawing(true);
    try {
      const response = await fetchApi('/payouts', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          method: method.type,
          details: method.details
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit withdrawal');
      }

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setFeedback({ type: 'success', text: 'Withdrawal request submitted successfully.' });
      await Promise.all([fetchPayouts(), fetchUserData()]);
    } catch (err: any) {
      console.error('Error submitting withdrawal:', err);
      setWithdrawModalError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSaveMethod = async () => {
    setMethodModalError(null);
    if (!user) return;
    if (methodType === 'upi' && !upiId.trim()) {
      setMethodModalError('Please enter a valid UPI ID.');
      return;
    }
    if (
      methodType === 'bank' &&
      (!bankDetails.holder_name.trim() ||
        !bankDetails.account_number.trim() ||
        !bankDetails.ifsc.trim() ||
        !bankDetails.bank_name.trim())
    ) {
      setMethodModalError('Please fill in all bank account details.');
      return;
    }

    setSavingMethod(true);
    try {
      const details = methodType === 'upi' ? { upi_id: upiId.trim() } : bankDetails;
      const response = await fetchApi('/withdrawal-methods', {
        method: 'POST',
        body: JSON.stringify({
          type: methodType,
          details
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save withdrawal method');
      }

      setShowMethodModal(null);
      setUpiId('');
      setBankDetails({ account_number: '', ifsc: '', bank_name: '', holder_name: '' });
      await fetchWithdrawalMethods();
      setFeedback({ type: 'success', text: 'Payout method saved successfully.' });
    } catch (err: any) {
      console.error('Exception saving method:', err);
      setMethodModalError(err.message || 'Failed to save payout method.');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleDeleteMethod = async () => {
    if (!deleteMethodId) return;
    try {
      const response = await fetchApi(`/withdrawal-methods/${deleteMethodId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete method');
      await fetchWithdrawalMethods();
      setDeleteMethodId(null);
    } catch (err: any) {
      console.error('Error deleting method:', err);
      setFeedback({ type: 'error', text: err.message || 'Failed to delete payout method.' });
    }
  };

  if (loading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="space-y-6">
      {/* Classic Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Earnings &amp; Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your referral commissions, manage links, and request instant payouts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchUserData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-indigo-600', loading && 'animate-spin')} />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethodModalError(null);
              setShowMethodModal({ type: 'upi' });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={15} className="text-indigo-600" />
            <span>Add Payout Method</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setWithdrawModalError(null);
              setShowWithdrawModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Wallet size={15} />
            <span>Withdraw Funds</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-700">
          <Shield className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Connection Issue Detected</p>
            <p className="text-red-600 mt-0.5">
              We&apos;re having trouble connecting to the server. Please try reloading the page.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Classic Wallet Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Balance
            </p>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(userData?.pending_balance || 0)}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Approved Balance
            </p>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(userData?.approved_balance || 0)}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Withdrawable
            </p>
            <Wallet size={16} className="text-indigo-600" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(userData?.wallet_balance || 0)}
            </p>
            <button
              type="button"
              onClick={() => {
                setWithdrawModalError(null);
                setShowWithdrawModal(true);
              }}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Earned
            </p>
            <TrendingUp size={16} className="text-slate-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(userData?.total_earned || 0)}
          </p>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Referral Codes & Referrals List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Codes Card */}
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Referral Codes</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Generate and manage your custom referral discount links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCodeModalError(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-3.5 py-2 rounded-md transition-colors font-semibold text-xs sm:text-sm shadow-2xs whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Plus size={16} />
                <span>New Code</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {referralCodes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                  <QrCode className="mx-auto mb-2 text-slate-400" size={32} />
                  <p className="text-slate-600 font-semibold text-sm">
                    No referral codes generated yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click &quot;New Code&quot; above to create your first referral link.
                  </p>
                </div>
              ) : (
                referralCodes.map((code) => (
                  <div
                    key={code.id}
                    className="bg-slate-50/70 border border-slate-200 p-4 rounded-lg flex flex-col gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                          {code.code.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-base tracking-wide text-slate-900 font-mono">
                            {code.code}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              My Earning: {code.earning_percent || 60}%
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                              Customer Discount: {70 - (code.earning_percent || 60)}%
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              Company Share: 30%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(code.code)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 px-3.5 py-2 rounded-md transition-colors text-xs font-semibold shadow-2xs cursor-pointer"
                        >
                          {copiedCode === code.code ? <Check size={14} /> : <Share2 size={14} />}
                          <span>{copiedCode === code.code ? 'Copied' : 'Copy Link'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQRModal(code)}
                          className="p-2 rounded-md bg-white text-slate-700 hover:bg-slate-100 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                          title="Show QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCodeId(code.id)}
                          className="p-2 rounded-md bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                          title="Delete Code"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp size={13} className="text-indigo-600" />
                        <span>{code.clicks || 0} Clicks</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} className="text-emerald-600" />
                        <span>{code.enrollments || code.usage_count || 0} Enrollments</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                        <span>Earnings: ₹{(code.total_earnings || 0).toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary Footer Bar */}
            <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-lg font-bold text-slate-900">
                  {referralCodes.reduce((acc, curr) => acc + (curr.clicks || 0), 0)}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Total Clicks
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-lg font-bold text-slate-900">
                  {referralCodes.reduce((acc, curr) => acc + (curr.enrollments || 0), 0)}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Conversions
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(userData?.total_earned || 0)}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Earned
                </p>
              </div>
            </div>
          </div>

          {/* My Referrals List */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">My Referrals</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Members who enrolled using your referral link.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                {referrals.length} Total
              </span>
            </div>

            <div className="mt-4">
              {loadingReferrals ? (
                <LoadingScreen fullScreen={false} />
              ) : referrals.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 border border-slate-200 rounded-lg">
                  <Users className="mx-auto mb-2 text-slate-400" size={32} />
                  <p className="text-sm text-slate-600 font-semibold">
                    No referrals yet. Share your referral link to start earning!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedReferral(referral)}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {referral.profile_pic ? (
                            <img
                              src={optimizeCloudinaryUrl(referral.profile_pic, 128, 128)}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold text-sm">
                              {referral.full_name?.substring(0, 1)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {referral.full_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {referral.packages?.name || 'No Package'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[11px] text-slate-400 font-medium">Joined</p>
                          <p className="text-xs font-semibold text-slate-700">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payout Accounts & Withdrawal History */}
        <div className="space-y-6">
          {/* Payout Accounts Card */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Payout Accounts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Saved UPI &amp; Bank methods</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMethodModalError(null);
                  setShowMethodModal({ type: 'upi' });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {withdrawalMethods.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg">
                  <CreditCard className="mx-auto mb-2 text-slate-400" size={26} />
                  <p className="text-xs text-slate-600 font-semibold">
                    No payout methods added yet.
                  </p>
                </div>
              ) : (
                withdrawalMethods.map((method) => (
                  <div
                    key={method.id}
                    className="w-full p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                        {method.type === 'upi' ? <QrCode size={17} /> : <Landmark size={17} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 leading-tight">
                          {method.type === 'upi' ? 'UPI ID' : 'Bank Account'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {method.type === 'upi'
                            ? method.details.upi_id
                            : `${method.details.bank_name} · ${method.details.account_number}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteMethodId(method.id)}
                      className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer shrink-0"
                      title="Remove Payout Method"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Withdrawal History Card */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock size={16} className="text-slate-500" />
                <span>Withdrawal History</span>
              </h3>
            </div>

            <div className="mt-4 space-y-2.5">
              {payouts.length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-semibold">No withdrawal history yet</p>
                </div>
              ) : (
                payouts.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border',
                        w.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : w.status === 'approved' || w.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                    >
                      {w.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2.5">
              <AlertCircle size={15} className="text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Withdrawals are verified and processed within 24–48 business hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classic Delete Method Confirmation Modal */}
      <AnimatePresence>
        {deleteMethodId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteMethodId(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mx-auto border border-red-200">
                  <Trash2 size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Remove Payout Method?</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  This payout method will be removed from your account.
                </p>
              </div>
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteMethodId(null)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMethod}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white border border-red-700 font-semibold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Referral Detail Modal */}
      <AnimatePresence>
        {selectedReferral && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReferral(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-slate-200 shrink-0">
                    {selectedReferral.profile_pic ? (
                      <img
                        src={selectedReferral.profile_pic}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {selectedReferral.full_name?.substring(0, 1)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedReferral.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      @{selectedReferral.username || 'member'} ·{' '}
                      {selectedReferral.packages?.name || 'No Package'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReferral(null)}
                  className="p-1.5 rounded-md bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-1">
                      {selectedReferral.email || 'Not provided'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                      {selectedReferral.mobile || 'Not provided'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Location
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                      {selectedReferral.city && selectedReferral.state
                        ? `${selectedReferral.city}, ${selectedReferral.state}`
                        : selectedReferral.city || selectedReferral.state || 'Not provided'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Enrolled On
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                      {new Date(selectedReferral.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReferral(null)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Withdraw Funds Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Withdraw Funds</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Available to Withdraw:{' '}
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(userData?.wallet_balance || 0)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1.5 rounded-md bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {withdrawModalError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {withdrawModalError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <IndianRupee size={16} />
                    </div>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none font-semibold text-sm text-slate-900"
                    />
                  </div>
                  {parseFloat(withdrawAmount) > (userData?.wallet_balance || 0) && (
                    <p className="text-xs font-semibold text-red-600 mt-1">
                      Amount exceeds available balance.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Payout Method
                  </label>
                  {withdrawalMethods.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWithdrawModal(false);
                        setMethodModalError(null);
                        setShowMethodModal({ type: 'upi' });
                      }}
                      className="w-full py-3 px-4 rounded-md border border-dashed border-slate-300 bg-slate-50 text-indigo-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      + Add Payout Method
                    </button>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedMethodId}
                        onChange={(e) => setSelectedMethodId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none font-medium text-sm text-slate-900 appearance-none cursor-pointer pr-9"
                      >
                        {withdrawalMethods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.type === 'upi'
                              ? `UPI: ${m.details.upi_id}`
                              : `Bank: ${m.details.bank_name} (${m.details.account_number})`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={
                    isWithdrawing ||
                    !selectedMethodId ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > (userData?.wallet_balance || 0)
                  }
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-semibold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Payout Details Modal */}
      <AnimatePresence>
        {showMethodModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMethodModal(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Payout Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add your UPI ID or Bank Account for receiving payouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMethodModal(null)}
                  className="p-1.5 rounded-md bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {methodModalError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {methodModalError}
                  </div>
                )}

                {/* Classic Segmented Control */}
                <div className="flex p-1 bg-slate-100 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMethodType('upi')}
                    className={cn(
                      'flex-1 py-2 rounded text-xs font-semibold transition-colors cursor-pointer',
                      methodType === 'upi'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    )}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethodType('bank')}
                    className={cn(
                      'flex-1 py-2 rounded text-xs font-semibold transition-colors cursor-pointer',
                      methodType === 'bank'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    )}
                  >
                    Bank Transfer
                  </button>
                </div>

                {methodType === 'upi' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500">
                      Enter a valid UPI ID linked to your bank account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.holder_name}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, holder_name: e.target.value })
                        }
                        placeholder="Your official name"
                        className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankDetails.account_number}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, account_number: e.target.value })
                        }
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={bankDetails.ifsc}
                          onChange={(e) =>
                            setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })
                          }
                          placeholder="SBIN0001234"
                          className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none text-sm text-slate-900 uppercase placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankDetails.bank_name}
                          onChange={(e) =>
                            setBankDetails({ ...bankDetails, bank_name: e.target.value })
                          }
                          placeholder="State Bank of India"
                          className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMethodModal(null)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMethod}
                  disabled={
                    savingMethod ||
                    (methodType === 'upi' ? !upiId.trim() : !bankDetails.account_number.trim())
                  }
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-semibold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Save Payout Method
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Delete Code Confirmation Modal */}
      <AnimatePresence>
        {deleteCodeId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCodeId(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mx-auto border border-red-200">
                  <AlertCircle size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Delete Referral Code?</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  This referral code will be deactivated and removed from your list.
                </p>
              </div>
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteCodeId(null)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCode}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white border border-red-700 font-semibold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Create Referral Code Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Referral Code</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize your friend&apos;s discount and your commission rate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-md bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {codeModalError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {codeModalError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Custom Code Name
                  </label>
                  <input
                    type="text"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                    placeholder="E.G. SMART20"
                    className="w-full px-3.5 py-2.5 rounded-md bg-white border border-slate-300 focus:border-indigo-600 transition-colors outline-none font-bold text-sm text-slate-900 uppercase tracking-wider placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      My Earning Percentage
                    </label>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-mono">
                      {earningPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="51"
                    max="70"
                    step="1"
                    value={earningPercent}
                    onChange={(e) => setEarningPercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>51% Minimum</span>
                    <span>70% Maximum</span>
                  </div>
                </div>

                {/* The Smart Worth 3-Way Automatic Revenue Distribution */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Revenue Distribution (Guaranteed 100%)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] text-slate-500 font-semibold">My Earning</p>
                      <p className="text-base font-extrabold text-emerald-600">{earningPercent}%</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] text-slate-500 font-semibold">Friend Discount</p>
                      <p className="text-base font-extrabold text-indigo-600">{70 - earningPercent}%</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <p className="text-[11px] text-slate-500 font-semibold">Company Share</p>
                      <p className="text-base font-extrabold text-slate-800">30%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>Model: Fixed 30% Company</span>
                    <span className="text-emerald-700 font-bold">Total: {earningPercent + (70 - earningPercent) + 30}%</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCode}
                  disabled={creatingCode}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-semibold text-xs sm:text-sm transition-colors shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Generate Link</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Referral QR Code</h3>
                <button
                  type="button"
                  onClick={() => setShowQRModal(null)}
                  className="p-1.5 rounded-md bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 inline-block shadow-2xs">
                  <QRCodeSVG
                    id={`qr-${showQRModal.code}`}
                    value={getReferralLink(showQRModal.code)}
                    size={168}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div>
                  <p className="text-base font-bold text-slate-900 tracking-wider uppercase font-mono">
                    {showQRModal.code}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 break-all bg-slate-50 p-2 rounded border border-slate-200">
                    {getReferralLink(showQRModal.code)}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCopy(showQRModal.code)}
                  className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-md transition-colors text-xs font-semibold border border-slate-300 shadow-2xs cursor-pointer"
                >
                  <Copy size={14} />
                  <span>{copiedCode === showQRModal.code ? 'Copied' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadQRCode(showQRModal.code)}
                  className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-md transition-colors text-xs font-semibold border border-indigo-700 shadow-2xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download QR</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Earning;
