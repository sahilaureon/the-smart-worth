import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  Eye,
  ArrowRight,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCircle,
  Send,
  RefreshCw
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedSelect } from '../../components/AnimatedSelect';
import LoadingScreen from '../../components/LoadingScreen';

interface ProfileRequest {
  id: string;
  user_id: string;
  requested_changes: {
    fullName?: string;
    mobile?: string;
    dob?: string;
    gender?: string;
    state?: string;
    profilePic?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  admin_id?: string;
  admin_note?: string;
  user_email?: string;
  user_name?: string;
  user_profile_pic?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

const RequestDetailModal = ({ request, onClose, onApprove, onReject, onSendMessage }: { 
  request: ProfileRequest, 
  onClose: () => void,
  onApprove: (id: string, note: string, editedChanges?: any) => Promise<void>,
  onReject: (id: string, note: string) => Promise<void>,
  onSendMessage: (id: string, note: string) => Promise<void>
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [editedChanges, setEditedChanges] = useState<any>(request.requested_changes);
  const [openSelect, setOpenSelect] = useState<'gender' | 'state' | null>(null);

  useEffect(() => {
    setEditedChanges(request.requested_changes);
  }, [request.id]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'profiles',
          query: { eq: { column: 'id', value: request.user_id }, single: true }
        });
        
        if (data) {
          setCurrentUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [request.user_id]);

  const handleAction = async (action: 'approve' | 'reject' | 'message') => {
    console.log(`handleAction triggered: ${action}`, { requestId: request.id, adminNote });
    
    if (action === 'message' && !adminNote.trim()) {
      alert('Please enter a message first');
      return;
    }

    setIsProcessing(true);
    try {
      if (action === 'approve') {
        console.log("Calling onApprove with edited changes...");
        await onApprove(request.id, adminNote, editedChanges);
        console.log("onApprove successful");
        onClose();
      } else if (action === 'reject') {
        console.log("Calling onReject...");
        await onReject(request.id, adminNote);
        console.log("onReject successful");
        onClose();
      } else {
        console.log("Calling onSendMessage...");
        await onSendMessage(request.id, adminNote);
        console.log("onSendMessage successful");
        setAdminNote(''); // Clear note after sending message
        alert('Message sent successfully!');
      }
    } catch (error: any) {
      console.error(`Error during ${action}:`, error);
      alert(`Failed to ${action}: ${error.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: User },
    { key: 'mobile', label: 'Mobile Number', icon: Phone },
    { key: 'dob', label: 'Date of Birth', icon: Calendar },
    { key: 'gender', label: 'Gender', icon: UserCircle },
    { key: 'state', label: 'State', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#615DFA] flex items-center justify-center text-white shadow-lg shadow-[#615DFA]/20">
              <Eye size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Request Details</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Review Profile Changes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
            <XCircle size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loadingUser ? (
            <div className="py-12 text-center text-slate-400 italic">Loading current profile data...</div>
          ) : (
            <div className="space-y-6">
              {/* Profile Pic Comparison */}
              {request.requested_changes.profilePic && (
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-[#615DFA] uppercase tracking-[0.2em] flex items-center space-x-2">
                    <span className="w-8 h-[2px] bg-[#615DFA]"></span>
                    <span>Profile Picture Change</span>
                  </h3>
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Current</p>
                      <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden">
                        {currentUserData?.profile_pic ? (
                          <img src={currentUserData.profile_pic} alt="Current" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="text-slate-300" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-[#615DFA] uppercase mb-2">Requested</p>
                      <div className="w-24 h-24 rounded-2xl bg-[#615DFA]/10 border-2 border-[#615DFA]/20 overflow-hidden shadow-lg shadow-[#615DFA]/10">
                        <img src={request.requested_changes.profilePic} alt="Requested" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Fields Comparison */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center space-x-2">
                  <span className="w-8 h-[2px] bg-emerald-600"></span>
                  <span>Information Changes</span>
                </h3>
                <div className="space-y-3">
                  {fields.map(({ key, label, icon: Icon }) => {
                    const requestedValue = (request.requested_changes as any)[key];
                    if (!requestedValue) return null;

                    const currentValue = currentUserData?.[key === 'fullName' ? 'full_name' : key];
                    const isChanged = editedChanges[key] !== currentValue;

                    return (
                      <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center space-x-2 text-slate-500">
                          <Icon size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                            <p className="text-sm font-bold text-slate-600">{currentValue || 'Not Set'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#615DFA] uppercase mb-1">Requested (Editable)</p>
                            {key === 'gender' ? (
                              <AnimatedSelect
                                label=""
                                value={editedChanges[key] || ''}
                                placeholder="Select Gender"
                                options={GENDER_OPTIONS}
                                onSelect={(val) => setEditedChanges({ ...editedChanges, [key]: val })}
                                isOpen={openSelect === 'gender'}
                                onOpen={() => setOpenSelect('gender')}
                                onClose={() => setOpenSelect(null)}
                              />
                            ) : key === 'state' ? (
                              <AnimatedSelect
                                label=""
                                value={editedChanges[key] || ''}
                                placeholder="Select State"
                                options={INDIAN_STATES.map(s => ({ label: s, value: s }))}
                                onSelect={(val) => setEditedChanges({ ...editedChanges, [key]: val })}
                                isOpen={openSelect === 'state'}
                                onOpen={() => setOpenSelect('state')}
                                onClose={() => setOpenSelect(null)}
                              />
                            ) : (
                              <input
                                type={key === 'dob' ? 'date' : 'text'}
                                value={editedChanges[key] || ''}
                                onChange={(e) => setEditedChanges({ ...editedChanges, [key]: e.target.value })}
                                className={cn(
                                  "w-full bg-white border border-[#615DFA]/10 rounded-lg px-2 py-1 text-sm font-black focus:ring-1 focus:ring-[#615DFA] focus:border-transparent transition-all",
                                  isChanged ? "text-[#615DFA]" : "text-slate-600"
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Admin Note Section */}
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center space-x-2">
                  <span className="w-8 h-[2px] bg-slate-300"></span>
                  <span>Admin Note (Message to User)</span>
                </h3>
                <div className="space-y-2">
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter reason for approval or rejection (e.g., 'Name mismatch with ID proof', 'DOB updated successfully')"
                    className="w-full h-24 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#615DFA]/20 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">This message will be sent as a notification to the user.</p>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          <button 
            type="button"
            onClick={() => handleAction('message')}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-2xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} className="text-indigo-600" />
            <span>Send Message</span>
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => handleAction('reject')}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-md bg-white border border-rose-300 text-rose-700 font-semibold text-xs sm:text-sm hover:bg-rose-50 transition-colors shadow-2xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <UserX size={16} />
              <span>Reject Request</span>
            </button>
            <button 
              type="button"
              onClick={() => handleAction('approve')}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-md bg-indigo-600 border border-indigo-700 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-2xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <UserCheck size={16} />
              <span>Approve &amp; Update</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function ProfileRequests() {
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ProfileRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const query: any = { order: { column: 'created_at', ascending: false } };
      if (filterStatus !== 'all') {
        query.eq = { column: 'status', value: filterStatus };
      }

      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'profile_requests',
        query
      });
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching profile requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const onFastReload = () => fetchRequests();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, [filterStatus]);

  const handleApprove = async (requestId: string, adminNote: string, editedChanges?: any) => {
    console.log("handleApprove started", { requestId, adminNote, editedChanges });
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      console.error("Request not found in state");
      return;
    }

    try {
      // 1. Update user profile
      const profileUpdates: any = {};
      const changesToUse = editedChanges || request.requested_changes;
      
      if (changesToUse.fullName) profileUpdates.full_name = changesToUse.fullName;
      if (changesToUse.mobile) profileUpdates.mobile = changesToUse.mobile;
      if (changesToUse.dob) profileUpdates.dob = changesToUse.dob;
      if (changesToUse.gender) profileUpdates.gender = changesToUse.gender;
      if (changesToUse.state) profileUpdates.state = changesToUse.state;
      if (changesToUse.profilePic) profileUpdates.profile_pic = changesToUse.profilePic;
      
      console.log("Updating profile with:", profileUpdates);
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: request.user_id,
          data: {
            ...profileUpdates,
            updated_at: new Date().toISOString()
          }
        }
      });

      // 2. Update request status
      console.log("Updating request status to approved...");
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profile_requests',
        payload: {
          id: requestId,
          data: {
            status: 'approved',
            updated_at: new Date().toISOString(),
            admin_note: adminNote
          }
        }
      });

      // 3. Create Notification
      console.log("Creating success notification...");
      await invokeAdminFunction('admin-action', {
        action: 'insert',
        table: 'notifications',
        payload: {
          user_id: request.user_id,
          title: 'Profile Updated Successfully',
          message: adminNote || 'Your profile update request has been approved and updated by the admin.',
          type: 'success'
        }
      });
      
      console.log("handleApprove completed successfully");
    } catch (error) {
      console.error("Error in handleApprove:", error);
      throw error;
    }
  };

  const handleReject = async (requestId: string, adminNote: string) => {
    console.log("handleReject started", { requestId, adminNote });
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      console.error("Request not found in state");
      return;
    }

    try {
      console.log("Updating request status to rejected...");
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profile_requests',
        payload: {
          id: requestId,
          data: {
            status: 'rejected',
            updated_at: new Date().toISOString(),
            admin_note: adminNote
          }
        }
      });
      
      // Create Notification
      console.log("Creating rejection notification...");
      await invokeAdminFunction('admin-action', {
        action: 'insert',
        table: 'notifications',
        payload: {
          user_id: request.user_id,
          title: 'Profile Update Rejected',
          message: adminNote || 'Your profile update request has been rejected by the admin.',
          type: 'error'
        }
      });
      
      console.log("handleReject completed successfully");
    } catch (error) {
      console.error("Error in handleReject:", error);
      throw error;
    }
  };

  const handleSendMessage = async (requestId: string, adminNote: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Create Notification only
      await invokeAdminFunction('admin-action', {
        action: 'insert',
        table: 'notifications',
        payload: {
          user_id: request.user_id,
          title: 'Admin Message',
          message: adminNote,
          type: 'info'
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3.5 py-1.5 rounded text-xs font-semibold capitalize transition-colors cursor-pointer",
                  filterStatus === status 
                    ? "bg-indigo-600 text-white shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          title="Reload Profile Requests"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", loading && "animate-spin")} />
          <span>Reload</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Changes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-500 font-bold">No requests found.</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">All clear for now</p>
                  </td>
                </tr>
              ) : requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {request.user_profile_pic ? (
                        <img 
                          src={request.user_profile_pic} 
                          alt={request.user_name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#615DFA]/10 flex items-center justify-center text-[#615DFA] font-bold">
                          {request.user_name?.charAt(0) || <User size={20} />}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{request.user_name || 'Unknown User'}</p>
                        <p className="text-xs text-slate-500">{request.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(request.requested_changes).map(key => (
                        <span key={key} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase">
                          {key}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      request.status === 'pending' ? "bg-amber-100 text-amber-700" :
                      request.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {request.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> :
                       request.status === 'approved' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                       <XCircle className="w-3 h-3 mr-1" />}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      title="View Details"
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

      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal 
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
