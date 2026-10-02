import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  ArrowUpRight,
  User,
  IndianRupee,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';
import { fetchApi } from '../../lib/api';

export default function WithdrawalManagement() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/admin/payouts');
      if (!response.ok) throw new Error('Failed to fetch payouts');
      const data = await response.json();
      setPayouts(data || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
    const onFastReload = () => fetchPayouts();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'paid', userId: string, amount: number) => {
    setProcessing(true);
    try {
      const response = await fetchApi('/admin/handle-payout', {
        method: 'POST',
        body: JSON.stringify({
          payoutId: id,
          status,
          adminNote: adminNote,
          userId,
          amount
        })
      });

      if (!response.ok) throw new Error('Failed to update payout');

      setSelectedWithdrawal(null);
      setAdminNote('');
      await fetchPayouts();
      alert(`Withdrawal ${status} successfully!`);
    } catch (error) {
      console.error(`Error ${status} payout:`, error);
      alert("Failed to process payout.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayouts = payouts.filter(w => {
    const matchesSearch = w.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         w.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Withdrawal Requests</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Review and process affiliate payout requests.</p>
        </div>
        <button
          type="button"
          onClick={fetchPayouts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
          title="Reload Withdrawals"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", loading && "animate-spin")} />
          <span>Reload</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by user or ID..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#615DFA]/20 outline-none w-full sm:w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#615DFA]/20 outline-none shadow-sm cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : filteredPayouts.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#615DFA]/10 flex items-center justify-center text-[#615DFA] font-bold text-xs">
                        {w.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{w.user?.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-slate-500">{w.user?.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{formatCurrency(w.amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">
                        {w.method}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      w.status === 'approved' || w.status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                      w.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {w.status === 'approved' || w.status === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                       w.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      type="button"
                      onClick={() => setSelectedWithdrawal(w)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedWithdrawal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Withdrawal Details</h3>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-xl font-black text-[#615DFA]">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    selectedWithdrawal.status === 'approved' || selectedWithdrawal.status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                    selectedWithdrawal.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method: {(selectedWithdrawal.method || 'upi').toUpperCase()}</p>
                {(selectedWithdrawal.method || '').toLowerCase() === 'upi' ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">UPI ID:</p>
                    <p className="text-sm font-mono text-[#615DFA]">{selectedWithdrawal.details?.upi_id || selectedWithdrawal.upi_id || 'N/A'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-xs text-slate-500">Bank:</p>
                      <p className="text-sm font-bold text-slate-700">{selectedWithdrawal.details?.bank_name || selectedWithdrawal.bank_name || 'N/A'}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-slate-500">Account:</p>
                      <p className="text-sm font-bold text-slate-700">{selectedWithdrawal.details?.account_number || selectedWithdrawal.account_number || 'N/A'}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-slate-500">IFSC:</p>
                      <p className="text-sm font-bold text-slate-700">{selectedWithdrawal.details?.ifsc || selectedWithdrawal.ifsc_code || 'N/A'}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-slate-500">Holder:</p>
                      <p className="text-sm font-bold text-slate-700">{selectedWithdrawal.details?.holder_name || selectedWithdrawal.account_holder_name || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Note (Optional)</label>
                    <textarea 
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note for the user..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#615DFA]/20 outline-none h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => handleAction(selectedWithdrawal.id, 'rejected', selectedWithdrawal.user_id, selectedWithdrawal.amount)}
                      disabled={processing}
                      className="py-2.5 rounded-md bg-white border border-rose-300 text-rose-700 font-semibold text-sm hover:bg-rose-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      Reject Request
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleAction(selectedWithdrawal.id, 'paid', selectedWithdrawal.user_id, selectedWithdrawal.amount)}
                      disabled={processing}
                      className="py-2.5 rounded-md bg-indigo-600 border border-indigo-700 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              )}

              {selectedWithdrawal.admin_note && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Admin Note</p>
                  <p className="text-sm text-amber-800 italic">"{selectedWithdrawal.admin_note}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
