import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  Download,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  Lock,
  Package,
  Send,
  ArrowRight,
  Info,
  LifeBuoy,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import BrutalistButton from './BrutalistButton';
import RaiseTicketModal from './RaiseTicketModal';

export interface CustomCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // Final payable amount in INR
  originalPrice?: number; // Original MRP before discount/offer
  discountAmount?: number; // Offer / referral discount saved
  orderId: string;
  keyId?: string;
  packageName?: string;
  customerName?: string;
  customerUsername?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCity?: string;
  customerState?: string;
  customerPinCode?: string;
  referralCode?: string;
  initialUpiUrl?: string;
  initialQrUrl?: string;
  initialPaymentId?: string;
  onEmailChange?: (newEmail: string) => void;
  onSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    method: string;
    confirmed_email?: string;
  }) => Promise<void> | void;
}

export default function CustomCheckoutModal({
  isOpen,
  onClose,
  amount,
  originalPrice,
  discountAmount,
  orderId,
  packageName = 'VIP Learning Package',
  customerName = '',
  customerUsername = '',
  customerEmail = '',
  customerPhone = '',
  customerCity = '',
  customerState = '',
  customerPinCode = '',
  referralCode = '',
  initialUpiUrl = '',
  initialQrUrl = '',
  initialPaymentId = '',
  onEmailChange,
  onSuccess
}: CustomCheckoutModalProps) {
  const [emailInput, setEmailInput] = useState(customerEmail || '');
  const [qrLoading, setQrLoading] = useState(!initialQrUrl);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [activePaymentId, setActivePaymentId] = useState<string>(initialPaymentId || '');
  const [qrUrl, setQrUrl] = useState<string>(initialQrUrl || '');
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>(initialUpiUrl || '');
  const [countdown, setCountdown] = useState(300);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Success & Ticket state
  const [isPaid, setIsPaid] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    paymentId: string;
    orderId: string;
    signature: string;
    method: string;
  } | null>(null);

  // Official Verified NPCI Merchant VPA from Axis Bank & Razorpay
  const defaultUpiId = 'thesmartworth466963.rzp@axisbank';
  const fallbackUpiUri = `upi://pay?pa=${defaultUpiId}&pn=TheSmartWorth&mc=8241&am=${Number(amount).toFixed(2)}&cu=INR&tn=Pay%20via%20Razorpay&tr=${orderId}`;
  const effectiveUpiUri = upiIntentUrl || fallbackUpiUri;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(effectiveUpiUri)}&margin=10`;
  const effectiveQrUrl = qrUrl || fallbackQrUrl;

  const resolvedOriginalPrice = Math.max(Number(originalPrice || amount), Number(amount));
  const resolvedDiscount =
    discountAmount !== undefined
      ? Number(discountAmount)
      : Math.max(0, resolvedOriginalPrice - Number(amount));

  useEffect(() => {
    if (customerEmail) {
      setEmailInput(customerEmail);
    }
  }, [customerEmail]);

  // Generate live Razorpay QR code using server-side Razorpay API Keys
  const generateLiveQrCode = useCallback(
    async (targetEmail?: string) => {
      if (!orderId) return;
      setQrLoading(true);
      setFormError(null);
      setStatusMessage(null);
      setCountdown(300);

      try {
        const res = await fetchApi('/payment/create-qr', {
          method: 'POST',
          body: JSON.stringify({
            order_id: orderId,
            amount,
            email: targetEmail || emailInput || customerEmail || 'customer@thesmartworth.site',
            contact: customerPhone || '9876543210'
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data?.image_url) {
          setActivePaymentId(data.payment_id || '');
          setQrUrl(data.image_url);
          setUpiIntentUrl(data.upi_url || '');
        }
      } catch {
        // Fallback to static clean QR immediately without blocking
      } finally {
        setQrLoading(false);
      }
    },
    [orderId, amount, emailInput, customerEmail, customerPhone]
  );

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen && orderId) {
      setEmailInput(customerEmail || '');
      setFormError(null);
      setStatusMessage(null);
      setIsPaid(false);
      setVerifiedReceipt(null);
      setCountdown(300);
      if (initialQrUrl) {
        setQrUrl(initialQrUrl);
        setQrLoading(false);
      }
      if (initialUpiUrl) {
        setUpiIntentUrl(initialUpiUrl);
      }
      if (initialPaymentId) {
        setActivePaymentId(initialPaymentId);
      }
      if (!initialQrUrl) {
        void generateLiveQrCode(customerEmail);
      }
    }
  }, [isOpen, orderId, customerEmail, initialQrUrl, initialUpiUrl, initialPaymentId, generateLiveQrCode]);

  // 5-Minute Timer Countdown
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 1; // clamp to 1 second so it never cancels in-flight transactions
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isPaid]);

  // Invoice Dispatcher
  const triggerInvoiceDispatch = useCallback(
    async (payId: string, payStatus: 'paid' | 'failed') => {
      try {
        await fetchApi('/payment/send-invoice', {
          method: 'POST',
          body: JSON.stringify({
            order_id: orderId,
            payment_id: payId,
            status: payStatus,
            email: (emailInput || customerEmail || '').trim().toLowerCase(),
            full_name: customerName,
            username:
              customerUsername ||
              (emailInput || customerEmail || 'student').split('@')[0].toLowerCase(),
            mobile: customerPhone,
            city: customerCity,
            state: customerState,
            pin_code: customerPinCode,
            package_name: packageName,
            original_price: resolvedOriginalPrice,
            discount_amount: resolvedDiscount,
            amount,
            referral_code: referralCode
          })
        });
      } catch {}
    },
    [
      orderId,
      emailInput,
      customerEmail,
      customerName,
      customerUsername,
      customerPhone,
      customerCity,
      customerState,
      customerPinCode,
      packageName,
      resolvedOriginalPrice,
      resolvedDiscount,
      amount,
      referralCode
    ]
  );

  // Check Real-Time Payment Status from Razorpay API
  const handleManualStatusCheck = useCallback(async (isSilent = true) => {
    if (!orderId || isPaid) return;
    if (!isSilent) setCheckingStatus(true);
    try {
      const query = activePaymentId ? `?payment_id=${encodeURIComponent(activePaymentId)}` : '';
      const statusRes = await fetchApi(`/payment/status/${orderId}${query}`);
      const statusData = await statusRes.json().catch(() => ({}));

      if (statusData.status === 'paid') {
        setIsPaid(true);
        const receipt = {
          orderId: statusData.razorpay_order_id || orderId,
          paymentId: statusData.razorpay_payment_id || `PAY_${Date.now()}`,
          signature: statusData.razorpay_signature || 'VERIFIED_SIGNATURE',
          method: 'UPI'
        };
        setVerifiedReceipt(receipt);
        triggerInvoiceDispatch(receipt.paymentId, 'paid');

        // Immediately finalize registration & redirect
        setTimeout(() => {
          onSuccess({
            razorpay_order_id: receipt.orderId,
            razorpay_payment_id: receipt.paymentId,
            razorpay_signature: receipt.signature,
            method: receipt.method,
            confirmed_email: (emailInput || customerEmail).trim().toLowerCase()
          });
        }, 1200);
      } else if (statusData.status === 'failed') {
        setFormError(statusData.error || 'Payment failed or declined in UPI app.');
      }
    } catch {
      // Ignore transient network errors during auto-polling
    } finally {
      if (!isSilent) setCheckingStatus(false);
    }
  }, [orderId, activePaymentId, isPaid, emailInput, customerEmail, onSuccess, triggerInvoiceDispatch]);

  // Fast Auto-Polling (Silent background poll every 1.8 seconds)
  useEffect(() => {
    if (!isOpen || isPaid || !orderId) return;
    const pollInterval = setInterval(() => {
      void handleManualStatusCheck(true);
    }, 1800);
    return () => clearInterval(pollInterval);
  }, [isOpen, isPaid, orderId, handleManualStatusCheck]);

  // Instant Check on Return from UPI Apps (Tab Focus & Visibility Event)
  useEffect(() => {
    if (!isOpen || isPaid) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void handleManualStatusCheck(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isOpen, isPaid, handleManualStatusCheck]);

  // 1-Tap "Pay Now" Button Handler - Launches UPI Apps without clipboard copy
  const handlePayNowOpenUpi = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!effectiveUpiUri) return;

    // Use invisible anchor tag for smooth native intent dispatch on mobile browsers
    try {
      const a = document.createElement('a');
      a.href = effectiveUpiUri;
      a.target = '_top';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = effectiveUpiUri;
    }

    // Immediately trigger silent check in background
    setTimeout(() => {
      void handleManualStatusCheck(true);
    }, 2500);
  };

  const handleCopyOrder = () => {
    navigator.clipboard?.writeText(orderId).catch(() => {});
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 1800);
  };

  const handleDownloadQr = () => {
    const targetUrl = effectiveQrUrl;
    if (!targetUrl) return;
    try {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `TheSmartWorthPay-QR-${orderId.slice(-6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  };

  if (!isOpen) return null;

  const minutesStr = String(Math.floor(countdown / 60)).padStart(2, '0');
  const secondsStr = String(countdown % 60).padStart(2, '0');

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-[430px] bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden p-4 sm:p-5 space-y-3.5 my-auto"
          >
            {/* Top Header: Small Sleek Clock Timer & Close Button (No overlapping!) */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50/90 border border-red-200 rounded-full shadow-2xs">
                <Clock size={12} className="text-red-600 animate-pulse shrink-0" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-slate-700">Time Left:</span>
                <span className="font-mono font-black text-xs text-red-600 tracking-wider">
                  {minutesStr}:{secondsStr}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {isPaid ? (
              /* Success View matching exact flow */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Payment Successful!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your enrollment in <strong>{packageName}</strong> is verified.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto text-xs space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono font-bold text-slate-900">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">₹ {Number(amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0066FF]">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Redirecting to your student dashboard...</span>
                </div>
              </div>
            ) : (
              /* EXACT MATCH TO USER UPLOADED SCREENSHOT */
              <>
                {/* 2. QR Code Box & Actions */}
                <div className="text-center space-y-2">
                  <div className="inline-block p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    {qrLoading ? (
                      <div className="w-44 h-44 sm:w-48 sm:h-48 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={32} className="text-[#615DFA] animate-spin" />
                        <span className="text-xs font-black tracking-widest text-slate-700">PROGRESS,,,</span>
                      </div>
                    ) : (
                      <img
                        src={effectiveQrUrl}
                        alt="The Smart Worth UPI QR Code"
                        className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">
                      Scan QR Code &amp; Pay
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Use any UPI App to pay
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#EBF3FF] hover:bg-[#DCEBFF] text-[#0066FF] font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    <Download size={15} strokeWidth={2.5} />
                    <span>Download QR Code</span>
                  </button>
                </div>

                {/* 3. Information Ledger Box */}
                <div className="bg-[#F6F9FF] border border-blue-100 rounded-2xl p-3 space-y-2.5 text-left">
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
                        onClick={() => {
                          navigator.clipboard?.writeText(String(amount));
                          setCopiedAmount(true);
                          setTimeout(() => setCopiedAmount(false), 2000);
                        }}
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
                      <span className="truncate">{emailInput || customerEmail || 'yourname@gmail.com'}</span>
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
                        onClick={handleCopyOrder}
                        className="p-1 hover:text-slate-600 transition cursor-pointer"
                        title="Copy Order ID"
                      >
                        {copiedOrder ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Main Action Button: "Pay Now" matching Login Page Brutalist Design */}
                <div className="w-full pt-1 pb-1">
                  <BrutalistButton
                    type="button"
                    onClick={handlePayNowOpenUpi}
                    className="w-full"
                    size="lg"
                    fullWidth
                  >
                    Pay Now
                  </BrutalistButton>
                </div>

                {/* 6. Bottom "Payment Not Received?" Helper Box */}
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black text-xs rounded-xl shrink-0 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#0f172a] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                  >
                    <LifeBuoy size={14} strokeWidth={2.5} className="text-[#615DFA]" />
                    <span>Raise a Ticket</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Dedicated Raise a Ticket Modal */}
      <RaiseTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        orderId={orderId}
        defaultEmail={emailInput || customerEmail}
        defaultName={customerName}
        defaultMobile={customerPhone}
        defaultPackageName={packageName}
        defaultAmount={amount}
        defaultCity={customerCity}
        defaultState={customerState}
        defaultPinCode={customerPinCode}
        onTicketSubmitted={() => {
          setIsTicketModalOpen(false);
        }}
      />
    </>
  );
}
