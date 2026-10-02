import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Package,
  Hash,
  Copy,
  Check,
  Eye,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Key,
  MessageSquare,
  Trash2,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function PaymentHelperManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Enlarge Screenshot Modal
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<string | null>(null);

  // Approve & Create Account Modal
  const [activeTicketToApprove, setActiveTicketToApprove] = useState<any | null>(null);
  const [assignedPackage, setAssignedPackage] = useState('silver');
  const [studentPassword, setStudentPassword] = useState('Student@123');
  const [adminNotes, setAdminNotes] = useState('Verified payment screenshot and UTR manually.');
  const [isApproving, setIsApproving] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState<any | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Reject Modal
  const [activeTicketToReject, setActiveTicketToReject] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('UTR number not matching bank statement.');
  const [isRejecting, setIsRejecting] = useState(false);

  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (statusFilter !== 'all') q.set('status', statusFilter);

      const res = await fetchApi(`/admin/payment-tickets?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleOpenApproveModal = (ticket: any) => {
    setActiveTicketToApprove(ticket);
    setAssignedPackage(ticket.package_id || 'silver');
    setStudentPassword('Student@123');
    setAdminNotes(`Verified UTR ${ticket.utr_number} via Payment Helper`);
    setApproveSuccess(null);
    setApproveError(null);
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketToApprove) return;
    setIsApproving(true);
    setApproveError(null);

    try {
      const res = await fetchApi(`/admin/payment-tickets/${activeTicketToApprove.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          admin_notes: adminNotes,
          password: studentPassword,
          package_id: assignedPackage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve ticket.');
      }

      setApproveSuccess(data);
      fetchTickets();
    } catch (err: any) {
      setApproveError(err.message || 'Error approving payment ticket');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketToReject) return;
    setIsRejecting(true);

    try {
      const res = await fetchApi(`/admin/payment-tickets/${activeTicketToReject.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason: rejectReason
        })
      });
      if (res.ok) {
        setActiveTicketToReject(null);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const res = await fetchApi(`/admin/payment-tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-400 text-slate-900 rounded-xl border border-slate-900">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Payment Helper &amp; Ticket Resolution</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Review user payment issues, check uploaded payment screenshots and UTR numbers, and manually verify &amp; activate student accounts with matching packages.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTickets}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Pending Tickets</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pending}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Requires verification</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Approved &amp; Enrolled</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.approved}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Accounts activated</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">Rejected Tickets</span>
          <span className="text-2xl font-black text-red-600 mt-1 block">{stats.rejected}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Invalid reference</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Raised</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">All time submissions</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, email, UTR, name, or order ID..."
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA] focus:bg-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA]"
            >
              <option value="all">All Tickets</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Tickets List */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#615DFA]" />
            <span>Loading payment tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <LifeBuoy className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">No payment tickets found.</p>
            <p className="text-xs text-slate-400">Users who click "Raise a Ticket" on the payment gateway will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const isPending = ticket.status === 'pending';
              const isApproved = ticket.status === 'approved';
              const isRejected = ticket.status === 'rejected';
              const cleanMobile = String(ticket.mobile || '').replace(/\D/g, '').slice(-10);

              return (
                <div key={ticket.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: User details & UTR info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                          #{ticket.id}
                        </span>

                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>Action Required</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved &amp; Enrolled</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ''}
                        </span>
                      </div>

                      {/* User Info Bar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                        <div className="font-bold text-slate-900 text-sm">
                          {ticket.full_name || 'Student Lead'}
                        </div>
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ticket.email}</span>
                        </div>
                        {cleanMobile && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>+91 {cleanMobile}</span>
                          </div>
                        )}
                        {(ticket.city || ticket.state) && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{[ticket.city, ticket.state, ticket.pin_code].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Package & Order Match */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-md">
                          {ticket.package_name || ticket.package_id || 'VIP Package'}
                        </span>
                        <span className="font-extrabold text-emerald-600">₹{ticket.amount || 599}</span>
                        <span className="text-slate-400">• Order:</span>
                        <span className="font-mono text-slate-600">{ticket.order_id || 'N/A'}</span>
                      </div>

                      {/* 12-Digit UTR Highlight */}
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-xs font-bold text-slate-500">UTR / Ref:</span>
                        <code className="px-2.5 py-1 bg-amber-50 border-2 border-amber-300 rounded-lg text-xs font-mono font-black text-amber-900">
                          {ticket.utr_number}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyUtr(ticket.utr_number)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                          title="Copy UTR"
                        >
                          {copiedUtr === ticket.utr_number ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* User's Note */}
                      {ticket.issue_description && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 italic">
                          "{ticket.issue_description}"
                        </div>
                      )}
                    </div>

                    {/* Right: Payment Screenshot Preview & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                      {ticket.screenshot_url ? (
                        <div className="relative group cursor-pointer" onClick={() => setEnlargedScreenshot(ticket.screenshot_url)}>
                          <img
                            src={ticket.screenshot_url}
                            alt="Payment Screenshot"
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            <Eye className="w-5 h-5 mr-1" />
                            <span>Zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[11px] text-center p-2">
                          <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                          <span>No Image Attached</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {cleanMobile && (
                          <a
                            href={`https://wa.me/91${cleanMobile}?text=Hello%20${encodeURIComponent(ticket.full_name || 'Student')},%20we%20have%20received%20your%20Payment%20Helper%20ticket%20%23${ticket.id}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTicketToReject(ticket);
                                setRejectReason('UTR number does not match banking statement.');
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(ticket)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#615DFA] hover:bg-[#504bd6] text-white font-bold text-xs rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Approve &amp; Activate</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enlarged Screenshot Modal */}
      {enlargedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md cursor-pointer"
          onClick={() => setEnlargedScreenshot(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden border-2 border-slate-900 shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">Payment Screenshot Preview</span>
              <button
                type="button"
                onClick={() => setEnlargedScreenshot(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={enlargedScreenshot}
              alt="Enlarged Payment Screenshot"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg mt-2"
            />
          </div>
        </div>
      )}

      {/* Approve & Create Student Account Modal */}
      {activeTicketToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Approve &amp; Activate Student Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicketToApprove(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {approveSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-500">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Verified &amp; Student Activated!</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Student account created for <strong>{activeTicketToApprove.email}</strong> with full access to {assignedPackage}.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1">
                  <div><strong>Email:</strong> {activeTicketToApprove.email}</div>
                  <div><strong>Initial Password:</strong> {studentPassword}</div>
                  <div><strong>Assigned Package:</strong> {assignedPackage}</div>
                  <div><strong>UTR:</strong> {activeTicketToApprove.utr_number}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTicketToApprove(null)}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmApproval} className="p-6 space-y-4 text-xs">
                {approveError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-700 font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{approveError}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div><span className="text-slate-400">Student:</span> <strong>{activeTicketToApprove.full_name}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <strong>{activeTicketToApprove.email}</strong></div>
                  <div><span className="text-slate-400">UTR:</span> <code className="font-mono font-bold text-amber-900">{activeTicketToApprove.utr_number}</code></div>
                  <div><span className="text-slate-400">Address:</span> {[activeTicketToApprove.city, activeTicketToApprove.state].filter(Boolean).join(', ') || 'India'}</div>
                  <div><span className="text-slate-400">Order:</span> {activeTicketToApprove.order_id || 'N/A'}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Matched Package <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignedPackage}
                    onChange={(e) => setAssignedPackage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="creator-worth">Creator Worth</option>
                    <option value="business-worth">Business Worth</option>
                    <option value="tech-worth">Tech Worth</option>
                    <option value="next-worth">Next Worth</option>
                    <option value="finance-worth">Finance Worth</option>
                    <option value="success-worth">Success Worth</option>
                    <option value="pro-worth">Pro Worth</option>
                    <option value="silver">Silver Package</option>
                    <option value="gold">Gold Package</option>
                    <option value="diamond">Diamond Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Student Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="e.g. Student@123"
                      className="w-full pl-9 pr-3.5 py-2 font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admin Approval Notes
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-2 bg-slate-50 border-2 border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTicketToApprove(null)}
                    className="px-4 py-2 text-slate-600 font-bold border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying &amp; Creating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm Approval &amp; Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reject Ticket Modal */}
      {activeTicketToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reject Ticket #{activeTicketToReject.id}</h3>
            <p className="text-xs text-slate-600">
              Provide a reason why this UTR or payment screenshot could not be approved:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTicketToReject(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
