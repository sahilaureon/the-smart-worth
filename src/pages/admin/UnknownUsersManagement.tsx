import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Package,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Key,
  ShieldCheck,
  AlertCircle,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function UnknownUsersManagement() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    converted: 0,
    potential_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');

  // Convert Modal State
  const [convertModalUser, setConvertModalUser] = useState<any | null>(null);
  const [customPassword, setCustomPassword] = useState('Student@123');
  const [customPackage, setCustomPackage] = useState('silver');
  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUnknownUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (packageFilter !== 'all') queryParams.set('package', packageFilter);

      const res = await fetchApi(`/admin/unknown-users?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching unknown users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnknownUsers();
  }, [statusFilter, packageFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnknownUsers();
  };

  const handleOpenConvert = (user: any) => {
    setConvertModalUser(user);
    setCustomPackage(user.package_id || 'silver');
    setCustomPassword('Student@123');
    setConvertSuccess(null);
    setErrorMsg(null);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalUser) return;
    setIsConverting(true);
    setErrorMsg(null);

    try {
      const res = await fetchApi('/admin/convert-unknown-user', {
        method: 'POST',
        body: JSON.stringify({
          id: convertModalUser.id,
          email: convertModalUser.email,
          full_name: convertModalUser.full_name,
          username: convertModalUser.username,
          mobile: convertModalUser.mobile,
          password: customPassword,
          package_id: customPackage,
          city: convertModalUser.city,
          state: convertModalUser.state,
          pin_code: convertModalUser.pin_code,
          referral_code: convertModalUser.referral_code
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert user.');
      }

      setConvertSuccess(data);
      // Refresh list
      fetchUnknownUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error converting user');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lead?')) return;
    try {
      const res = await fetchApi(`/admin/unknown-users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => String(l.id) !== String(id)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyDetails = (user: any) => {
    const text = `Name: ${user.full_name}\nEmail: ${user.email}\nPhone: ${user.mobile}\nPackage: ${user.package_name || user.package_id}\nAmount: ₹${user.amount}\nLocation: ${[user.city, user.state].filter(Boolean).join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#615DFA] text-white rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Unknown Users &amp; Registration Leads</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track visitors who filled registration details on the home page or checkout flow before payment. You can contact them directly or convert them into active students.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUnknownUsers}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Filled registration form</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Pending Payment</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pending}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Waiting for completion</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Converted Students</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.converted}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active enrollments</span>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Potential Value</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">₹{stats.potential_value}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total pipeline amount</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, city, or order ID..."
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA] focus:bg-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#615DFA]"
            >
              <option value="all">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="ticket_raised">Ticket Raised</option>
              <option value="converted">Converted to Student</option>
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

      {/* Leads Table */}
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#615DFA]" />
            <span>Loading unknown users and leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <UserX className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">No unknown user leads found.</p>
            <p className="text-xs text-slate-400">Visitors who type their details on registration will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">Visitor Lead</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Selected Package</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date &amp; Source</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const cleanMobile = String(lead.mobile || '').replace(/\D/g, '').slice(-10);
                  const isConverted = lead.status === 'converted';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200">
                            {(lead.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {lead.full_name || 'Visitor Lead'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{lead.username || 'guest'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{lead.email || 'N/A'}</span>
                        </div>
                        {cleanMobile && (
                          <div className="flex items-center space-x-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>+91 {cleanMobile}</span>
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {lead.city || lead.state ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {[lead.city, lead.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Selected Package */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {lead.package_name || lead.package_id || 'VIP Package'}
                          </span>
                          <span className="font-extrabold text-emerald-600">₹{lead.amount || 599}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Student Active</span>
                          </span>
                        ) : lead.status === 'ticket_raised' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            <Clock className="w-3 h-3" />
                            <span>Ticket Raised</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>Pending Pay</span>
                          </span>
                        )}
                      </td>

                      {/* Date & Source */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <div>
                          <span>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                            {lead.source || 'home_registration'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Direct WhatsApp */}
                          {cleanMobile && (
                            <a
                              href={`https://wa.me/91${cleanMobile}?text=Hello%20${encodeURIComponent(lead.full_name || 'Student')},%20we%20noticed%20you%20started%20enrollment%20for%20${encodeURIComponent(lead.package_name || 'The Smart Worth')}.%20Need%20any%20help%20completing%20your%20payment?`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Copy Details */}
                          <button
                            type="button"
                            onClick={() => copyDetails(lead)}
                            title="Copy Details"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Convert to Student Account */}
                          {!isConverted && (
                            <button
                              type="button"
                              onClick={() => handleOpenConvert(lead)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#615DFA] hover:bg-[#504bd6] text-white font-bold text-[11px] rounded-lg border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a] transition-all cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Create Student</span>
                            </button>
                          )}

                          {/* Delete Lead */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert to Student Modal */}
      {convertModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Convert Unknown User to Active Student</h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {convertSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-emerald-500">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Student Account Created!</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {convertModalUser.email} is now an active enrolled student with full dashboard &amp; course access.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1">
                  <div><strong>Email:</strong> {convertModalUser.email}</div>
                  <div><strong>Temporary Password:</strong> {customPassword}</div>
                  <div><strong>Package:</strong> {customPackage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setConvertModalUser(null)}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConvertSubmit} className="p-6 space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-700 font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div><span className="text-slate-400">Student Name:</span> <strong>{convertModalUser.full_name}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <strong>{convertModalUser.email}</strong></div>
                  <div><span className="text-slate-400">Mobile:</span> {convertModalUser.mobile || 'N/A'}</div>
                  <div><span className="text-slate-400">Address:</span> {[convertModalUser.city, convertModalUser.state].filter(Boolean).join(', ') || 'India'}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Package <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customPackage}
                    onChange={(e) => setCustomPackage(e.target.value)}
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
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="e.g. Student@123"
                      className="w-full pl-9 pr-3.5 py-2 font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Student can change this password anytime from their profile settings.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConvertModalUser(null)}
                    className="px-4 py-2 text-slate-600 font-bold border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConverting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#615DFA] hover:bg-[#504bd6] text-white font-bold rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Activating Account...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Activate Student Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
