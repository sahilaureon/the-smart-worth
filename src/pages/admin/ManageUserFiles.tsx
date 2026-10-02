import React, { useState, useEffect } from 'react';
import { invokeAdminFunction } from '../../lib/supabase';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { User, FileText, Search, Send, Loader2, CheckCircle2, ExternalLink, Trash2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  profile_pic: string | null;
}

interface UserFile {
  id: string;
  user_id: string;
  file_url: string;
  type: string;
  file_name: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const ManageUserFiles = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentFiles, setRecentFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, fileData] = await Promise.all([
        invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'profiles',
          query: { select: 'id, full_name, email, profile_pic', order: { column: 'full_name', ascending: true } }
        }).catch(() => []),
        invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'user_files',
          query: { order: { column: 'created_at', ascending: false }, limit: 20 }
        }).catch(() => [])
      ]);

      setUsers(Array.isArray(userData) ? userData : []);
      setRecentFiles(Array.isArray(fileData) ? fileData : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSuccess = async (url: string, fileType: string, fileName: string) => {
    if (!selectedUser) {
      alert('Please select a user first.');
      return;
    }

    setSending(true);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'insert',
        table: 'user_files',
        payload: {
          user_id: selectedUser.id,
          file_url: url,
          type: fileType === 'pdf' ? 'document' : 'certificate',
          file_name: fileName
        }
      });
      
      alert(`File sent successfully to ${selectedUser.full_name || selectedUser.email}`);
      fetchData();
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending file:', err);
      alert('Failed to save file record.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await invokeAdminFunction('admin-action', {
        action: 'delete',
        table: 'user_files',
        payload: { id }
      });
      setRecentFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Manage User Files</h1>
        <p className="text-slate-500 text-sm">Upload certificates and documents directly to users' accounts via Cloudinary.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* User Selection & Upload */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center space-x-2">
              <User size={14} className="text-[#615DFA]" />
              <span>1. Select Recipient</span>
            </h3>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#615DFA]/20 transition-all text-sm font-medium"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "w-full flex items-center space-x-4 p-3 rounded-2xl transition-all text-left",
                    selectedUser?.id === user.id 
                      ? "bg-[#615DFA] text-white shadow-lg shadow-[#615DFA]/20" 
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                    selectedUser?.id === user.id ? "bg-white/20" : "bg-slate-100"
                  )}>
                    {user.profile_pic ? (
                      <img src={user.profile_pic} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      user.full_name?.[0] || user.email[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{user.full_name || 'No Name'}</p>
                    <p className={cn(
                      "text-[10px] truncate",
                      selectedUser?.id === user.id ? "text-white/70" : "text-slate-400"
                    )}>{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedUser && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center space-x-2">
                    <Send size={14} className="text-[#615DFA]" />
                    <span>2. Upload & Send</span>
                  </h3>
                  <button onClick={() => setSelectedUser(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500">Cancel</button>
                </div>

                <div className="p-4 bg-[#615DFA]/5 rounded-2xl border border-[#615DFA]/10 mb-6 flex items-center space-x-3">
                  <Mail size={16} className="text-[#615DFA]" />
                  <p className="text-xs text-[#615DFA] font-bold">Sending to: {selectedUser.full_name || selectedUser.email}</p>
                </div>

                <CloudinaryUpload 
                  onUploadSuccess={handleUploadSuccess}
                  folder="admin_sent_files"
                  label="Select Certificate or Document"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Recent Admin Activity</h3>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                  <Loader2 size={40} className="animate-spin" />
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                  <p className="text-xs font-bold uppercase tracking-widest">No files sent yet</p>
                </div>
              ) : (
                recentFiles.map(file => (
                  <div key={file.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{file.file_name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Sent to <span className="text-blue-600 font-bold">{file.profiles?.full_name || file.profiles?.email}</span> • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <ExternalLink size={16} />
                      </a>
                      <button onClick={() => handleDeleteFile(file.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUserFiles;
