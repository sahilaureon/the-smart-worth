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
  Image as ImageIcon,
  Sparkles,
  UserCheck
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

  // In-line confirmation states (avoids blocked window.confirm in iframes)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearAllPrompt, setShowClearAllPrompt] = useState(false);

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
    setIsDeleting(id);
    try {
      const res = await fetchApi(`/admin/payment-tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        setConfirmDeleteId(null);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllTickets = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetchApi('/admin/payment-tickets/clear-all', { method: 'POST' });
      if (res.ok) {
        setTickets([]);
        setShowClearAllPrompt(false);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner - Classic & Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-400 text-slate-900 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Payment Helper &amp; Ticket Resolution
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 max-w-xl font-medium">
            Review user payment issues, inspect real uploaded screenshot proofs and UTRs, and manually activate student accounts with matching packages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {tickets.length > 0 && (
            <>
              {showClearAllPrompt ? (
                <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-300">
                  <span className="text-[11px] font-bold text-red-700 px-1">Clear all tickets?</span>
                  <button
                    type="button"
                    onClick={handleClearAllTickets}
                    disabled={isClearingAll}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                  >
                    {isClearingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Delete All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearAllPrompt(false)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearAllPrompt(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-slate-300 hover:border-red-400 transition-all cursor-pointer"
                  title="Clear any test or demo tickets"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Test Data</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={fetchTickets}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#615DFA] hover:bg-[#504bd6] text-white font-bold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider block">Pending Action</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pending}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">Requires UTR verification</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider block">Approved &amp; Enrolled</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.approved}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">Accounts activated</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-[11px] font-black text-red-600 uppercase tracking-wider block">Rejected</span>
          <span className="text-2xl font-black text-red-600 mt-1 block">{stats.rejected}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">Invalid or mismatched UTR</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">Total Raised</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">All submissions</span>
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
              <option value="all">All Tickets ({stats.total})</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Tickets List - Classic Card System */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#615DFA]" />
            <span className="font-bold">Loading payment tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-3 px-4">
            <div className="w-14 h-14 mx-auto bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-center justify-center text-slate-400">
              <LifeBuoy className="w-7 h-7" />
            </div>
            <div>
              <p className="font-black text-base text-slate-900">No payment helper tickets found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                When users face payment issues on the payment gateway and click "Raise a Ticket", their screenshots, UTRs, and details will arrive here in real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchTickets}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {tickets.map((ticket) => {
              const isPending = ticket.status === 'pending';
              const isApproved = ticket.status === 'approved';
              const isRejected = ticket.status === 'rejected';
              const cleanMobile = String(ticket.mobile || '').replace(/\D/g, '').slice(-10);
              const isConfirmingDelete = confirmDeleteId === ticket.id;

              return (
                <div key={ticket.id} className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left Column: Details */}
                    <div className="flex-1 space-y-3">
                      {/* Top Bar: Ticket ID & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                          #{ticket.id}
                        </span>

                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Action Required</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved &amp; Enrolled</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-red-100 text-red-900 border border-red-300">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-medium">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
                        </span>
                      </div>

                      {/* User Identity Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-medium">Student:</span>
                          <span className="font-bold text-slate-900 text-sm">{ticket.full_name || 'Student Lead'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{ticket.email}</span>
                        </div>
                        {cleanMobile && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800">+91 {cleanMobile}</span>
                          </div>
                        )}
                        {(ticket.city || ticket.state) && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600 font-medium">
                              {[ticket.city, ticket.state, ticket.pin_code].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Package & Order Match */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg">
                          <Package className="w-3.5 h-3.5 inline mr-1" />
                          {ticket.package_name || ticket.package_id || 'VIP Package'}
                        </span>
                        <span className="font-black text-emerald-600 text-sm">₹{ticket.amount || 599}</span>
                        <span className="text-slate-400">• Order:</span>
                        <span className="font-mono text-slate-700 font-semibold">{ticket.order_id || 'N/A'}</span>
                      </div>

                      {/* 12-Digit UTR Highlight */}
                      <div className="flex items-center space-x-2.5 pt-1">
                        <span className="text-xs font-bold text-slate-600">UTR / Ref:</span>
                        <code className="px-3 py-1 bg-amber-50 border-2 border-amber-300 rounded-lg text-xs font-mono font-black text-amber-900 tracking-wider">
                          {ticket.utr_number}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyUtr(ticket.utr_number)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Copy UTR"
                        >
                          {copiedUtr === ticket.utr_number ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* User's Note */}
                      {ticket.issue_description && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                          <span className="font-bold text-slate-500 block mb-0.5 text-[10px] uppercase tracking-wider">
                            Student Issue Remarks:
                          </span>
                          "{ticket.issue_description}"
                        </div>
                      )}

                      {/* Admin Notes if any */}
                      {ticket.admin_notes && (
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-blue-700">
                            Admin Resolution Note:
                          </span>
                          {ticket.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Screenshot Preview & Interactive Action Buttons */}
                    <div className="flex flex-col items-start lg:items-end justify-between gap-4 shrink-0 pt-2 lg:pt-0">
                      {ticket.screenshot_url ? (
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => setEnlargedScreenshot(ticket.screenshot_url)}
                          title="Click to zoom screenshot"
                        >
                          <img
                            src={ticket.screenshot_url}
                            alt="Payment Screenshot"
                            className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] group-hover:opacity-90 transition-opacity bg-slate-100"
                          />
                          <div className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>Enlarge Proof</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[11px] text-center p-2">
                          <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                          <span>No Screenshot</span>
                        </div>
                      )}

                      {/* Action Buttons Toolbar - 100% Clickable & Responsive */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {cleanMobile && (
                          <a
                            href={`https://wa.me/91${cleanMobile}?text=Hello%20${encodeURIComponent(
                              ticket.full_name || 'Student'
                            )},%20we%20have%20received%20your%20Payment%20Helper%20ticket%20%23${ticket.id}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-500 rounded-xl transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#059669]"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        {cleanMobile && (
                          <a
                            href={`tel:+91${cleanMobile}`}
                            className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border-2 border-sky-400 rounded-xl transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#0284c7]"
                            title="Call Student"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}

                        {/* Approve Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenApproveModal(ticket)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isApproved ? 'Update Account' : 'Approve & Create'}</span>
                        </button>

                        {/* Reject Button */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTicketToReject(ticket);
                              setRejectReason('UTR number does not match banking statement.');
                            }}
                            className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border-2 border-slate-300 hover:border-red-400 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        {/* Delete Button with in-line confirm (No window.confirm in iframe!) */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-300">
                            <button
                              type="button"
                              disabled={isDeleting === ticket.id}
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                            >
                              {isDeleting === ticket.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(ticket.id)}
                            className="p-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-2 border-slate-200 hover:border-red-300 rounded-xl transition-colors cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Enlarge Screenshot Preview */}
      {enlargedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative bg-white border-2 border-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_#0f172a]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900">Payment Proof Screenshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedScreenshot(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950">
              <img
                src={enlargedScreenshot}
                alt="Enlarged Payment Proof"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Verify the transaction amount, bank reference, and date-time.</span>
              <a
                href={enlargedScreenshot}
                download="payment_proof.png"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg border border-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open Original</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Approve & Create Student Account */}
      {activeTicketToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative bg-white border-2 border-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-[8px_8px_0px_0px_#0f172a] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                  Manual Resolution &amp; Student Provisioning
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Approve Ticket #{activeTicketToApprove.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicketToApprove(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {approveSuccess ? (
              <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800 font-black text-base">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>Account Activated Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  {approveSuccess.message}
                </p>
                <div className="p-3 bg-white border border-emerald-300 rounded-lg space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Email:</span>
                    <span className="font-bold text-slate-900">{approveSuccess.credentials?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Password:</span>
                    <span className="font-bold text-slate-900">{approveSuccess.credentials?.password}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTicketToApprove(null);
                    fetchTickets();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmApproval} className="space-y-4">
                {approveError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{approveError}</span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Name:</span>
                    <span className="font-bold text-slate-900">{activeTicketToApprove.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-900">{activeTicketToApprove.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UTR Reference:</span>
                    <span className="font-mono font-bold text-amber-700">{activeTicketToApprove.utr_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-emerald-600">₹{activeTicketToApprove.amount || 599}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Package to Assign:
                  </label>
                  <select
                    value={assignedPackage}
                    onChange={(e) => setAssignedPackage(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA] focus:bg-white"
                  >
                    <option value="silver">Silver Worth (₹599)</option>
                    <option value="gold">Gold Worth (₹999)</option>
                    <option value="diamond">Diamond Worth (₹1,499)</option>
                    <option value="platinum">Platinum Worth (₹1,999)</option>
                    <option value="pro">Pro Worth (₹2,999)</option>
                    <option value="creator">Creator Worth (₹4,999)</option>
                    <option value="business">Business Worth (₹7,999)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Initial Password for Student:
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA] focus:bg-white"
                      placeholder="e.g. Student@123"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Internal Verification Remarks:
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA] focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTicketToApprove(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 cursor-pointer"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>Confirm &amp; Provision User</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Ticket */}
      {activeTicketToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative bg-white border-2 border-slate-900 rounded-2xl max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#0f172a] space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Reject Ticket #{activeTicketToReject.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide a reason for rejecting this ticket.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicketToReject(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white"
                  placeholder="e.g. UTR number not matching bank statement."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicketToReject(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 cursor-pointer"
                >
                  {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
