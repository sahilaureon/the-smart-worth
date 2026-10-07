import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  User,
  Hash,
  Package,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { fetchApi } from '../lib/api';

export interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  defaultEmail?: string;
  defaultName?: string;
  defaultMobile?: string;
  defaultPackageId?: string;
  defaultPackageName?: string;
  defaultAmount?: number;
  defaultCity?: string;
  defaultState?: string;
  defaultPinCode?: string;
  onTicketSubmitted?: (ticket: any) => void;
}

export default function RaiseTicketModal({
  isOpen,
  onClose,
  orderId = '',
  defaultEmail = '',
  defaultName = '',
  defaultMobile = '',
  defaultPackageId = '',
  defaultPackageName = 'VIP Learning Package',
  defaultAmount = 599,
  defaultCity = '',
  defaultState = '',
  defaultPinCode = '',
  onTicketSubmitted
}: RaiseTicketModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState(defaultName);
  const [mobile, setMobile] = useState(defaultMobile);
  const [utrNumber, setUtrNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('Payment completed in UPI app but waiting for account activation.');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  // Sync incoming props if user changed them on main page
  React.useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail);
    if (defaultName && !fullName) setFullName(defaultName);
    if (defaultMobile && !mobile) setMobile(defaultMobile);
  }, [defaultEmail, defaultName, defaultMobile]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Screenshot file size must be less than 10MB.');
      return;
    }

    setError(null);
    setUploadingImage(true);
    setScreenshotFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target?.result as string);
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid registered email address.');
      return;
    }

    if (!cleanUtr || cleanUtr.length < 6) {
      setError('Please enter your 12-digit UTR / UPI Transaction Reference Number.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetchApi('/payment/raise-ticket', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          email: cleanEmail,
          full_name: fullName.trim() || cleanEmail.split('@')[0],
          mobile: mobile.trim(),
          city: defaultCity,
          state: defaultState,
          pin_code: defaultPinCode,
          package_id: defaultPackageId,
          package_name: defaultPackageName,
          amount: defaultAmount,
          utr_number: cleanUtr,
          screenshot_url: screenshotBase64,
          issue_description: issueDescription
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket. Please try again.');
      }

      setSubmittedTicket(data.ticket || { id: data.ticket_id, utr_number: cleanUtr });
      if (onTicketSubmitted) {
        onTicketSubmitted(data.ticket);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicketId = () => {
    if (!submittedTicket?.id) return;
    navigator.clipboard.writeText(submittedTicket.id);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl my-8 bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-400 text-slate-900 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Raise a Payment Ticket</h3>
              <p className="text-xs text-slate-300">Payment Helper Support &amp; Manual Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedTicket ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center justify-center text-emerald-600 shadow-[3px_3px_0px_0px_#059669]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full mb-2">
                Ticket Submitted Successfully
              </span>
              <h2 className="text-2xl font-black text-slate-900">We Have Received Your Ticket!</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Our <strong>Payment Helper</strong> team will verify your UTR number and payment screenshot. Your account and course access will be activated manually within a few minutes.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl max-w-sm mx-auto text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ticket Reference ID:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">#{submittedTicket.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>UTR Number:</span>
                <span className="font-mono font-semibold text-slate-700">{submittedTicket.utr_number}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Registered Email:</span>
                <span className="font-medium text-slate-700">{email}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Selected Package:</span>
                <span className="font-bold text-indigo-600">{defaultPackageName}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={copyTicketId}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-white font-bold text-sm text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer"
              >
                {copiedTicketId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTicketId ? 'Copied Reference!' : 'Copy Ticket ID'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-slate-900 bg-[#615DFA] font-bold text-sm text-white shadow-[2px_2px_0px_0px_#0f172a] hover:bg-[#504bd6] transition-all cursor-pointer"
              >
                <span>Back to Payment Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-red-50 border-2 border-red-500 rounded-xl flex items-start space-x-2.5 text-red-700 text-xs sm:text-sm font-semibold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-800">
              <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <strong>Payment deduction or delayed confirmation?</strong> Fill in your 12-digit UTR reference and attach a screenshot from PhonePe, Google Pay, or Paytm. The admin team will cross-check and activate your student package directly!
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Registered Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border-2 border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#615DFA] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Name & Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Student Name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border-2 border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#615DFA] focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border-2 border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#615DFA] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 12-Digit UTR Number (Crucial) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                12-Digit UTR / UPI Reference Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 528392019481 or UPI Ref ID"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-wider bg-indigo-50/50 border-2 border-indigo-300 rounded-xl font-bold text-indigo-900 focus:outline-none focus:border-[#615DFA] focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                You can copy this from your bank SMS or UPI transaction details (PhonePe, GPay, Paytm).
              </p>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Screenshot <span className="text-red-500">*</span>
              </label>

              {screenshotBase64 ? (
                <div className="relative p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={screenshotBase64}
                      alt="Payment Screenshot Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-emerald-900 truncate">
                        {screenshotFileName || 'Screenshot Attached'}
                      </p>
                      <p className="text-[11px] text-emerald-700">Ready to verify</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotBase64('');
                      setScreenshotFileName('');
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#615DFA] bg-slate-50 rounded-xl cursor-pointer hover:bg-indigo-50/30 transition-all text-center">
                  <Upload className="w-7 h-7 text-slate-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">Click to upload payment screenshot</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, JPEG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Package & Order Reference Info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">{defaultPackageName}</span>
              </div>
              <span className="font-bold text-slate-900">₹{defaultAmount}</span>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Note / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe your payment issue..."
                className="w-full p-2.5 text-sm bg-slate-50 border-2 border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#615DFA] focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#615DFA] hover:bg-[#504bd6] text-white font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] hover:shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Payment Ticket</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
