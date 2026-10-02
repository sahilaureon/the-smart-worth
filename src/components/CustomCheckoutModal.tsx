import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  X,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  QrCode,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  Copy,
  Check,
  Mail,
  FileText,
  Zap,
  Send,
  User,
  Globe
} from 'lucide-react';
import { fetchApi } from '../lib/api';

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
  onEmailChange?: (newEmail: string) => void;
  onSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    method: string;
    confirmed_email?: string;
  }) => Promise<void> | void;
}

type GatewayStep = 'email_step' | 'qr_gateway' | 'success';

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
  onEmailChange,
  onSuccess
}: CustomCheckoutModalProps) {
  const [step, setStep] = useState<GatewayStep>('email_step');
  const [emailInput, setEmailInput] = useState(customerEmail || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [qrLoading, setQrLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [activePaymentId, setActivePaymentId] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>('');
  const [countdown, setCountdown] = useState(300);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');

  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    paymentId: string;
    orderId: string;
    signature: string;
    method: string;
  } | null>(null);

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
        if (!res.ok || data.error || !data.image_url) {
          throw new Error(data.error || 'Unable to generate live QR code. Please tap Reload QR.');
        }
        setActivePaymentId(data.payment_id || '');
        setQrUrl(data.image_url);
        setUpiIntentUrl(data.upi_url || '');
      } catch (err: any) {
        setFormError(err.message || 'Could not load QR Code. Please try again.');
      } finally {
        setQrLoading(false);
      }
    },
    [orderId, amount, emailInput, customerEmail, customerPhone]
  );

  // Reset modal to Step 1 (Email & Order Summary Confirmation) whenever opened
  useEffect(() => {
    if (isOpen && orderId) {
      setStep('email_step');
      setEmailInput(customerEmail || '');
      setEmailError(null);
      setFormError(null);
      setStatusMessage(null);
      setVerifiedReceipt(null);
      setActivePaymentId('');
      setQrUrl('');
      setUpiIntentUrl('');
      setRedirectCountdown(3);
      setShowInvoicePreview(false);
    }
  }, [isOpen, orderId, customerEmail]);

  const triggerInvoiceDispatch = useCallback(
    async (payId: string, payStatus: 'paid' | 'failed') => {
      try {
        const res = await fetchApi('/payment/send-invoice', {
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
        const data = await res.json().catch(() => ({}));
        if (data?.invoice_html) {
          setInvoiceHtml(data.invoice_html);
        }
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

  // Proceed from Step 1 (Email confirmation) -> Step 2 (Open QR Code Payment Gateway)
  const handleProceedToGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setEmailError('Please enter a valid email address to receive your package & order invoice.');
      return;
    }
    setEmailError(null);
    setSavingEmail(true);
    try {
      if (onEmailChange) {
        onEmailChange(clean);
      }
      await fetchApi('/payment/confirm-email', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          email: clean,
          full_name: customerName,
          username: customerUsername || clean.split('@')[0],
          mobile: customerPhone
        })
      }).catch(() => {});
    } finally {
      setSavingEmail(false);
      setStep('qr_gateway');
      generateLiveQrCode(clean);
    }
  };

  // Fast Auto-Scan Payment Detection (polls Razorpay every 1.5s and succeeds automatically)
  useEffect(() => {
    if (!isOpen || step !== 'qr_gateway' || !orderId) return;

    let isMounted = true;
    let completed = false;

    const timerInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const pollInterval = setInterval(async () => {
      if (completed || !isMounted) return;
      try {
        const query = activePaymentId ? `?payment_id=${encodeURIComponent(activePaymentId)}` : '';
        const statusRes = await fetchApi(`/payment/status/${orderId}${query}`);
        if (!statusRes.ok || !isMounted || completed) return;

        const statusData = await statusRes.json();
        if (statusData.status === 'paid' && isMounted && !completed) {
          completed = true;
          clearInterval(pollInterval);

          const methodUsed = 'UPI';
          setVerifiedReceipt({
            orderId: statusData.razorpay_order_id || orderId,
            paymentId: statusData.razorpay_payment_id,
            signature: statusData.razorpay_signature,
            method: methodUsed
          });
          setStep('success');
          triggerInvoiceDispatch(statusData.razorpay_payment_id, 'paid');
        } else if (statusData.status === 'failed' && isMounted) {
          setFormError(
            statusData.error || 'Payment was declined in your UPI app. Tap Reload QR to try again.'
          );
          triggerInvoiceDispatch(statusData.razorpay_payment_id || activePaymentId, 'failed');
        }
      } catch {
        // Ignore transient network errors during polling
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [isOpen, step, orderId, activePaymentId, triggerInvoiceDispatch]);

  // 3-Second Auto-Redirect Countdown on Success Screen (matching diagram "Redirecting in 3 seconds...")
  useEffect(() => {
    if (!isOpen || step !== 'success' || !verifiedReceipt || showInvoicePreview) return;

    setRedirectCountdown(3);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      onSuccess({
        razorpay_order_id: verifiedReceipt.orderId,
        razorpay_payment_id: verifiedReceipt.paymentId,
        razorpay_signature: verifiedReceipt.signature,
        method: verifiedReceipt.method,
        confirmed_email: emailInput.trim().toLowerCase()
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [isOpen, step, verifiedReceipt, showInvoicePreview, onSuccess, emailInput]);

  if (!isOpen) return null;

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

  const formattedOriginal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(resolvedOriginalPrice);

  const formattedDiscount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(resolvedDiscount);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyOrder = () => {
    navigator.clipboard?.writeText(orderId).catch(() => {});
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 1800);
  };

  const handleManualStatusCheck = async () => {
    setCheckingStatus(true);
    setStatusMessage(null);
    setFormError(null);
    try {
      const query = activePaymentId ? `?payment_id=${encodeURIComponent(activePaymentId)}` : '';
      const statusRes = await fetchApi(`/payment/status/${orderId}${query}`);
      const statusData = await statusRes.json().catch(() => ({}));

      if (statusData.status === 'paid') {
        const methodUsed = 'UPI';
        setVerifiedReceipt({
          orderId: statusData.razorpay_order_id || orderId,
          paymentId: statusData.razorpay_payment_id,
          signature: statusData.razorpay_signature,
          method: methodUsed
        });
        setStep('success');
        triggerInvoiceDispatch(statusData.razorpay_payment_id, 'paid');
      } else if (statusData.status === 'failed') {
        setFormError(statusData.error || 'Payment failed or was declined.');
        triggerInvoiceDispatch(statusData.razorpay_payment_id || activePaymentId, 'failed');
      } else {
        setStatusMessage(
          'Waiting for bank confirmation... Scan the QR code & complete payment in your UPI app — it will verify automatically!'
        );
      }
    } catch {
      setStatusMessage('Auto-verification is active and checking bank status...');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    try {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `TheSmartWorthPay-QR-${orderId.slice(-6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[#07091e]/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-[440px] bg-[#f8f9fc] rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden border border-slate-200/80 flex flex-col max-h-[95vh]"
        >
          {/* Top App Header — Exact Match to "The Smart Worth Pay" Diagram */}
          <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (step === 'qr_gateway') {
                    setStep('email_step');
                  } else {
                    onClose();
                  }
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#3730a3] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-indigo-500/20">
                SW
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight">
                  The Smart Worth Pay
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                  thesmartworth.site
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span className="leading-tight">Secure Payment</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* STEP 1: EMAIL ADDRESS & COMPLETE ORDER SUMMARY BEFORE GATEWAY */}
            {step === 'email_step' && (
              <motion.form
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleProceedToGateway}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                      Step 1 of 2 • Billing &amp; Invoice Email
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Confirm Your Email for Order Invoice
                    </h4>
                    <p className="text-xs text-slate-500">
                      Your official receipt &amp; package access will be sent to this email
                    </p>
                  </div>

                  {/* Email Input Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Customer Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailError(null);
                        }}
                        placeholder="Enter your email address (e.g. name@gmail.com)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white text-sm font-bold text-slate-900 outline-none transition"
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  {/* Complete Order, Offer & Website Owner Summary Card */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        Order &amp; Offer Breakdown
                      </span>
                      <span className="font-mono text-[10px] font-bold text-indigo-600">
                        {orderId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Selected Package</span>
                      <span className="font-black text-slate-900">{packageName} (×1)</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Package MRP Price</span>
                      <span className="font-semibold text-slate-600 line-through">
                        {formattedOriginal}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-bold">
                        Offer / Discount Applied {referralCode ? `(${referralCode})` : ''}
                      </span>
                      <span className="font-black text-emerald-600">- {formattedDiscount}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                      <span className="font-black text-slate-900">Total Amount Payable</span>
                      <span className="text-lg font-black text-indigo-600">{formattedAmount}</span>
                    </div>
                  </div>

                  {/* Classic Customer & Website Owner Info Cards (Mobile Responsive) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-800 border-b border-slate-200/80 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Customer &amp; Billing</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-bold text-slate-900 truncate">
                          {customerName || emailInput.split('@')[0] || 'Valued Student'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Username:</span>
                        <span className="font-semibold text-slate-700 truncate">
                          @{customerUsername || (emailInput || 'student').split('@')[0]}
                        </span>
                      </div>
                      {customerPhone && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Phone:</span>
                          <span className="font-semibold text-slate-700">+91 {customerPhone}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-800 border-b border-slate-200/80 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Website &amp; Owner</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Website:</span>
                        <span className="font-bold text-slate-900 truncate">The Smart Worth</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Owner:</span>
                        <span className="font-semibold text-slate-700 truncate">Sahil Aureon</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Support:</span>
                        <span className="text-indigo-600 font-bold truncate">helplinesmartworth@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Continue to QR Payment Gateway Button */}
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6366f1] hover:from-[#3730a3] hover:to-[#4f46e5] text-white font-black text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {savingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Payment Gateway...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Continue to QR Payment ({formattedAmount})</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* "How Payment Works?" 5-Step Diagram */}
                <div className="bg-[#0f1429] text-white rounded-2xl p-4 border border-indigo-500/20 shadow-md">
                  <div className="text-center mb-3">
                    <h5 className="text-xs font-black tracking-wide">
                      How <span className="text-indigo-400">Payment Works?</span>
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Simple • Fast • Automatic • Secure
                    </p>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { num: '1', title: 'Create Order', desc: 'Confirm email & order' },
                      { num: '2', title: 'Show QR', desc: 'Dynamic QR generated' },
                      { num: '3', title: 'Scan QR', desc: 'Use any UPI app' },
                      { num: '4', title: 'Make Payment', desc: `Confirm & pay ${formattedAmount}` },
                      { num: '5', title: 'Auto Verify', desc: 'Instant invoice & access' }
                    ].map((item) => (
                      <div
                        key={item.num}
                        className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center"
                      >
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center mb-1 shadow">
                          {item.num}
                        </div>
                        <p className="text-[9px] font-extrabold text-white leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[8px] text-slate-400 leading-tight mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.form>
            )}

            {/* STEP 2: COMPLETE YOUR PAYMENT (EXACT MATCH TO UPLOADED DIAGRAM - QR CODE ONLY) */}
            {step === 'qr_gateway' && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3.5"
              >
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="flex-1">{formError}</span>
                  </div>
                )}

                {statusMessage && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs font-medium">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Main White Payment Card Matching Diagram */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm text-center">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Complete Your Payment
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Scan QR with any UPI App to Pay
                  </p>

                  {/* Large Amount & Order ID with Copy */}
                  <div className="mt-3 mb-2">
                    <div className="inline-flex items-center justify-center gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                        {formattedAmount}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyOrder}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
                        title="Copy Order ID"
                      >
                        {copiedOrder ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Order ID: <span className="font-mono font-bold text-slate-700">{orderId}</span>
                    </p>
                  </div>

                  {/* Dynamic QR Box with Indigo Corner Brackets & Centered SW Badge */}
                  <div className="relative mx-auto w-56 h-56 sm:w-60 sm:h-60 bg-white rounded-2xl p-3.5 flex items-center justify-center my-2 shadow-[0_4px_25px_rgba(79,70,229,0.08)] border border-indigo-100">
                    {/* 4 Indigo Corner Brackets Matching Diagram */}
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t-[3px] border-l-[3px] border-[#4f46e5] rounded-tl-xl pointer-events-none" />
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t-[3px] border-r-[3px] border-[#4f46e5] rounded-tr-xl pointer-events-none" />
                    <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b-[3px] border-l-[3px] border-[#4f46e5] rounded-bl-xl pointer-events-none" />
                    <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b-[3px] border-r-[3px] border-[#4f46e5] rounded-br-xl pointer-events-none" />

                    {qrLoading ? (
                      <div className="flex flex-col items-center gap-2.5">
                        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-600">
                          Generating Dynamic QR...
                        </span>
                      </div>
                    ) : qrUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={qrUrl}
                          alt="The Smart Worth Pay Dynamic UPI QR"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {/* Center SW Logo Overlay Matching Diagram */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#3730a3] text-white font-black text-xs flex items-center justify-center border-[3px] border-white shadow-md">
                            SW
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <QrCode className="w-10 h-10 text-indigo-600" />
                        <button
                          type="button"
                          onClick={() => generateLiveQrCode()}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider shadow"
                        >
                          OPEN QR CODE
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Green Pill: Dynamic QR Code • Valid for 5:00 */}
                  <div className="mt-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dynamic QR Code • Valid for {formatCountdown(countdown)}</span>
                    </div>
                  </div>

                  {/* Supported UPI Scanner App Tiles (Visual Indicator) */}
                  <div className="grid grid-cols-4 gap-2 my-3">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-blue-600 shadow-2xs">
                        G
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">Google Pay</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1">
                      <div className="w-7 h-7 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                        पे
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">PhonePe</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1">
                      <div className="w-7 h-7 rounded-lg bg-[#00baf2] text-white flex items-center justify-center font-black text-[8px] shadow-2xs">
                        Paytm
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">Paytm</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1">
                      <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-[8px] shadow-2xs">
                        BHIM
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">BHIM UPI</span>
                    </div>
                  </div>

                  {/* Scan & Pay Info Box Matching Diagram */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 text-left mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-extrabold text-slate-900">
                        Scan &amp; Pay <span className="text-indigo-600">{formattedAmount}</span> using any UPI App
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Loader2 className="w-3 h-3 text-indigo-600 animate-spin shrink-0" />
                        <span>Payment will be automatically verified</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Verify Status / Save QR */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={!qrUrl}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleManualStatusCheck}
                      disabled={checkingStatus || qrLoading}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      {checkingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Check Status</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Invoice Email Indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">
                      Invoice to: <strong className="text-slate-700">{emailInput}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('email_step')}
                      className="text-indigo-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                {/* Bottom 3 Feature Badges Matching Diagram */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-700 leading-tight">
                      Secure Payment
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-700 leading-tight">
                      Dynamic QR Code
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[10px] font-extrabold text-slate-700 leading-tight">
                      Auto Verification
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT SUCCESSFUL! (CLASSIC EXECUTIVE RECEIPT + DOWNLOAD PDF & MOBILE RESPONSIVE) */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-200 border-t-4 border-t-amber-600 shadow-md text-center space-y-4">
                  {/* Glowing Green Checkmark Circle */}
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50"
                  >
                    <Check className="w-9 h-9 stroke-[3]" />
                  </motion.div>

                  <div>
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                      Payment Successful!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                      Official Tax Receipt generated &amp; sent to <span className="font-bold text-indigo-700">{emailInput}</span>
                    </p>
                  </div>

                  {/* Classic High-Contrast Receipt Details Ledger */}
                  <div className="bg-slate-50 border border-slate-300 rounded-xl overflow-hidden text-left shadow-2xs">
                    <div className="bg-slate-900 text-amber-200 px-3.5 py-2.5 flex items-center justify-between border-b-2 border-amber-600">
                      <span className="font-serif font-bold text-xs uppercase tracking-wider">
                        Official Payment Receipt
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid &amp; Verified</span>
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                        <span className="text-slate-600 font-semibold">Package Name</span>
                        <span className="font-serif font-bold text-slate-950 text-right">
                          {packageName}
                        </span>
                      </div>

                      {resolvedDiscount > 0 && (
                        <>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                            <span className="text-slate-600 font-semibold">Original Price (MRP)</span>
                            <span className="font-bold text-slate-700 line-through">{formattedOriginal}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2 text-emerald-700">
                            <span className="font-bold">Offer / Referral Discount</span>
                            <span className="font-extrabold">- {formattedDiscount}</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 pt-0.5">
                        <span className="font-serif font-bold text-slate-900 text-sm">Total Amount Paid</span>
                        <span className="text-base sm:text-lg font-black text-indigo-700">{formattedAmount}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                        <span className="text-slate-600 font-semibold">Order ID</span>
                        <span className="font-mono font-bold text-slate-900 text-xs break-all text-right">
                          {verifiedReceipt?.orderId || orderId}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                        <span className="text-slate-600 font-semibold">Transaction ID</span>
                        <span className="font-mono font-bold text-slate-900 text-xs break-all text-right">
                          {verifiedReceipt?.paymentId || activePaymentId || 'Verified via UPI'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                        <span className="text-slate-600 font-semibold">Customer</span>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[190px]">
                          {customerName || emailInput.split('@')[0]} (@{customerUsername || emailInput.split('@')[0]})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">Merchant &amp; Owner</span>
                        <span className="font-bold text-slate-900 text-right">
                          The Smart Worth • Sahil Aureon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Download PDF Receipt & View Classic Invoice Buttons (Mobile Responsive) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={`/api/payment/receipt-pdf/${encodeURIComponent(
                        verifiedReceipt?.orderId || orderId
                      )}?payment_id=${encodeURIComponent(
                        verifiedReceipt?.paymentId || ''
                      )}&email=${encodeURIComponent(emailInput)}`}
                      download={`TheSmartWorth-Receipt-${verifiedReceipt?.orderId || orderId}.pdf`}
                      onClick={() => setShowInvoicePreview(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Download PDF Receipt</span>
                    </a>

                    <a
                      href={`/api/payment/invoice/${encodeURIComponent(
                        verifiedReceipt?.orderId || orderId
                      )}?payment_id=${encodeURIComponent(
                        verifiedReceipt?.paymentId || ''
                      )}&email=${encodeURIComponent(emailInput)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowInvoicePreview(true)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Open Classic Invoice</span>
                    </a>
                  </div>

                  {/* Continue to Merchant Button Matching Diagram */}
                  <button
                    type="button"
                    onClick={() => {
                      if (verifiedReceipt) {
                        onSuccess({
                          razorpay_order_id: verifiedReceipt.orderId,
                          razorpay_payment_id: verifiedReceipt.paymentId,
                          razorpay_signature: verifiedReceipt.signature,
                          method: verifiedReceipt.method,
                          confirmed_email: emailInput.trim().toLowerCase()
                        });
                      }
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6366f1] hover:from-[#3730a3] hover:to-[#4f46e5] text-white font-black text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Merchant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {!showInvoicePreview ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span>Redirecting in {redirectCountdown} seconds...</span>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-emerald-700">
                      Auto-redirect paused so you can download your receipt. Click &ldquo;Continue to Merchant&rdquo; when ready.
                    </div>
                  )}

                  {/* Bottom Security Card Matching Diagram */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-center gap-2.5 text-left">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-800">
                        Payment secured by <span className="text-emerald-700">The Smart Worth Pay</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        UPI • Bank Level Security • 256-bit Encryption
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
