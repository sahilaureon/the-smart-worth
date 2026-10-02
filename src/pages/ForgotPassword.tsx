import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, X, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

type ResetStep = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<ResetStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        const fieldError = document.querySelector('.field-error-message');
        if (fieldError) {
          fieldError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [error]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetchApi('/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404 || (result.error && result.error.includes('not found'))) {
          throw new Error("We couldn't find an account with that email address.");
        }
        throw new Error('Failed to send verification code. Please try again.');
      }
      setOtp('');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Verification could not be sent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetchApi('/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, token: otp, type: 'email' })
      });
      
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.error && result.error.includes('expired')) {
          throw new Error('This code has expired. Please request a new one.');
        }
        throw new Error(result.error || 'The code you entered is incorrect.');
      }

      if (result.session) {
        try {
          localStorage.setItem('tsw_fallback_session', JSON.stringify(result.session));
        } catch {}
        try {
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          });
        } catch {}
      }

      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const response = await fetchApi('/update-user', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) throw new Error('Failed to update password.');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0061FF', '#60A5FA', '#0A0E27']
      });

      setStep('success');
      
      try {
        localStorage.removeItem('tsw_fallback_session');
        await supabase.auth.signOut();
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Navbar />
      
      <PageHeader title="Reset Password" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-14 relative z-20">
        <div className="max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 md:p-8 border border-gray-50 relative overflow-hidden"
          >
            <div className="mb-6">
              {step !== 'success' && (
                <Link to="/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-[#0061FF] transition-colors mb-4">
                  <ArrowLeft size={14} className="mr-1" />
                  Back to Login
                </Link>
              )}
              {/* Logo in Card */}
              <div className="flex justify-center mb-6">
                <svg width="140" height="35" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
                  <defs>
                    <linearGradient id="logoGradientForgot" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#007BFF" />
                      <stop offset="100%" stopColor="#00C6FF" />
                    </linearGradient>
                  </defs>
                  <text x="0" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="url(#logoGradientForgot)" letterSpacing="-1">The</text>
                  <text x="50" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="#0A0E27" letterSpacing="-1">Smart Worth</text>
                  <rect x="0" y="42" width="195" height="3" rx="1.5" fill="url(#logoGradientForgot)" />
                </svg>
              </div>

              <h2 className="text-[#0061FF] font-bold text-xs mb-1 tracking-wide uppercase">Security</h2>
              <h3 className="text-2xl font-black text-[#0A0E27] tracking-tight">
                {step === 'email' && 'Forgot Password?'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'password' && 'New Password'}
                {step === 'success' && 'Password Updated!'}
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                {step === 'email' && 'Enter your email to receive a 6-digit OTP.'}
                {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
                {step === 'password' && 'Enter your new password (minimum 6 characters).'}
                {step === 'success' && 'Your password has been reset successfully.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-4"
                  noValidate
                >
                  {error && (
                    <motion.div 
                      ref={errorRef}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-red-50 border-2 border-red-200 flex items-center space-x-2 text-red-600 shadow-sm"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="font-bold text-xs">{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0061FF] transition-colors pointer-events-none">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 border-gray-100 focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <BrutalistButton
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                    size="lg"
                    fullWidth
                  >
                    Send OTP
                  </BrutalistButton>
                </motion.form>
              )}

              {step === 'otp' && (
                <motion.form
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-4"
                >
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-red-50 border-2 border-red-200 flex items-center space-x-2 text-red-600 shadow-sm"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="font-bold text-xs">{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0061FF] transition-colors pointer-events-none">
                        <KeyRound size={18} />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        name="otp_verification_code"
                        placeholder="6-Digit OTP"
                        required
                        maxLength={6}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 border-gray-100 focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-bold tracking-[0.5em] text-center placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </div>

                  <BrutalistButton
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    loading={loading}
                    className="w-full"
                    size="lg"
                    fullWidth
                  >
                    Verify OTP
                  </BrutalistButton>

                  <button
                    type="button"
                    onClick={() => {
                      setOtp('');
                      setError(null);
                      setStep('email');
                    }}
                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                  >
                    Change Email
                  </button>
                </motion.form>
              )}

              {step === 'password' && (
                <motion.form
                  key="password-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleUpdatePassword}
                  className="space-y-4"
                >
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-red-50 border-2 border-red-200 flex items-center space-x-2 text-red-600 shadow-sm"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="font-bold text-xs">{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0061FF] transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 border-gray-100 focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0061FF] transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0061FF] transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 border-gray-100 focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <BrutalistButton
                    type="submit"
                    disabled={loading || newPassword.length < 6}
                    loading={loading}
                    className="w-full"
                    size="lg"
                    fullWidth
                  >
                    Update Password
                  </BrutalistButton>
                </motion.form>
              )}

              {step === 'success' && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  
                  <BrutalistButton
                    onClick={() => navigate('/login')}
                    className="w-full"
                    size="lg"
                    showIcons={false}
                    fullWidth
                  >
                    Back to Login
                  </BrutalistButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
