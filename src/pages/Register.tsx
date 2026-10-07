import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Lock, ChevronRight, AlertCircle,
  Eye, EyeOff, Home, Zap, X, Calendar, Star, Package,
  AtSign, MapPin
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CONFIG } from '../lib/config';
import { fetchApi } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import { cn } from '../lib/utils';
import { AnimatedSelect } from '../components/AnimatedSelect';
import Checkbox from '../components/Checkbox';
import { usePackages } from '../hooks/usePackages';
import BrutalistButton from '../components/BrutalistButton';
import { stateCities } from '../data/cities';
import SEO from '../components/SEO';
import CustomCheckoutModal from '../components/CustomCheckoutModal';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { packages, loading: packagesLoading, error: packagesError, refresh: refreshPackages } = usePackages();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    dob: '',
    gender: '',
    state: '',
    packageId: searchParams.get('packageId') || '',
    referralCode: searchParams.get('referralCode') || '',
    city: '',
    pinCode: '',
    agreeTerms: false,
    agreeRefund: false,
  });

  const [step, setStep] = useState(1);
  const [isStepSubmitted, setIsStepSubmitted] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
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
  }, [errors]);

  useEffect(() => {
    const pkgId = searchParams.get('packageId');
    const refCode = searchParams.get('referralCode') || searchParams.get('ref');
    if (pkgId || refCode) {
      setFormData(prev => ({ 
        ...prev, 
        packageId: pkgId || prev.packageId,
        referralCode: refCode || prev.referralCode
      }));
    } else if (packages.length > 0 && !formData.packageId) {
      setFormData(prev => ({ ...prev, packageId: packages[0].id }));
    }

    // Increment click count if referral code is present
    if (refCode) {
      const incrementClicks = async () => {
        try {
          await fetchApi('/referral-click', {
            method: 'POST',
            body: JSON.stringify({ code: refCode.toUpperCase() })
          });
        } catch (err) {
          console.error("Error incrementing referral clicks:", err);
        }
      };
      incrementClicks();
      if (packages.length > 0) {
        validateAndApplyDiscount(refCode);
      }
    }
  }, [searchParams, packages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setErrors(prev => {
      const newErrs = { ...prev };
      delete newErrs[name as keyof typeof errors];
      return newErrs;
    });
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (name === 'mobile') {
      // Only allow numbers and max 10 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === 'pinCode') {
      // Only allow numbers and max 6 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === 'username') {
      // Only allow lowercase letters, numbers, and underscores
      const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setFormData({ ...formData, [name]: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  const validateAndApplyDiscount = async (codeOverride?: string) => {
    const targetCode = (codeOverride || formData.referralCode || '').trim();
    if (!targetCode) {
      setDiscountError("Please enter a code");
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetchApi(`/validate-referral?code=${targetCode.toUpperCase()}`);
      
      if (!response.ok) {
        setDiscountError("Invalid or inactive referral code");
        setIsDiscountApplied(false);
        setDiscountAmount(0);
        setDiscountPercent(0);
      } else {
        const data = await response.json();
        setIsDiscountApplied(true);
        const percent = Number(data.discount_percent || 10);
        setDiscountPercent(percent);
        const pkg = packages.find(p => p.id === formData.packageId) || packages[0];
        const basePrice = pkg?.offer_price || pkg?.price || 0;
        const discount = Math.round(basePrice * (percent / 100));
        setDiscountAmount(discount); 
        setDiscountError(null);
      }
    } catch (err) {
      setDiscountError("Error validating code");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleApplyDiscount = () => validateAndApplyDiscount();

  useEffect(() => {
    if (isDiscountApplied && discountPercent > 0) {
      const pkg = packages.find(p => p.id === formData.packageId) || packages[0];
      const basePrice = pkg?.offer_price || pkg?.price || 0;
      const discount = Math.round(basePrice * (discountPercent / 100));
      setDiscountAmount(discount);
    }
  }, [formData.packageId, isDiscountApplied, discountPercent, packages]);

  const selectedPackage = packages.find(pkg => pkg.id === formData.packageId) || packages[0];
  
  // Calculations
  // Auto-detect prices from package data, with specific defaults for Creator Worth
  const realPrice = selectedPackage?.original_price || (selectedPackage?.name?.toLowerCase().includes('creator') ? 15000 : (selectedPackage?.price || 0));
  const offerPrice = selectedPackage?.offer_price || (selectedPackage?.name?.toLowerCase().includes('creator') ? 4999 : (selectedPackage?.price || 0));
  const finalPrice = Math.max(0, offerPrice - discountAmount);

  useEffect(() => {
    setImageLoaded(false);
  }, [formData.packageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    // Step 1 Validation
    if (step === 1) {
      setIsStepSubmitted(true);
      if (formData.fullName.trim().length < 3) {
        newErrors.fullName = 'Full name must be at least 3 characters long.';
      }
      if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters long.';
      }
      if (!formData.email.includes('@')) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (formData.mobile.length !== 10) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
      }
      
      // Password validation: minimum 8 characters
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Track lead in Unknown Users database
      fetchApi('/leads/track', {
        method: 'POST',
        body: JSON.stringify({
          full_name: formData.fullName,
          username: formData.username,
          email: formData.email,
          mobile: formData.mobile,
          source: 'register_step_1'
        })
      }).catch(() => {});

      setStep(2);
      setIsStepSubmitted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 2 Validation
    if (step === 2) {
      setIsStepSubmitted(true);
      if (!formData.dob) {
        newErrors.dob = 'Please select your date of birth.';
      }
      if (!formData.gender) {
        newErrors.gender = 'Please select your gender.';
      }
      if (!formData.state) {
        newErrors.state = 'Please select your state.';
      }
      if (!formData.city) {
        newErrors.city = 'Please select your city.';
      }
      if (formData.pinCode.length !== 6) {
        newErrors.pinCode = 'Please enter a valid 6-digit Pin Code.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Track lead in Unknown Users database with full location details
      fetchApi('/leads/track', {
        method: 'POST',
        body: JSON.stringify({
          full_name: formData.fullName,
          username: formData.username,
          email: formData.email,
          mobile: formData.mobile,
          dob: formData.dob,
          gender: formData.gender,
          state: formData.state,
          city: formData.city,
          pin_code: formData.pinCode,
          source: 'register_step_2'
        })
      }).catch(() => {});

      setStep(3);
      setIsStepSubmitted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 3 Validation & Submission
    setIsStepSubmitted(true);
    setLoading(true);

    if (!formData.password || formData.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters long.' });
      setStep(1);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.packageId) {
      newErrors.package = 'Please select a package to continue.';
    }

    if (!formData.agreeTerms) {
      newErrors.terms = 'Please agree to the Terms & Conditions.';
    }
    if (!formData.agreeRefund) {
      newErrors.refund = 'Please agree to the Refund Policy.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Clear any stale session before starting registration to avoid "expired token" errors
      await supabase.auth.signOut().catch(() => {});

      let order;
      try {
        const response = await fetchApi('/payment/create-order', {
          method: 'POST',
          body: JSON.stringify({
            package_id: formData.packageId,
            package_name: selectedPackage?.name || 'VIP Package',
            original_price: selectedPackage?.originalPrice || selectedPackage?.original_price || selectedPackage?.price || finalPrice,
            discount_amount: discountAmount,
            amount: finalPrice,
            user_id: formData.email,
            email: formData.email,
            full_name: formData.fullName,
            username: formData.username,
            mobile: formData.mobile,
            city: formData.city,
            state: formData.state,
            pin_code: formData.pinCode,
            referral_code: formData.referralCode || null,
            is_pre_signup: true
          })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          order = await response.json();
          if (!response.ok) {
            if (response.status === 409 || (order.error && order.error.includes('exists'))) {
              throw new Error("This email is already registered. Please log in instead.");
            }
            throw new Error(order.error || "Temporary issue. Please try again.");
          }
        } else {
          throw new Error("The server is preparing your request. Please try again in a few seconds.");
        }
      } catch (err: any) {
        console.error("Payment Initiation Error:", err);
        throw new Error(err.message || "Could not connect to the server. Please try again.");
      }

      if (!order || !order.id) {
        throw new Error("Failed to initiate payment. Order ID missing.");
      }

      const finalPayable = finalPrice || Math.round((order.amount || 59900) / 100);
      const pkgName = selectedPackage?.name || 'VIP Package';
      const origPrice = Number(selectedPackage?.originalPrice || selectedPackage?.original_price || selectedPackage?.price || finalPayable);

      // Save order state for session recovery if refreshed
      sessionStorage.setItem('tsw_active_payment_order', JSON.stringify({
        orderId: order.id,
        packageName: pkgName,
        packageId: formData.packageId,
        amount: finalPayable,
        originalPrice: origPrice,
        discountAmount: discountAmount,
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        referralCode: formData.referralCode || null,
        password: formData.password
      }));

      // Open Payment Gateway Pop-up Modal directly over the registration page
      setActiveOrder({
        id: order.id,
        amount: finalPayable,
        packageName: pkgName,
        upiUrl: order.upi_url,
        qrUrl: order.qr_url,
        paymentId: order.payment_id
      });
      return;
    } catch (err: any) {
      console.error("Registration/Payment Error:", err);
      setErrors({ general: err.message || 'Failed to initiate process. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const [activeOrder, setActiveOrder] = useState<{
    id: string;
    amount: number;
    packageName: string;
    upiUrl?: string;
    qrUrl?: string;
    paymentId?: string;
  } | null>(null);

  const handlePaymentSuccess = async (paymentResponse: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    confirmed_email?: string;
  }) => {
    setActiveOrder(null);
    setLoading(true);
    const finalCustomerEmail = (paymentResponse.confirmed_email || formData.email).trim().toLowerCase();

    // Ensure password is at least 8 characters for post-payment account creation
    let securePassword = formData.password;
    if (!securePassword || securePassword.length < 8) {
      try {
        const savedSession = sessionStorage.getItem('tsw_active_payment_order');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.password && parsed.password.length >= 8) {
            securePassword = parsed.password;
          }
        }
      } catch {}
    }
    if (securePassword && securePassword.length < 8) {
      securePassword = securePassword.padEnd(8, '0');
    } else if (!securePassword) {
      securePassword = 'TSW@' + Math.random().toString(36).substring(2, 8).toUpperCase() + '01';
    }

    try {
      const signupResponse = await fetchApi('/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: finalCustomerEmail,
          password: securePassword,
          full_name: formData.fullName,
          username: formData.username,
          mobile: formData.mobile,
          dob: formData.dob,
          gender: formData.gender,
          state: formData.state,
          city: formData.city,
          pin_code: formData.pinCode,
          referral_code: formData.referralCode,
          package_id: formData.packageId
        })
      });

      const signupResult = await signupResponse.json();

      if (!signupResponse.ok) {
        if (signupResult.error?.toLowerCase().includes('already registered')) {
          const loginRes = await fetchApi('/login', {
            method: 'POST',
            body: JSON.stringify({
              email: finalCustomerEmail,
              password: securePassword
            })
          });
          const loginResult = await loginRes.json();
          if (!loginRes.ok) throw new Error('Account access issue. Please log in with your email and password.');

          if (loginResult.session) {
            localStorage.setItem('tsw_fallback_session', JSON.stringify(loginResult.session));
            window.dispatchEvent(new Event('tsw-auth-change'));
            try {
              await supabase.auth.setSession({
                access_token: loginResult.session.access_token,
                refresh_token: loginResult.session.refresh_token
              });
            } catch {}
          }
        } else {
          throw new Error(signupResult.error || 'Account could not be created. Please contact support.');
        }
      } else if (signupResult.session) {
        localStorage.setItem('tsw_fallback_session', JSON.stringify(signupResult.session));
        window.dispatchEvent(new Event('tsw-auth-change'));
        try {
          await supabase.auth.setSession({
            access_token: signupResult.session.access_token,
            refresh_token: signupResult.session.refresh_token
          });
        } catch {}
      }

      await fetchApi('/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          package_id: formData.packageId,
          package_name: selectedPackage?.name || 'VIP Package',
          original_price: selectedPackage?.originalPrice || selectedPackage?.original_price || selectedPackage?.price || finalPrice,
          discount_amount: discountAmount,
          amount: finalPrice,
          email: finalCustomerEmail,
          full_name: formData.fullName,
          username: formData.username,
          mobile: formData.mobile,
          city: formData.city,
          state: formData.state,
          pin_code: formData.pinCode,
          referral_code: formData.referralCode,
          status: 'completed',
          user_id: signupResult.user?.id || finalCustomerEmail
        })
      }).catch(e => console.warn("Order update warning:", e));

      navigate('/dashboard?payment=success');
    } catch (err: any) {
      console.error("Post-payment error:", err);
      setErrors({ general: `Payment successful but account setup failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
    "Lakshadweep", "Puducherry"
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <SEO 
        title="Register | The Smart Worth - Join India's Best Earning Platform"
        description="Create your The Smart Worth account today. Join thousands of students learning digital skills and building successful careers with Sahil Aureon."
      />
      <Navbar />
      <PageHeader title="Register" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-14 relative z-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-10 border border-gray-50 relative"
          >
            {/* Logo in Card */}
            <div className="flex justify-center mb-8">
              <svg width="160" height="40" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
                <defs>
                  <linearGradient id="logoGradientReg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#615DFA" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
                <text x="0" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="url(#logoGradientReg)" letterSpacing="-1">The</text>
                <text x="50" y="35" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" fill="#0A0E27" letterSpacing="-1">Smart Worth</text>
                <rect x="0" y="42" width="195" height="3" rx="1.5" fill="url(#logoGradientReg)" />
              </svg>
            </div>

            <div className="mb-8">
              <h2 className="text-[#615DFA] font-black text-xs mb-1 tracking-widest uppercase">Register Account</h2>
              <h3 className="text-2xl md:text-3xl font-black text-[#0A0E27] tracking-tight">
                {step === 1 ? 'Step 1: Basic Info 🤩' : step === 2 ? 'Step 2: Personal Details 📋' : 'Step 3: Select Package 🎁'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {errors.general && (
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
                  <span className="font-bold text-xs">{errors.general}</span>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <User size={18} />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Enter Your Full Name"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 ${isStepSubmitted && errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                        />
                      </div>
                      {isStepSubmitted && errors.fullName && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.fullName}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <AtSign size={18} />
                        </div>
                        <input
                          type="text"
                          name="username"
                          placeholder="Enter Your Username"
                          required
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 ${isStepSubmitted && errors.username ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                        />
                      </div>
                      {isStepSubmitted && errors.username && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.username}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Example@gmail.com"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 ${isStepSubmitted && errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                        />
                      </div>
                      {isStepSubmitted && errors.email && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.email}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Number */}
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <Phone size={18} />
                        </div>
                        <input
                          type="tel"
                          name="mobile"
                          placeholder="0987654321"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8FAFF] border-2 ${isStepSubmitted && errors.mobile ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                        />
                      </div>
                      {isStepSubmitted && errors.mobile && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.mobile}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Create Strong Password (min. 8 characters)"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8FAFF] border-2 ${isStepSubmitted && errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-100'} focus:border-[#615DFA] focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none transition-all text-sm font-medium placeholder:text-gray-400`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#615DFA] transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {isStepSubmitted && errors.password ? (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.password}</span>
                        </motion.div>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-1 ml-1 font-medium">Must be at least 8 characters</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    {/* State */}
                    <div className="md:col-span-2">
                      <AnimatedSelect
                        label="State"
                        value={formData.state}
                        placeholder="Select Your State"
                        size="sm"
                        options={indianStates.map(s => ({ label: s, value: s }))}
                        onSelect={(val) => {
                          setErrors(prev => {
                            const { state, city, ...rest } = prev;
                            return rest;
                          });
                          setFormData({ ...formData, state: val, city: '' });
                        }}
                        isOpen={openSelect === 'state'}
                        onOpen={() => setOpenSelect('state')}
                        onClose={() => setOpenSelect(null)}
                        error={isStepSubmitted && !!errors.state}
                        errorMessage={isStepSubmitted ? errors.state : undefined}
                      />
                    </div>

                    {/* City */}
                    <div className="md:col-span-2">
                      <AnimatedSelect
                        label="City"
                        value={formData.city}
                        placeholder={formData.state ? "Select Your City" : "Select State First"}
                        size="sm"
                        subTitle={formData.state ? `State: ${formData.state}` : undefined}
                        options={formData.state ? (stateCities[formData.state] || []).map(c => ({ label: c, value: c })) : []}
                        onSelect={(val) => {
                          setErrors(prev => {
                            const { city, ...rest } = prev;
                            return rest;
                          });
                          setFormData({ ...formData, city: val });
                        }}
                        isOpen={openSelect === 'city'}
                        onOpen={() => formData.state && setOpenSelect('city')}
                        onClose={() => setOpenSelect(null)}
                        disabled={!formData.state}
                        error={isStepSubmitted && !!errors.city}
                        errorMessage={isStepSubmitted ? errors.city : undefined}
                      />
                    </div>

                    {/* DOB */}
                    <div className="space-y-1.5">
                      <div className={cn(
                        "relative group rounded-xl bg-[#F8FAFF] border transition-all",
                        isStepSubmitted && errors.dob ? 'border-red-500 bg-red-50/30' : 'border-gray-100 focus-within:border-[#615DFA] focus-within:bg-white focus-within:ring-4 focus-within:ring-secondary/5'
                      )}>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none z-30">
                          <Calendar size={18} />
                        </div>
                        <input
                          type="date"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full pl-11 pr-10 py-3 rounded-xl bg-transparent outline-none transition-all text-sm font-medium appearance-none relative z-20",
                            !formData.dob ? "text-transparent" : "text-[#0A0E27]"
                          )}
                        />
                        {!formData.dob && (
                          <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm font-medium z-10">
                            Select Date of Birth
                          </div>
                        )}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-30">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                      {isStepSubmitted && errors.dob && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.dob}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Gender */}
                    <AnimatedSelect
                      label="Gender"
                      value={formData.gender}
                      placeholder="Select Gender"
                      size="sm"
                      options={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' }
                      ]}
                      onSelect={(val) => {
                        setErrors(prev => {
                          const { gender, ...rest } = prev;
                          return rest;
                        });
                        setFormData({ ...formData, gender: val });
                      }}
                      isOpen={openSelect === 'gender'}
                      onOpen={() => setOpenSelect('gender')}
                      onClose={() => setOpenSelect(null)}
                      error={isStepSubmitted && !!errors.gender}
                      errorMessage={isStepSubmitted ? errors.gender : undefined}
                    />

                    {/* Pin Code */}
                    <div className="space-y-1.5">
                      <div className={cn(
                        "relative group rounded-xl bg-[#F8FAFF] border transition-all",
                        isStepSubmitted && errors.pinCode ? 'border-red-500 bg-red-50/30' : 'border-gray-100 focus-within:border-[#615DFA] focus-within:bg-white focus-within:ring-4 focus-within:ring-secondary/5'
                      )}>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#615DFA] transition-colors pointer-events-none">
                          <MapPin size={18} />
                        </div>
                        <input
                          type="tel"
                          name="pinCode"
                          placeholder="Enter Pin Code"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.pinCode}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                        />
                      </div>
                      {isStepSubmitted && errors.pinCode && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.pinCode}</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Package Selection */}
                    <div className="pt-4">
                      {packagesError ? (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">Failed to load packages</span>
                          </div>
                          <BrutalistButton 
                            onClick={(e) => {
                              e.preventDefault();
                              refreshPackages();
                            }}
                            variant="danger"
                            size="sm"
                            showIcons={false}
                            className="px-6"
                          >
                            Retry Connection
                          </BrutalistButton>
                        </div>
                      ) : (
                        <AnimatedSelect
                          label=""
                          value={formData.packageId}
                          placeholder="SELECT YOUR PACKAGE"
                          size="sm"
                          options={packages.map(pkg => ({ 
                            label: pkg.name, 
                            value: pkg.id 
                          }))}
                          onSelect={(val) => {
                            setErrors(prev => {
                              const { package: pkgErr, ...rest } = prev;
                              return rest;
                            });
                            setFormData({ ...formData, packageId: val });
                          }}
                          isOpen={openSelect === 'package'}
                          onOpen={() => setOpenSelect('package')}
                          onClose={() => setOpenSelect(null)}
                          loading={packagesLoading}
                          error={isStepSubmitted && !!errors.package}
                          errorMessage={isStepSubmitted ? errors.package : undefined}
                        />
                      )}
                    </div>

                    {/* Package Preview Card */}
                    <div className="relative min-h-[300px] flex items-center justify-center">
                      {packagesLoading ? (
                        <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse w-full">
                          <div className="w-40 h-56 bg-white rounded-2xl shadow-inner flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          </div>
                          <div className="space-y-3 flex flex-col items-center w-full max-w-[200px]">
                            <div className="h-6 w-full bg-white rounded-lg" />
                            <div className="h-4 w-3/4 bg-white rounded-lg" />
                          </div>
                        </div>
                      ) : !selectedPackage ? (
                        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-200 shadow-inner border border-blue-50">
                            <Package size={48} />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-[#0A0E27] tracking-tight">Select a Package</h4>
                            <p className="text-sm text-gray-400 font-medium max-w-[200px]">Choose your path to see the exclusive benefits</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative z-10 flex flex-col gap-8 w-full">
                          {/* Top: Book Thumbnail Container */}
                          <div className="w-full flex justify-center">
                            <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center p-8 group">
                              {(!imageLoaded || !selectedPackage?.thumbnail_url) && (
                                <div className="w-full h-full bg-blue-50/30 rounded-2xl animate-pulse flex items-center justify-center relative z-20">
                                  <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                              )}

                              {selectedPackage?.thumbnail_url && (
                                <img 
                                  src={selectedPackage.thumbnail_url} 
                                  alt="Package Thumbnail" 
                                  className={cn(
                                    "w-full h-auto max-h-full object-contain relative z-10 transform group-hover:scale-105 transition-all duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]",
                                    !imageLoaded ? "opacity-0 invisible absolute" : "opacity-100 visible"
                                  )}
                                  onLoad={() => setImageLoaded(true)}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop";
                                    setImageLoaded(true);
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Bottom: Details */}
                          <div className="w-full space-y-6">
                            <div className="space-y-2">
                              <span className="text-[11px] font-black text-[#615DFA] uppercase tracking-[0.2em] block">Book</span>
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-3xl font-black text-[#0A0E27] tracking-tighter leading-tight">
                                  {selectedPackage?.name}
                                </h4>
                                {selectedPackage?.rating !== undefined && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-black text-[#0A0E27] tracking-tight">{selectedPackage.rating || '4.6'}</span>
                                    <span className="text-sm font-medium text-gray-400 ml-0.5">(1.2k)</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent opacity-50" />

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-500">Real Price</span>
                                <span className="text-xl font-black text-gray-400/80 line-through tracking-tight">₹{formatPrice(realPrice)}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-500">Offer Price</span>
                                <span className="text-2xl font-black text-[#0A0E27] tracking-tight">₹{formatPrice(offerPrice)}</span>
                              </div>

                              <div className="flex gap-2 items-center pt-2">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="Enter Referral Code"
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                    className={cn(
                                      "w-full pl-4 pr-4 py-3 rounded-xl bg-white border text-sm font-bold uppercase tracking-wider outline-none transition-all",
                                      discountError ? "border-red-300 focus:border-red-500" : 
                                      isDiscountApplied ? "border-green-300 focus:border-green-500" : 
                                      "border-gray-200 focus:border-secondary"
                                    )}
                                  />
                                  {isDiscountApplied && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                      <Zap size={16} className="fill-green-500" />
                                    </div>
                                  )}
                                </div>
                                  <BrutalistButton
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    disabled={isValidatingDiscount || !formData.referralCode}
                                    loading={isValidatingDiscount}
                                    variant="secondary"
                                    size="md"
                                    showIcons={false}
                                    shadow={false}
                                    className="px-8"
                                    containerClassName="p-2 overflow-visible"
                                  >
                                    Apply
                                  </BrutalistButton>
                              </div>
                              {discountError && (
                                <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 flex items-center gap-1">
                                  <AlertCircle size={10} /> {discountError}
                                </p>
                              )}
                              {isDiscountApplied && (
                                <p className="text-[10px] font-bold text-green-600 mt-1.5 ml-1 flex items-center gap-1">
                                  <Zap size={10} className="fill-green-600" /> Discount Applied Successfully!
                                </p>
                              )}

                              <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-bold text-gray-500">Discount</span>
                                <span className="text-lg font-black text-red-500">- ₹{formatPrice(discountAmount)}</span>
                              </div>

                              <div className="pt-4 border-t border-dashed border-secondary/20 flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Final Price</span>
                                </div>
                                <span className="text-3xl font-black text-[#615DFA] tracking-tighter">
                                  ₹{formatPrice(finalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Agreements */}
                  <div className="space-y-3 px-1">
                    <div className="space-y-1.5">
                      <Checkbox 
                        label="Agree Terms & Conditions"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleInputChange}
                        error={isStepSubmitted && !!errors.terms}
                      />
                      {isStepSubmitted && errors.terms && (
                        <motion.div layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.terms}</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Checkbox 
                        label="Agree Refund Policy"
                        name="agreeRefund"
                        checked={formData.agreeRefund}
                        onChange={handleInputChange}
                        error={isStepSubmitted && !!errors.refund}
                      />
                      {isStepSubmitted && errors.refund && (
                        <motion.div layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="field-error-message flex items-center space-x-1 mt-1 text-red-500 text-[11px] font-bold ml-1">
                          <AlertCircle size={12} />
                          <span>{errors.refund}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {step > 1 && (
                  <BrutalistButton
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    variant="secondary"
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </BrutalistButton>
                )}
                <BrutalistButton
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="flex-[2]"
                  size="lg"
                >
                  {step === 3 ? 'Register Buy' : 'Next Step'}
                </BrutalistButton>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#615DFA] font-black hover:underline ml-1">Click Here</Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      
      {/* Payment Gateway Pop Up Modal (Fast UPI & Direct Intent Auto-Verify) */}
      {activeOrder && (
        <CustomCheckoutModal
          isOpen={!!activeOrder}
          onClose={() => setActiveOrder(null)}
          orderId={activeOrder.id}
          amount={activeOrder.amount}
          packageName={activeOrder.packageName}
          initialUpiUrl={activeOrder.upiUrl}
          initialQrUrl={activeOrder.qrUrl}
          initialPaymentId={activeOrder.paymentId}
          originalPrice={Number(selectedPackage?.originalPrice || selectedPackage?.original_price || selectedPackage?.price || activeOrder.amount)}
          discountAmount={discountAmount}
          customerName={formData.fullName}
          customerUsername={formData.username}
          customerEmail={formData.email}
          customerPhone={formData.mobile}
          customerCity={formData.city}
          customerState={formData.state}
          customerPinCode={formData.pinCode}
          referralCode={formData.referralCode}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </div>
  );
};

export default Register;
