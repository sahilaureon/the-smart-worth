import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Image as ImageIcon,
  FileText,
  Trash2,
  Shield,
  RefreshCw,
  ExternalLink,
  Eye
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../App';
import { cn } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizeStatus = (rawStatus?: string): 'pending' | 'approved' | 'rejected' => {
    const s = String(rawStatus || 'open').toLowerCase();
    if (s === 'approved' || s === 'resolved' || s === 'closed') return 'approved';
    if (s === 'rejected' || s === 'failed') return 'rejected';
    return 'pending';
  };

  const fetchTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetchApi(`/support/tickets/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const onReload = () => fetchTickets();
    window.addEventListener('app-fast-reload', onReload);
    return () => window.removeEventListener('app-fast-reload', onReload);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !user) return;

    setSending(true);
    setErrorMsg(null);
    try {
      const response = await fetchApi('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          subject: subject.trim(),
          message: message.trim(),
          status: 'open',
          attachments
        })
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      setSubject('');
      setMessage('');
      setAttachments([]);
      setIsModalOpen(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      setErrorMsg('Failed to submit ticket. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderStatusBadge = (rawStatus?: string) => {
    const norm = normalizeStatus(rawStatus);
    if (norm === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved</span>
        </span>
      );
    }
    if (norm === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending</span>
      </span>
    );
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return true;
    return normalizeStatus(t.status) === filterStatus;
  });

  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => normalizeStatus(t.status) === 'pending').length;
  const approvedCount = tickets.filter((t) => normalizeStatus(t.status) === 'approved').length;
  const rejectedCount = tickets.filter((t) => normalizeStatus(t.status) === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Classic Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Support Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Need help? Create a support ticket and check responses from the admin team.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-indigo-600', loading && 'animate-spin')} />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={16} />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Classic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Classic Status Filter Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap',
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              )}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-500 hidden sm:inline">
          Showing {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {/* Ticket List */}
      {loading ? (
        <LoadingScreen fullScreen={false} />
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {ticket.subject}
                      </h3>
                      {renderStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1">
                      {ticket.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-medium">
                      <span>
                        Submitted on{' '}
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                      {ticket.attachments?.length > 0 && (
                        <span>· {ticket.attachments.length} attachment(s)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye size={14} className="text-indigo-600" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {ticket.admin_reply && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border">
                  <Shield size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                      Admin Response
                    </p>
                    <p className="text-xs sm:text-sm text-slate-800 mt-0.5 line-clamp-2">
                      {ticket.admin_reply}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <MessageSquare size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No support tickets found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Have a question or issue? Click &quot;New Ticket&quot; above to contact our support team.
          </p>
        </div>
      )}

      {/* Classic Create New Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Support Ticket</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fill in the details below and our support team will respond shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {errorMsg && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefly describe your issue"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:border-indigo-600 outline-none transition-colors text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide complete details about your request..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:border-indigo-600 outline-none transition-colors text-sm text-slate-900 placeholder:text-slate-400 h-32 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Attachments (Optional)
                  </label>
                  <CloudinaryUpload
                    onUploadSuccess={(url, type, name) => {
                      setAttachments((prev) => [...prev, { url, type, name }]);
                    }}
                  />

                  {attachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-md border border-slate-200"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {file.type === 'image' ? (
                              <ImageIcon size={15} className="text-indigo-600 shrink-0" />
                            ) : (
                              <FileText size={15} className="text-indigo-600 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-semibold text-xs sm:text-sm rounded-md transition-colors shadow-2xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={15} />
                    <span>Submit Ticket</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Classic Ticket Details Modal */}
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
              className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ticket Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted on{' '}
                    {selectedTicket.created_at
                      ? new Date(selectedTicket.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
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

              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subject
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTicket.subject}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Your Message
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </p>
                </div>

                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Attachments
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTicket.attachments.map((file: any, idx: number) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-500 transition-colors"
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

                {selectedTicket.admin_reply ? (
                  <div className="bg-slate-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Shield size={15} className="text-indigo-600" />
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                        Admin Response
                      </p>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.admin_reply}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Clock size={14} className="text-amber-600 shrink-0" />
                    <span>Our support team is reviewing your request and will reply soon.</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
