import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  X,
  FileText,
  RefreshCw,
  Check,
  Ban,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';
import { AnimatePresence, motion } from 'motion/react';
import { fetchApi } from '../../lib/api';

export default function SupportManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | 'message' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const normalizeTicketStatus = (rawStatus?: string): 'pending' | 'approved' | 'rejected' => {
    const s = String(rawStatus || 'open').toLowerCase();
    if (s === 'approved' || s === 'resolved' || s === 'closed') return 'approved';
    if (s === 'rejected' || s === 'failed') return 'rejected';
    return 'pending';
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/admin/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const onFastReload = () => fetchTickets();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const openTicketModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setReply(ticket.admin_reply || '');
    setFeedback(null);
  };

  const handleTicketAction = async (action: 'approve' | 'reject' | 'message', targetTicket?: any) => {
    const ticket = targetTicket || selectedTicket;
    if (!ticket) return;

    const noteText = targetTicket ? (ticket.admin_reply || '') : reply.trim();
    if (action === 'message' && !noteText) {
      setFeedback({ type: 'error', text: 'Please enter a message before sending.' });
      return;
    }

    const nextStatus =
      action === 'approve'
        ? 'approved'
        : action === 'reject'
        ? 'rejected'
        : ticket.status || 'open';

    setProcessingAction(action);
    setFeedback(null);
    try {
      const response = await fetchApi('/admin/reply-ticket', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: ticket.id,
          reply: noteText,
          status: nextStatus,
          action,
          userId: ticket.user_id,
          subject: ticket.subject
        })
      });

      if (!response.ok) throw new Error('Failed to process support ticket');
      const resData = await response.json().catch(() => ({}));
      const savedReply = resData.admin_reply || noteText;

      setTickets((prev) =>
        prev.map((t) =>
          String(t.id) === String(ticket.id)
            ? { ...t, status: nextStatus, admin_reply: savedReply || t.admin_reply }
            : t
        )
      );

      if (selectedTicket && String(selectedTicket.id) === String(ticket.id)) {
        if (action === 'message') {
          setSelectedTicket({ ...selectedTicket, admin_reply: savedReply });
          setFeedback({ type: 'success', text: 'Message sent to user successfully.' });
        } else {
          setSelectedTicket(null);
          setReply('');
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      setFeedback({ type: 'error', text: 'Failed to update ticket. Please try again.' });
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(t.subject || '').toLowerCase().includes(q) ||
      String(t.message || '').toLowerCase().includes(q) ||
      String(t.user?.full_name || '').toLowerCase().includes(q) ||
      String(t.user?.email || '').toLowerCase().includes(q);

    const norm = normalizeTicketStatus(t.status);
    const matchesStatus = filterStatus === 'all' || norm === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => normalizeTicketStatus(t.status) === 'pending').length;
  const approvedCount = tickets.filter((t) => normalizeTicketStatus(t.status) === 'approved').length;
  const rejectedCount = tickets.filter((t) => normalizeTicketStatus(t.status) === 'rejected').length;

  const renderStatusBadge = (rawStatus?: string) => {
    const norm = normalizeTicketStatus(rawStatus);
    if (norm === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved</span>
        </span>
      );
    }
    if (norm === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Classic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Support Panel</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Review user support requests, approve or reject tickets, and send direct messages.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          title="Reload Support Tickets"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-indigo-600', loading && 'animate-spin')} />
          <span>Reload</span>
        </button>
      </div>

      {/* Classic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Search & Classic Segmented Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or subject..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 outline-none w-full transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap',
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Classic Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Subject &amp; Message</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Admin Note</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No support tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                          {t.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {t.user?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{t.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{t.subject}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.message}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {t.admin_reply ? (
                        <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                          {t.admin_reply}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">No message yet</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{renderStatusBadge(t.status)}</td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTicketAction('approve', t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                          title="Approve Ticket"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTicketAction('reject', t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                          title="Reject Ticket"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openTicketModal(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reply &amp; Options</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classic Ticket Review, Approval, Reject & Message Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Manage Support Ticket</h3>
                    <p className="text-xs text-slate-500">
                      {selectedTicket.user?.full_name || 'User'} ({selectedTicket.user?.email || 'No email'})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(selectedTicket.status)}
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                {feedback && (
                  <div
                    className={cn(
                      'p-3 rounded-md border text-xs font-semibold',
                      feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    )}
                  >
                    {feedback.text}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTicket.subject}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">User Message</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attachments</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedTicket.attachments.map((file: any, idx: number) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-500 transition-colors group"
                          >
                            {file.type === 'image' ? (
                              <div className="w-full h-24 rounded bg-white border border-slate-200 overflow-hidden mb-2">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded bg-white border border-slate-200 flex items-center justify-center mb-2">
                                <FileText size={24} className="text-slate-400" />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-medium text-slate-700 truncate">
                                {file.name || `Attachment ${idx + 1}`}
                              </span>
                              <ExternalLink size={12} className="text-slate-400 shrink-0" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Reply / Message Input */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Admin Message / Note (Sent to User)
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply or reason for approval / rejection..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 outline-none h-28 resize-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    This message will be saved on the ticket and sent to the user&apos;s notifications.
                  </p>
                </div>
              </div>

              {/* Modal Footer with Approve, Reject, and Send Message */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTicketAction('approve')}
                    disabled={processingAction !== null}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 font-semibold text-xs sm:text-sm rounded-md transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve with Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTicketAction('reject')}
                    disabled={processingAction !== null}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white border border-red-700 font-semibold text-xs sm:text-sm rounded-md transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle size={16} />
                    <span>Reject with Message</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleTicketAction('message')}
                  disabled={processingAction !== null}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-semibold text-xs sm:text-sm rounded-md transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  <span>Send Message Only</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
