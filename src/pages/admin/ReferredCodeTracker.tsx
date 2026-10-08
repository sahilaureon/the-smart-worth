import React, { useState, useEffect } from 'react';
import {
  Share2,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Calendar,
  Package,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Percent,
  Database,
  Code2,
  FileText,
  Download,
  X,
  AlertCircle,
  Eye,
  ArrowUpRight,
  BadgeCheck,
  Phone,
  Mail,
  Wallet,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';

interface ReferrerUser {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  tsw_id?: string;
  package_id?: string;
  package_name?: string;
  avatar_url?: string;
  wallet_balance?: number;
  approved_balance?: number;
  total_earned?: number;
  created_at?: string;
}

interface ReferredStudent {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  tsw_id?: string;
  registered_at: string;
  package_id?: string;
  package_name?: string;
  original_amount?: number;
  customer_discount_percent?: number;
  customer_discount_amount?: number;
  customer_payable_amount?: number;
  amount_paid: number;
  company_percent?: number;
  company_amount?: number;
  rate_percent: number;
  commission_credited: number;
  order_id?: string;
  payment_id?: string;
  status: string;
}

interface ReferralCodeItem {
  code: string;
  referrer: ReferrerUser;
  company_percent?: number;
  discount_percent: number;
  earning_percent: number;
  clicks: number;
  conversions: number;
  total_sales: number;
  total_commission: number;
  created_at?: string;
  is_active: boolean;
  referred_users_count: number;
}

interface TrackerSummary {
  total_codes: number;
  active_codes: number;
  total_conversions: number;
  total_volume_generated: number;
  total_commission_credited: number;
}

export default function ReferredCodeTracker() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TrackerSummary>({
    total_codes: 0,
    active_codes: 0,
    total_conversions: 0,
    total_volume_generated: 0,
    total_commission_credited: 0
  });
  const [codes, setCodes] = useState<ReferralCodeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageFilter, setSelectedPackageFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Detail Modal State
  const [selectedCodeDetail, setSelectedCodeDetail] = useState<{
    code_info: ReferralCodeItem;
    referrer_profile: ReferrerUser;
    referred_users: ReferredStudent[];
    calculator_breakdown: any;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // SQL Script Modal State
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const fetchTrackerData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/referral-tracker');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setCodes(Array.isArray(data.codes) ? data.codes : []);
      }
    } catch (err) {
      console.error('Error fetching referral tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCodeDetails = async (codeStr: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetchApi(`/admin/referral-tracker/details/${encodeURIComponent(codeStr)}`);
      if (res.ok) {
        const detailData = await res.json();
        setSelectedCodeDetail(detailData);
      }
    } catch (err) {
      console.error('Error fetching code details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopy = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key || text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredCodes = codes.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.code.toLowerCase().includes(q) ||
      item.referrer?.full_name?.toLowerCase().includes(q) ||
      item.referrer?.email?.toLowerCase().includes(q) ||
      item.referrer?.tsw_id?.toLowerCase().includes(q) ||
      item.referrer?.package_name?.toLowerCase().includes(q);

    const matchesPackage =
      selectedPackageFilter === 'all' ||
      item.referrer?.package_id?.toLowerCase() === selectedPackageFilter.toLowerCase();

    return matchesQuery && matchesPackage;
  });

  const uniquePackages = Array.from(
    new Set(codes.map((c) => c.referrer?.package_id).filter(Boolean))
  );

  const supabaseSqlScript = `-- =========================================================================
-- THE SMART WORTH — REFERRAL SYSTEM & REAL COMMISSION CALCULATOR SCHEMA
-- Fixed 30% Company Share | 51%-70% Referrer Earning | Dynamic Package Pricing
-- Run this script in your Supabase SQL Editor to verify/apply complete schema
-- =========================================================================

-- 1. Create or update referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    company_percent NUMERIC NOT NULL DEFAULT 30 CHECK (company_percent = 30),
    earning_percent NUMERIC NOT NULL DEFAULT 60 CHECK (earning_percent >= 51 AND earning_percent <= 70),
    discount_percent NUMERIC NOT NULL DEFAULT 10 CHECK (discount_percent = 70 - earning_percent),
    is_active BOOLEAN DEFAULT TRUE,
    clicks INTEGER DEFAULT 0,
    enrollments INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create or update referrals conversion records table (Stores exact financial snapshots)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id),
    referred_id UUID REFERENCES auth.users(id),
    referred_user_id UUID,
    referred_email TEXT,
    referral_code TEXT,
    package_id TEXT REFERENCES public.packages(id),
    package_name TEXT,
    order_id TEXT,
    payment_id TEXT,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Original package price at purchase
    company_percent NUMERIC NOT NULL DEFAULT 30, -- Fixed 30% company share
    rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 60.00, -- Referrer earning % (51-70)
    customer_discount_percent NUMERIC NOT NULL DEFAULT 10.00, -- 70 - earning_percent
    customer_discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    customer_payable_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    company_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Duplicate Commission Protection: Unique indexes on successful transaction IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_order_id ON public.referrals (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_payment_id ON public.referrals (payment_id) WHERE payment_id IS NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Normal users can view their own referral codes and referrals
DROP POLICY IF EXISTS "Users can view own referral codes" ON public.referral_codes;
CREATE POLICY "Users can view own referral codes" ON public.referral_codes FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Public can view active referral codes" ON public.referral_codes;
CREATE POLICY "Public can view active referral codes" ON public.referral_codes FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own referral codes" ON public.referral_codes;
CREATE POLICY "Users can manage own referral codes" ON public.referral_codes FOR ALL 
USING (auth.uid() = user_id OR auth.uid() = creator_id)
WITH CHECK (
    (auth.uid() = user_id OR auth.uid() = creator_id) AND
    earning_percent >= 51 AND earning_percent <= 70 AND
    company_percent = 30 AND
    discount_percent = 70 - earning_percent
);

DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id);

-- Admins can view and audit all referral records
DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
CREATE POLICY "Admins can manage all referrals" ON public.referrals FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 5. Complete Query: Track any referral code and see all registered students & exact financial breakdown
-- Replace 'SAHI05F5' with your desired referral code to run a complete audit:
SELECT 
    r.referral_code,
    p_referrer.full_name AS referrer_name,
    p_referrer.email AS referrer_email,
    p_referred.full_name AS customer_name,
    p_referred.email AS customer_email,
    p_referred.mobile AS customer_mobile,
    p_referred.tsw_id AS customer_tsw_id,
    r.package_name,
    r.amount AS original_package_price,
    r.customer_discount_percent AS discount_percent,
    r.customer_discount_amount AS discount_amount,
    r.customer_payable_amount AS final_paid_amount,
    r.company_amount AS company_share_30_pct,
    r.rate_percent AS referrer_earning_pct,
    r.commission_amount AS referrer_commission_credited,
    r.order_id,
    r.payment_id,
    r.status,
    r.created_at AS transaction_date
FROM public.referrals r
LEFT JOIN public.profiles p_referred ON (p_referred.id = r.referred_user_id OR p_referred.id = r.referred_id)
LEFT JOIN public.profiles p_referrer ON p_referrer.id = r.referrer_id
WHERE UPPER(r.referral_code) = UPPER('SAHI05F5')
ORDER BY r.created_at DESC;
`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#615DFA] uppercase bg-[#615DFA]/10 px-2.5 py-0.5 rounded-full border border-[#615DFA]/20">
              Affiliate Engine 2.0
            </span>
            <span className="text-xs text-slate-500 font-mono">Dynamic Real Calculator</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Referred Code Tracker</span>
            <Share2 className="w-5 h-5 text-[#615DFA]" />
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Search any referral code to audit the owner&apos;s profile, commission percentages, exact balance credits, and track every student who registered using that code.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Database size={14} className="text-emerald-400" />
            <span>Supabase SQL Code</span>
          </button>
          <button
            type="button"
            onClick={fetchTrackerData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Top Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Referral Codes Active
            </p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#615DFA]">
              <Share2 size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {summary.active_codes} <span className="text-xs font-normal text-slate-400">/ {summary.total_codes} total</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Unlocked based on user packages</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Referred Registrations
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
            {summary.total_conversions}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Total students enrolled via code</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sales Volume Generated
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 tracking-tight">
            {formatCurrency(summary.total_volume_generated)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Gross package revenue from referrals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Commission Credited
            </p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Wallet size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-600 tracking-tight">
            {formatCurrency(summary.total_commission_credited)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Calculated via real rate % formula</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Code (e.g. SAHI05F5), Name, Email, or TSW ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleOpenCodeDetails(searchQuery.trim().toUpperCase());
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#615DFA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim()) {
                handleOpenCodeDetails(searchQuery.trim().toUpperCase());
              }
            }}
            disabled={!searchQuery.trim() || loadingDetail}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#615DFA] hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Direct Track Code Details"
          >
            <Eye size={14} />
            <span>Track Code</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedPackageFilter}
            onChange={(e) => setSelectedPackageFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#615DFA] cursor-pointer"
          >
            <option value="all">All Packages</option>
            {uniquePackages.map((pkgId) => (
              <option key={String(pkgId)} value={String(pkgId)}>
                Package: {String(pkgId).toUpperCase()}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-semibold px-2.5 py-1.5 bg-slate-100 rounded-lg whitespace-nowrap">
            {filteredCodes.length} {filteredCodes.length === 1 ? 'code' : 'codes'}
          </span>
        </div>
      </div>

      {/* Main Referral Codes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Referral Codes Directory</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Tracker
            </span>
          </h3>
          <p className="text-xs text-slate-500 hidden sm:block">
            Click &quot;Track Code&quot; to see all students who registered using that code
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <LoadingScreen fullScreen={false} />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Share2 size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Referral Codes Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No referral codes matched "${searchQuery}". Try searching by a different code or student email.`
                : 'No referral codes have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">Code Owner (Referrer)</th>
                  <th className="py-3 px-4 text-center">Rates (Disc / Comm)</th>
                  <th className="py-3 px-4 text-center">Conversions</th>
                  <th className="py-3 px-4 text-right">Volume Generated</th>
                  <th className="py-3 px-4 text-right">Total Commission</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filteredCodes.map((item) => {
                  const isCopied = copiedCode === item.code;
                  return (
                    <tr
                      key={item.code}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenCodeDetails(item.code)}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#615DFA] bg-[#615DFA]/10 px-2.5 py-1 rounded-lg border border-[#615DFA]/20 group-hover:bg-[#615DFA] group-hover:text-white transition-colors">
                            {item.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.code, item.code);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title="Copy Code"
                          >
                            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Code Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                            {item.referrer?.avatar_url ? (
                              <img
                                src={item.referrer.avatar_url}
                                alt={item.referrer.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (item.referrer?.full_name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {item.referrer?.full_name || 'Valued Member'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {item.referrer?.email || 'N/A'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.referrer?.tsw_id && (
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                                  {item.referrer.tsw_id}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded uppercase">
                                {item.referrer?.package_name || item.referrer?.package_id || 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rates */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          <span className="text-amber-700 font-bold text-[11px]">
                            {item.discount_percent}% Off
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-black text-[11px]">
                            {item.earning_percent}% Comm
                          </span>
                        </div>
                      </td>

                      {/* Conversions */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                            item.conversions > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          <Users size={12} />
                          <span>{item.conversions}</span>
                        </span>
                      </td>

                      {/* Volume Generated */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.total_sales)}
                      </td>

                      {/* Total Commission */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-emerald-600">
                          {formatCurrency(item.total_commission)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCodeDetails(item.code);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#615DFA] hover:bg-indigo-600 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Track Code</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL: Registered Students & Referrer Full Profile */}
      {selectedCodeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Share2 className="text-amber-400" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono tracking-widest text-indigo-300 font-bold">
                      Referred Code Tracker
                    </span>
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-amber-300">
                      {selectedCodeDetail.code_info.code}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedCodeDetail.code_info.code,
                          `modal-${selectedCodeDetail.code_info.code}`
                        )
                      }
                      className="text-white/60 hover:text-white p-1"
                      title="Copy code"
                    >
                      {copiedCode === `modal-${selectedCodeDetail.code_info.code}` ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCodeDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Referrer User Information Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={16} className="text-[#615DFA]" />
                    <span>Referrer User Profile (Code Owner)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {selectedCodeDetail.referrer_profile.id?.slice(0, 8)}...
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Full Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedCodeDetail.referrer_profile.full_name || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Email ID</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {selectedCodeDetail.referrer_profile.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Mobile Number</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedCodeDetail.referrer_profile.mobile || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Official TSW ID</p>
                    <p className="text-sm font-bold text-[#615DFA] font-mono mt-0.5">
                      {selectedCodeDetail.referrer_profile.tsw_id || 'TSW-STUDENT'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-200">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Enrolled Package
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 uppercase">
                      {selectedCodeDetail.referrer_profile.package_name ||
                        selectedCodeDetail.referrer_profile.package_id ||
                        'Active Package'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Total Commission Earned
                    </span>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">
                      {formatCurrency(selectedCodeDetail.referrer_profile.total_earned || 0)}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Withdrawable Wallet Balance
                    </span>
                    <p className="text-xs font-black text-indigo-600 mt-0.5">
                      {formatCurrency(selectedCodeDetail.referrer_profile.wallet_balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real Calculator Analysis Card */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-amber-50/30 border border-indigo-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-500" />
                    <span>Real Dynamic Commission Calculator Breakdown</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Formula: (Amount × {selectedCodeDetail.code_info.earning_percent}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Rate Percent</p>
                    <p className="text-lg font-black text-indigo-600 mt-0.5">
                      {selectedCodeDetail.code_info.earning_percent}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Conversions</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {selectedCodeDetail.referred_users.length}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Sales Generated</p>
                    <p className="text-lg font-black text-blue-600 mt-0.5">
                      {formatCurrency(selectedCodeDetail.code_info.total_sales)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Credited Balance</p>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">
                      {formatCurrency(selectedCodeDetail.code_info.total_commission)}
                    </p>
                  </div>
                </div>
              </div>

              {/* LIST OF ALL REGISTERED STUDENTS ("kis-kis bande ne register kiya hai") */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-[#615DFA]" />
                      <span>All Registered Students via This Code ({selectedCodeDetail.referred_users.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Details of every user who enrolled using referral code &quot;{selectedCodeDetail.code_info.code}&quot;
                    </p>
                  </div>
                </div>

                {selectedCodeDetail.referred_users.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <Users className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-xs font-bold text-slate-700">No Registrations Yet</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No students have registered using this referral code so far.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[950px]">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Customer / Student</th>
                            <th className="py-2.5 px-3">Package Enrolled</th>
                            <th className="py-2.5 px-3 text-right">Original Price</th>
                            <th className="py-2.5 px-3 text-right">Discount</th>
                            <th className="py-2.5 px-3 text-right">Customer Paid</th>
                            <th className="py-2.5 px-3 text-right">Company (30%)</th>
                            <th className="py-2.5 px-3 text-right">Commission</th>
                            <th className="py-2.5 px-3">Order / Payment ID</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                          {selectedCodeDetail.referred_users.map((student, idx) => {
                            const origPrice = Number(student.original_amount || student.amount_paid || 0);
                            const discountPct = Number(student.customer_discount_percent ?? (70 - (student.rate_percent || 60)));
                            const discountAmt = Number(student.customer_discount_amount ?? Math.round((origPrice * discountPct) / 100));
                            const customerPaid = Number(student.customer_payable_amount ?? student.amount_paid);
                            const companyAmt = Number(student.company_amount ?? Math.round(origPrice * 0.3));
                            const commAmt = Number(student.commission_credited ?? Math.round((origPrice * (student.rate_percent || 60)) / 100));

                            return (
                              <tr key={student.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                {/* Customer */}
                                <td className="py-3 px-3">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">
                                      {student.full_name || 'Student'}
                                    </p>
                                    <p className="text-[11px] text-slate-600 truncate">
                                      {student.email || 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                                        {student.tsw_id || 'TSW-STUDENT'}
                                      </span>
                                      {student.mobile && (
                                        <span className="text-[10px] text-slate-400">
                                          {student.mobile}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Package */}
                                <td className="py-3 px-3">
                                  <span className="font-bold uppercase text-[10px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">
                                    {student.package_name || student.package_id || 'Course Package'}
                                  </span>
                                </td>

                                {/* Original Price */}
                                <td className="py-3 px-3 text-right font-medium text-slate-500">
                                  {formatCurrency(origPrice)}
                                </td>

                                {/* Discount */}
                                <td className="py-3 px-3 text-right">
                                  {discountAmt > 0 ? (
                                    <div>
                                      <span className="font-bold text-indigo-600">
                                        -{formatCurrency(discountAmt)}
                                      </span>
                                      <span className="block text-[10px] text-slate-400">
                                        ({discountPct}%)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">0%</span>
                                  )}
                                </td>

                                {/* Customer Paid */}
                                <td className="py-3 px-3 text-right font-bold text-slate-900">
                                  {formatCurrency(customerPaid)}
                                </td>

                                {/* Company Share */}
                                <td className="py-3 px-3 text-right">
                                  <span className="font-bold text-slate-700">
                                    {formatCurrency(companyAmt)}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 font-semibold">
                                    (30%)
                                  </span>
                                </td>

                                {/* Commission */}
                                <td className="py-3 px-3 text-right">
                                  <span className="font-extrabold text-emerald-600">
                                    +{formatCurrency(commAmt)}
                                  </span>
                                  <span className="block text-[10px] font-bold text-purple-700">
                                    ({student.rate_percent || 60}%)
                                  </span>
                                </td>

                                {/* Order & Payment ID */}
                                <td className="py-3 px-3">
                                  <div className="font-mono text-[10px] text-slate-600 space-y-0.5">
                                    <p className="truncate max-w-[120px]" title={student.order_id || 'N/A'}>
                                      <span className="text-slate-400">Ord:</span> {student.order_id || 'N/A'}
                                    </p>
                                    <p className="truncate max-w-[120px]" title={student.payment_id || 'N/A'}>
                                      <span className="text-slate-400">Pay:</span> {student.payment_id || 'N/A'}
                                    </p>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <ShieldCheck size={11} />
                                    <span>{student.status === 'completed' || student.status === 'paid' ? 'Paid' : (student.status || 'Paid')}</span>
                                  </span>
                                </td>

                                {/* Date */}
                                <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap text-right">
                                  {student.registered_at
                                    ? new Date(student.registered_at).toLocaleString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : 'Recently'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Code: {selectedCodeDetail.code_info.code} · Total {selectedCodeDetail.referred_users.length} referrals
              </span>
              <button
                type="button"
                onClick={() => setSelectedCodeDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL SCRIPT MODAL ("Tum chahe to mere ko SQL code bhi de sakte ho") */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Supabase PostgreSQL SQL Script
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Copy and run in your Supabase SQL Editor to manage referral codes &amp; tracking
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto select-all">
                  {supabaseSqlScript}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Ready for Supabase SQL Editor
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(supabaseSqlScript);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check size={14} />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy SQL Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
