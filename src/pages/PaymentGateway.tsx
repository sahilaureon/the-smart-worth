import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Clock,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  LifeBuoy,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Hash,
  Loader2,
  HelpCircle,
  Sparkles,
  Info,
  Mail,
  Package,
  Send
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import RaiseTicketModal from '../components/RaiseTicketModal';
import BrutalistButton from '../components/BrutalistButton';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Retrieve state or URL params or cached session
  const stateData = (location.state as any) || {};
  const queryOrderId = searchParams.get('orderId') || searchParams.get('order_id') || '';
  const queryPackageId = searchParams.get('packageId') || searchParams.get('package_id') || '';
  const queryAmount = searchParams.get('amount') ? Number(searchParams.get('amount')) : null;

  // Retrieve stored order session if page was refreshed
  const getStoredOrder = () => {
    try {
      const saved = sessionStorage.getItem('tsw_active_payment_order');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  };
  const stored = getStoredOrder();

  const [orderId, setOrderId] = useState<string>(
    stateData.orderId || stateData.id || queryOrderId || stored?.orderId || ''
  );
  const [packageName, setPackageName] = useState<string>(
    stateData.packageName || stored?.packageName || 'VIP Learning Package'
  );
  const [packageId, setPackageId] = useState<string>(
    stateData.packageId || queryPackageId || stored?.packageId || 'silver'
  );
  const [amount, setAmount] = useState<number>(
    stateData.amount || queryAmount || stored?.amount || 599
  );
  const [originalPrice, setOriginalPrice] = useState<number>(
    stateData.originalPrice || stored?.originalPrice || (stateData.amount ? stateData.amount + 400 : 999)
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    stateData.discountAmount || stored?.discountAmount || Math.max(0, originalPrice - amount)
  );

  const [customerName, setCustomerName] = useState<string>(
    stateData.fullName || stateData.full_name || stored?.fullName || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    stateData.email || stored?.email || ''
  );
  const [customerMobile, setCustomerMobile] = useState<string>(
    stateData.mobile || stored?.mobile || ''
  );
  const [customerCity, setCustomerCity] = useState<string>(
    stateData.city || stored?.city || ''
  );
  const [customerState, setCustomerState] = useState<string>(
    stateData.state || stored?.state || ''
  );
  const [customerPinCode, setCustomerPinCode] = useState<string>(
    stateData.pinCode || stateData.pin_code || stored?.pinCode || ''
  );
  const [referralCode, setReferralCode] = useState<string>(
    stateData.referralCode || stored?.referralCode || ''
  );

  // 5-minute countdown (300 seconds) - DOES NOT reload page upon expiry so user paying at 4:59 succeeds
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const savedStart = sessionStorage.getItem(`tsw_timer_${orderId || 'default'}`);
      if (savedStart) {
        const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
        return Math.max(1, 300 - elapsed);
      }
    } catch {}
    return 300;
  });

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  // Verification & Status States
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // UTR manual check state
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrFeedback, setUtrFeedback] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Raise Ticket Modal state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [submittedTicketInfo, setSubmittedTicketInfo] = useState<any | null>(null);

  // UPI configuration (Official Axis Bank Razorpay Merchant VPA)
  const defaultUpiId = 'thesmartworth466963.rzp@axisbank';
  const merchantName = 'TheSmartWorth';

  // Construct UPI URI
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(defaultUpiId)}&pn=${encodeURIComponent(
    merchantName
  )}&mc=8241&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Pay via Razorpay')}&tr=${encodeURIComponent(orderId || 'TSW')}`;

  // Dynamic QR Code URL using high-speed QR generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  // Save current order into session storage for persistence on refresh
  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem(
        'tsw_active_payment_order',
        JSON.stringify({
          orderId,
          packageName,
          packageId,
          amount,
          originalPrice,
          discountAmount,
          fullName: customerName,
          email: customerEmail,
          mobile: customerMobile,
          city: customerCity,
          state: customerState,
          pinCode: customerPinCode,
          referralCode
        })
      );
      if (!sessionStorage.getItem(`tsw_timer_${orderId}`)) {
        sessionStorage.setItem(`tsw_timer_${orderId}`, String(Date.now()));
      }
    }
  }, [orderId, packageName, packageId, amount, originalPrice, discountAmount, customerName, customerEmail, customerMobile, customerCity, customerState, customerPinCode, referralCode]);

  // If no orderId was supplied, create one automatically
  useEffect(() => {
    if (!orderId) {
      const initOrder = async () => {
        try {
          const res = await fetchApi('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({
              package_id: packageId || 'silver',
              package_name: packageName,
              amount: amount,
              email: customerEmail || 'student@thesmartworth.site',
              full_name: customerName,
              mobile: customerMobile,
              city: customerCity,
              state: customerState,
              pin_code: customerPinCode,
              referral_code: referralCode,
              is_pre_signup: true
            })
          });
          const data = await res.json();
          if (data?.id) {
            setOrderId(data.id);
            if (data.amount) setAmount(Math.round(data.amount / 100) || amount);
          }
        } catch {
          const fallbackId = `order_demo_${Date.now()}`;
          setOrderId(fallbackId);
        }
      };
      void initOrder();
    }
  }, [orderId, packageId, packageName, amount, customerEmail, customerName, customerMobile, customerCity, customerState, customerPinCode, referralCode]);

  // Timer countdown
  useEffect(() => {
    if (isPaid) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Keep at 1 second so page NEVER auto-reloads or cancels, allowing user at 4:59 to pay
          return 1;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaid]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Poll payment verification status silently every 2.5 seconds
  const checkStatus = useCallback(async () => {
    if (!orderId || isPaid) return;
    try {
      const res = await fetchApi(`/payment/status/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.status === 'paid') {
          setIsPaid(true);
          setPaymentReceipt({
            paymentId: data.razorpay_payment_id || `PAY_${Date.now()}`,
            orderId: orderId,
            invoice: data.invoice
          });
          sessionStorage.removeItem('tsw_active_payment_order');
        }
      }
    } catch {}
  }, [orderId, isPaid]);

  useEffect(() => {
    if (isPaid || !orderId) return;
    const pollInterval = setInterval(() => {
      void checkStatus();
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [checkStatus, isPaid, orderId]);

  // Instant auto-verify check whenever user returns from UPI app to browser
  useEffect(() => {
    if (isPaid || !orderId) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void checkStatus();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isPaid, orderId, checkStatus]);

  // Manual UTR submission
  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = utrInput.trim().replace(/\s+/g, '');
    if (!clean || clean.length < 6) {
      setUtrFeedback({
        type: 'error',
        text: 'Please enter a valid 12-digit UTR or Transaction Reference number.'
      });
      return;
    }

    setSubmittingUtr(true);
    setUtrFeedback(null);

    try {
      const res = await fetchApi('/payment/verify-utr', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          utr_number: clean,
          email: customerEmail
        })
      });

      const data = await res.json();
      if (data?.status === 'paid') {
        setIsPaid(true);
        setPaymentReceipt({
          paymentId: data.payment_id || `UTR_${clean}`,
          orderId
        });
        setUtrFeedback({
          type: 'success',
          text: 'Payment verified successfully! Welcome to The Smart Worth.'
        });
      } else {
        setUtrFeedback({
          type: 'info',
          text: 'UTR registered! Verification in progress. If not confirmed in 2 minutes, click "Raise a Ticket" below to attach your screenshot.'
        });
      }
    } catch (err: any) {
      setUtrFeedback({
        type: 'error',
        text: err.message || 'Verification could not be checked. Please try again or Raise a Ticket.'
      });
    } finally {
      setSubmittingUtr(false);
    }
  };

  const copyToClipboard = (text: string, type: 'upi' | 'amount' | 'order') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 300) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF] text-slate-900 font-sans selection:bg-[#615DFA] selection:text-white">
      <SEO
        title="Secure Payment Gateway — The Smart Worth"
        description="Fast and secure UPI payment gateway for course enrollments. Instant verification via UPI apps."
      />

      {/* Website Official Header */}
      <Navbar />

      {/* Main Payment Section */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Breadcrumb / Security Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900">
                    The Smart Worth Pay
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-md">
                    256-Bit SSL
                  </span>
                </div>
                <p className="text-xs text-slate-500">Official Direct Payment Gateway • Instant Activation</p>
              </div>
            </div>

            {/* Order & Amount Pill */}
            <div className="flex items-center gap-3 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {orderId ? `#${orderId.slice(-8).toUpperCase()}` : 'Generating...'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <span className="text-slate-500 block text-[11px]">Payable Amount:</span>
                <span className="font-black text-emerald-600 text-sm">₹{amount}</span>
              </div>
            </div>
          </div>

          {/* 5-Minute Countdown Timer Banner */}
          {!isPaid && (
            <div className="relative overflow-hidden bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_0px_#0f172a]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-indigo-100 text-indigo-700 border-indigo-300'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Session Active For
                      </span>
                      <span className={`font-mono text-base font-black ${timeLeft < 60 ? 'text-red-600' : 'text-[#615DFA]'}`}>
                        {formatTimer(timeLeft)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Payment stays valid for full 5 minutes. Even if you complete payment at <strong>4 min 59 sec</strong>, your payment will succeed smoothly.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Auto-Detection Live</span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-red-500' : 'bg-[#615DFA]'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Main Grid: Payment Details vs QR Scanner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Order Summary & Customer Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0f172a] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-base text-slate-900">Package Summary</h2>
                  <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                    Lifetime Access
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{packageName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Comprehensive Career &amp; Skill Development</p>
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Original Price:</span>
                    <span className="line-through">₹{originalPrice}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount / Offer Applied:</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">Total Payable:</span>
                    <span className="font-black text-xl text-slate-900">₹{amount}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Name:</span>
                    <span className="font-semibold text-slate-800">{customerName || 'Student'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Email:</span>
                    <span className="font-medium text-slate-800">{customerEmail || 'Not specified'}</span>
                  </div>
                  {customerMobile && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile:</span>
                      <span className="font-medium text-slate-800">+91 {customerMobile}</span>
                    </div>
                  )}
                  {(customerCity || customerState) && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-medium text-slate-800">
                        {[customerCity, customerState].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>100% Payment Protection Guarantee</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every transaction is encrypted. If money is deducted from your bank and not updated automatically, our Payment Helper team will verify your UTR and activate your package within minutes.
                </p>
              </div>
            </div>

            {/* Right Column: QR Code & UPI Apps */}
            <div className="lg:col-span-7 space-y-4">
              {isPaid ? (
                /* Payment Success View */
                <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-[4px_4px_0px_0px_#0f172a]">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center justify-center text-emerald-600 shadow-[3px_3px_0px_0px_#059669]">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full mb-2">
                      Payment Successful &amp; Verified
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Welcome to {packageName}!
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Your enrollment has been activated. An official tax receipt has been generated for your purchase.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl max-w-sm mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-900">{paymentReceipt?.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono text-slate-700">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-black text-emerald-600 text-sm">₹{amount}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <a
                      href={`/api/payment/receipt-pdf/${orderId}?payment_id=${paymentReceipt?.paymentId || ''}`}
                      download={`TheSmartWorth-Receipt-${orderId}.pdf`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-white font-bold text-xs sm:text-sm text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>Download Receipt PDF</span>
                    </a>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-slate-900 bg-[#615DFA] font-bold text-xs sm:text-sm text-white shadow-[2px_2px_0px_0px_#0f172a] hover:bg-[#504bd6] transition-all cursor-pointer"
                    >
                      <span>Proceed to Student Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Active Payment View — Exact Match to Screenshot */
                <div className="bg-white border-[2.5px] border-[#0066FF] rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-4 text-center">
                  {/* QR Code Section */}
                  <div className="space-y-2">
                    <div className="inline-block p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <img
                        src={qrCodeUrl}
                        alt="The Smart Worth UPI QR Code"
                        className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg">
                        Scan QR Code &amp; Pay
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Use any UPI App to pay
                      </p>
                    </div>

                    <a
                      href={qrCodeUrl}
                      download={`TheSmartWorthPay-QR-${orderId.slice(-6)}.png`}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#EBF3FF] hover:bg-[#DCEBFF] text-[#0066FF] font-bold text-xs sm:text-sm transition cursor-pointer"
                    >
                      <Download size={15} strokeWidth={2.5} />
                      <span>Download QR Code</span>
                    </a>
                  </div>

                  {/* Information Ledger Box */}
                  <div className="bg-[#F6F9FF] border border-blue-100 rounded-2xl p-3.5 space-y-2.5 text-left">
                    {/* Amount to Pay */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#DDEBFF] text-[#0066FF] flex items-center justify-center font-black text-sm shrink-0">
                          ₹
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">Amount to Pay</div>
                          <div className="text-[10px] text-slate-500">Fixed amount (Exact only)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#EBF3FF] border border-[#CCE0FF] text-[#0066FF] font-black text-sm sm:text-base px-2.5 py-1 rounded-lg">
                        <span>₹ {Number(amount).toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(amount), 'amount')}
                          className="p-1 hover:text-blue-800 transition cursor-pointer"
                          title="Copy Amount"
                        >
                          {copiedAmount ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Invoice */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">Invoice</div>
                          <div className="text-[10px] text-slate-500">Auto-selected from your email</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#EDF2F7] border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg max-w-[170px] truncate">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{customerEmail || 'yourname@gmail.com'}</span>
                        <Lock size={12} className="text-slate-400 shrink-0 ml-auto" />
                      </div>
                    </div>

                    {/* Order ID */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                          <Package size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">Order ID</div>
                          <div className="text-[10px] text-slate-500">Use this for support</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#EDF2F7] border border-slate-200 font-mono font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg">
                        <span className="truncate max-w-[120px]">{orderId || 'TSW7829354201'}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderId, 'order')}
                          className="p-1 hover:text-slate-600 transition cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedOrder ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Action Button: "Pay Now (Open UPI App)" */}
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(defaultUpiId, 'upi');
                      window.location.href = upiIntentUri;
                      setTimeout(() => void checkStatus(), 1800);
                    }}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-blue-500/25 active:scale-[0.99] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Send size={18} className="rotate-[-20deg]" />
                      <span>Pay Now (Open UPI App)</span>
                    </div>
                    <ArrowRight size={20} />
                  </button>

                  {/* Payment Applications Logos Row (Static display badges only as requested) */}
                  <div className="flex items-center justify-around py-1 px-2 select-none pointer-events-none">
                    {/* Google Pay */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-6 flex items-center justify-center">
                        <span className="font-black text-sm tracking-tight text-[#4285F4]">G<span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span> <span className="text-slate-700">Pay</span></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">Google Pay</span>
                    </div>

                    {/* PhonePe */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        पे
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">PhonePe</span>
                    </div>

                    {/* Paytm */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-6 px-1.5 rounded-md bg-[#002e6e] text-[#00baf2] flex items-center justify-center font-black text-[9px] shadow-2xs">
                        paytm
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">Paytm</span>
                    </div>

                    {/* BHIM UPI */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-xs font-black italic tracking-tighter text-[#0f7c35]">BHIM</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">BHIM UPI</span>
                    </div>
                  </div>

                  {/* Bottom "Payment Not Received?" Helper Box */}
                  <div className="bg-[#F0F6FF] border border-[#CCE0FF] rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0 mt-0.5">
                        <Info size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          Payment Not Received?
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          If you have paid but not verified after few minutes, you can raise a ticket for manual verification.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTicketModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 text-[#0066FF] border-2 border-[#0066FF] font-black text-xs rounded-xl shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <LifeBuoy size={14} strokeWidth={2.5} />
                      <span>Raise a Ticket</span>
                    </button>
                  </div>

                  {/* Manual 12-Digit UTR Number Verification Box */}
                  <div className="pt-2 border-t border-slate-100 text-left">
                    <form onSubmit={handleVerifyUtr} className="space-y-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        Paid Already? Enter 12-Digit UTR / Ref Number:
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            maxLength={20}
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
                            placeholder="e.g. 528392019481"
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0066FF] focus:bg-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingUtr}
                          className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {submittingUtr ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify UTR'}
                        </button>
                      </div>

                      {utrFeedback && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-semibold flex items-start space-x-2 ${
                            utrFeedback.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : utrFeedback.type === 'error'
                              ? 'bg-red-50 text-red-800 border border-red-300'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-300'
                          }`}
                        >
                          <Info className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{utrFeedback.text}</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DEDICATED "RAISE A TICKET" SECTION RIGHT BELOW PAYMENT */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-slate-900 rounded-2xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_#0f172a] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-amber-400 border-2 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] shrink-0">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 rounded-md">
                  Payment Helper Dedicated Desk
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Facing any issue or money deducted without redirection?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                  Paid after the timer, facing app network delays, or have a payment screenshot? Click below to <strong>Raise a Ticket</strong>. Enter your UTR, upload the payment screenshot, and our admin team will manually verify and activate your student account!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] hover:shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0 cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-slate-900" />
              <span>Raise a Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Website Official Footer */}
      <Footer />

      {/* Dedicated Raise a Ticket Modal */}
      <RaiseTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        orderId={orderId}
        defaultEmail={customerEmail}
        defaultName={customerName}
        defaultMobile={customerMobile}
        defaultPackageId={packageId}
        defaultPackageName={packageName}
        defaultAmount={amount}
        defaultCity={customerCity}
        defaultState={customerState}
        defaultPinCode={customerPinCode}
        onTicketSubmitted={(ticket) => {
          setSubmittedTicketInfo(ticket);
        }}
      />
    </div>
  );
}
