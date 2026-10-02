import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, ChevronRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import { fetchApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      // Small delay to allow the error message to render
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

  useEffect(() => {
    // Check if we have a session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const response = await fetchApi('/update-user', {
        method: 'POST',
        body: JSON.stringify({ password: password })
      });

      if (!response.ok) throw new Error('Failed to update password.');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0061FF', '#60A5FA', '#0A0E27']
      });

      setSuccess(true);
      
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Navbar />
      <PageHeader title="Create New Password" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-14 relative z-20">
        <div className="max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 md:p-8 border border-gray-50 relative overflow-hidden"
          >
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-black text-[#0A0E27] tracking-tight">
                {success ? 'Password Updated!' : 'New Password'}
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                {success 
                  ? 'Your password has been reset successfully. You can now login with your new password.' 
                  : 'Please enter a strong new password for your account.'}
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                {error && !error.toLowerCase().includes('password') && !error.toLowerCase().includes('match') && (
                  <motion.div 
                    ref={errorRef}
                    initial={{ opacity: 0, scale: 0.95, x: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: [0, -10, 10, -10, 10, 0]
                    }}
                    transition={{ duration: 0.4 }}
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
                      className={`w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
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
                      placeholder="Confirm New Password"
                      required
                      className={`w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#0061FF] focus:bg-white outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
                  {error && (error.toLowerCase().includes('password') || error.toLowerCase().includes('match')) && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                      <AlertCircle size={12} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                <BrutalistButton
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  size="lg"
                  fullWidth
                >
                  Update Password
                </BrutalistButton>
              </form>
            ) : (
              <div className="text-center space-y-6">
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
                  Go to Login
                </BrutalistButton>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;
