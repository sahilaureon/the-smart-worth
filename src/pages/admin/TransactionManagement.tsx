import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
  RefreshCw
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import LoadingScreen from '../../components/LoadingScreen';

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'razorpay_orders',
        query: { order: { column: 'created_at', ascending: false } }
      });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const onFastReload = () => fetchTransactions();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const normalizeTxStatus = (statusStr?: string): 'paid' | 'failed' | 'pending' => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'paid' || s === 'approved' || s === 'completed' || s === 'success') return 'paid';
    if (s === 'failed' || s === 'rejected' || s === 'cancelled') return 'failed';
    return 'pending';
  };

  const updateStatus = async (txId: string, status: 'paid' | 'failed' | 'pending') => {
    try {
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'razorpay_orders',
        payload: { id: txId, data: { status } }
      });
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === txId ? { ...tx, status } : tx))
      );
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx({ ...selectedTx, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (txId: string) => {
    try {
      await invokeAdminFunction('admin-action', {
        action: 'delete',
        table: 'razorpay_orders',
        payload: { id: txId }
      });
      setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx(null);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(tx.user_name || '').toLowerCase().includes(q) ||
      String(tx.user_email || '').toLowerCase().includes(q) ||
      String(tx.username || '').toLowerCase().includes(q) ||
      String(tx.order_id || '').toLowerCase().includes(q) ||
      String(tx.payment_id || '').toLowerCase().includes(q) ||
      String(tx.description || '').toLowerCase().includes(q);

    const st = normalizeTxStatus(tx.status);
    const matchesStatus = filterStatus === 'all' || st === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Track and manage all customer enrollments and payments.</p>
        </div>
        <button
          type="button"
          onClick={fetchTransactions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
          title="Reload Transactions"
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
              placeholder="Search customer, email, order ID..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-indigo-600 outline-none w-full sm:w-72 shadow-2xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:border-indigo-600 outline-none shadow-2xs cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status ({transactions.length})</option>
              <option value="paid">Success / Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              type="button"
              onClick={fetchTransactions}
              className="p-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Refresh & Sync Status"
            >
              <RefreshCw className={cn('w-4 h-4 text-indigo-600', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Order / Txn ID
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer (Kaun User Kiya)
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  User Details &amp; Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const st = normalizeTxStatus(tx.status);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-mono font-bold text-slate-800">
                          {tx.order_id || `#${String(tx.id).slice(0, 10)}`}
                        </p>
                        {tx.payment_id && (
                          <p className="text-[11px] font-mono text-indigo-600 mt-0.5">
                            {tx.payment_id}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {tx.user_name || 'Guest Customer'}
                        </p>
                        <p className="text-xs text-slate-500">{tx.user_email || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-800">
                          {tx.package_name || tx.description}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p
                          className={cn(
                            'font-black text-sm',
                            st === 'paid'
                              ? 'text-emerald-600'
                              : st === 'failed'
                              ? 'text-rose-600 line-through'
                              : 'text-amber-600'
                          )}
                        >
                          {st === 'paid' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider',
                            st === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : st === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {st === 'paid' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          ) : st === 'pending' ? (
                            <Clock className="w-3.5 h-3.5 mr-1" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          {st === 'paid' ? 'SUCCESS' : st === 'failed' ? 'FAILED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>User Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-md transition-colors shadow-2xs cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User & Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-slate-200 border-t-4 border-t-amber-500 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b-2 border-amber-500">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  Customer &amp; Payment Record
                </span>
                <h3 className="text-lg font-serif font-bold text-white">
                  User &amp; Transaction Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  {selectedTx.user_profile_pic ? (
                    <img
                      src={optimizeCloudinaryUrl(selectedTx.user_profile_pic, 100, 100)}
                      alt={selectedTx.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(selectedTx.user_name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-slate-900 text-base truncate">
                    {selectedTx.user_name || 'Valued Customer'}
                  </h4>
                  <p className="text-xs font-bold text-indigo-600 truncate">
                    @{selectedTx.username || 'student'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedTx.user_email || 'No email recorded'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-amber-300 px-4 py-2.5 text-xs font-serif font-bold uppercase tracking-wider">
                  Customer Details (Kaun User Kiya Hai)
                </div>
                <div className="divide-y divide-dashed divide-slate-200 px-4 py-1 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> Full Name
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_name || 'Guest Customer'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Username</span>
                    <span className="font-bold text-indigo-700 text-right">
                      @{selectedTx.username || 'student'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Address
                    </span>
                    <span className="font-bold text-slate-900 text-right break-all">
                      {selectedTx.user_email || 'N/A'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" /> Mobile Number
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_phone ? `+91 ${selectedTx.user_phone}` : 'Not provided'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Address
                    </span>
                    <span className="font-bold text-slate-900 text-right">
                      {selectedTx.user_address || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-amber-300 px-4 py-2.5 text-xs font-serif font-bold uppercase tracking-wider">
                  Package &amp; Payment Details
                </div>
                <div className="divide-y divide-dashed divide-slate-200 px-4 py-1 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Package Name</span>
                    <span className="font-serif font-bold text-slate-950 text-right">
                      {selectedTx.package_name || selectedTx.description}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Amount</span>
                    <span className="text-base font-black text-indigo-700 text-right">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Order ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs text-right break-all">
                      {selectedTx.order_id || selectedTx.id}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs text-right break-all">
                      {selectedTx.payment_id || 'Not captured / N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`/api/payment/receipt-pdf/${encodeURIComponent(
                    selectedTx.order_id || selectedTx.id
                  )}?payment_id=${encodeURIComponent(
                    selectedTx.payment_id || ''
                  )}&email=${encodeURIComponent(
                    selectedTx.user_email || ''
                  )}&status=${encodeURIComponent(
                    normalizeTxStatus(selectedTx.status) === 'paid' ? 'paid' : 'failed'
                  )}`}
                  download={`TheSmartWorth-Receipt-${selectedTx.order_id || selectedTx.id}.pdf`}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Receipt</span>
                </a>
                <a
                  href={`/api/payment/invoice/${encodeURIComponent(
                    selectedTx.order_id || selectedTx.id
                  )}?payment_id=${encodeURIComponent(
                    selectedTx.payment_id || ''
                  )}&email=${encodeURIComponent(
                    selectedTx.user_email || ''
                  )}&status=${encodeURIComponent(
                    normalizeTxStatus(selectedTx.status) === 'paid' ? 'paid' : 'failed'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Classic Invoice</span>
                </a>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600">Update Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedTx.id, 'paid')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Mark Success
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedTx.id, 'failed')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Mark Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
