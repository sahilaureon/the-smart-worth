import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Shield, User, CreditCard, Landmark, FileText, CheckCircle, Clock, XCircle, SearchIcon, Eye, Download, ChevronRight, RefreshCw } from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { formatCurrency, cn } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';

const KYCManagement = () => {
  const [kycRecords, setKycRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    fetchKYCRecords();
    const onFastReload = () => fetchKYCRecords();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const fetchKYCRecords = async () => {
    try {
      setLoading(true);
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'kyc_records',
        query: { order: { column: 'updated_at', ascending: false } }
      });
      setKycRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching KYC records:', err);
      setKycRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = kycRecords.filter(record => 
    record.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.aadhar_number?.includes(searchQuery)
  );

  if (loading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">KYC Verification Tracking</h2>
          <p className="text-slate-500 font-bold text-sm">Review and track user sensitive document details.</p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-300 px-3.5 py-2 rounded-md shadow-2xs flex-1 md:w-72">
            <Search size={16} className="text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by name, email or ID..."
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-900 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={fetchKYCRecords}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Reload KYC Records"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", loading && "animate-spin")} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Records List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aadhar</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className={cn(
                        "hover:bg-slate-50 transition-colors cursor-pointer group",
                        selectedRecord?.id === record.id ? "bg-indigo-50/30" : ""
                      )}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {record.profiles?.profile_pic ? (
                              <img src={record.profiles.profile_pic} className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 line-clamp-1">{record.profiles?.full_name || 'User'}</p>
                            <p className="text-[10px] font-bold text-slate-400">{record.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600 font-mono tracking-wider">{record.aadhar_number || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="text-xs font-bold text-slate-600">{record.bank_name || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{record.ifsc_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest uppercase">
                          RECORDED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 rounded-md text-slate-700 text-xs font-semibold transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                        >
                          <Eye size={14} className="text-indigo-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-slate-400 font-bold">No KYC records found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Record Detail */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden sticky top-8">
            <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <Shield size={120} />
              </div>
              <div className="relative">
                <h3 className="text-lg font-black tracking-tight mb-2">Member Details</h3>
                {selectedRecord ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white p-1 shadow-2xl">
                      {selectedRecord.profiles?.profile_pic ? (
                        <img src={selectedRecord.profiles.profile_pic} className="w-full h-full rounded-[1.2rem] object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-black">
                          {selectedRecord.profiles?.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-black">{selectedRecord.profiles?.full_name}</p>
                      <p className="text-indigo-100 text-xs font-bold">{selectedRecord.profiles?.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-100 font-bold text-sm">Select a member to view full details</p>
                )}
              </div>
            </div>

            <div className="p-8 space-y-8">
              {selectedRecord ? (
                <>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Verification IDs</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aadhar Card</p>
                        <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{selectedRecord.aadhar_number || '--'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">PAN Card</p>
                        <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{selectedRecord.pan_number || '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Bank Settlement</h4>
                    <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Bank</span>
                        <span className="text-sm font-black text-slate-900">{selectedRecord.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Account No</span>
                        <span className="text-sm font-black text-slate-900">{selectedRecord.account_number}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
                        <span className="text-sm font-black text-slate-900">{selectedRecord.ifsc_code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Holder</span>
                        <span className="text-sm font-black text-slate-900">{selectedRecord.holder_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Payment Method</h4>
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-[1.5rem] text-white relative overflow-hidden group">
                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                      <div className="flex justify-between items-start mb-10">
                        <CreditCard size={24} className="text-indigo-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Smart Worth Card</span>
                      </div>
                      <p className="text-lg font-mono tracking-[0.3em] mb-4">{selectedRecord.atm_card_number || '0000 0000 0000 0000'}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-40 mb-0.5">Expiry</p>
                          <p className="text-xs font-bold tracking-widest">{selectedRecord.atm_expiry || 'MM/YY'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-40 mb-0.5">CVV</p>
                          <p className="text-xs font-bold tracking-widest">{selectedRecord.atm_cvv || '***'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <User size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Please select a record from the list to view all details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCManagement;
