import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { fetchApi } from '../../lib/api';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { FileText, Image as ImageIcon, ExternalLink, Trash2, Loader2, FileUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface UserUpload {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
}

const UserUploads = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUploads = async () => {
    if (!user) return;
    try {
      const response = await fetchApi(`/user-uploads/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch uploads');
      const data = await response.json();
      setUploads(data || []);
    } catch (err) {
      console.error('Error fetching uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [user]);

  const handleUploadSuccess = async (url: string, fileType: string, fileName: string) => {
    if (!user) return;
    try {
      const response = await fetchApi('/user-uploads', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          file_url: url,
          file_type: fileType,
          file_name: fileName
        })
      });

      if (!response.ok) throw new Error('Failed to save upload');
      fetchUploads();
    } catch (err) {
      console.error('Error saving upload to DB:', err);
      alert('File uploaded to cloud but failed to save to database.');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetchApi(`/user-uploads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete upload');
      setUploads(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting upload:', err);
      alert('Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Uploads</h1>
          <p className="text-slate-500 text-sm">Manage your screenshots, documents, and other files.</p>
        </div>
        <div className="bg-[#615DFA]/5 border border-[#615DFA]/10 px-4 py-2 rounded-2xl flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#615DFA] rounded-xl flex items-center justify-center text-white">
            <FileUp size={16} />
          </div>
          <span className="text-xs font-bold text-[#615DFA] uppercase tracking-widest">Cloudinary Storage Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Upload Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <CloudinaryUpload 
              onUploadSuccess={handleUploadSuccess}
              label="New Upload"
            />
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Storage Policy</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Files are stored securely on Cloudinary. Only metadata and URLs are kept in our database to ensure maximum performance.
              </p>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Recent Files</h3>
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">{uploads.length} Files</span>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                  <Loader2 size={40} className="animate-spin" />
                </div>
              ) : uploads.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                    <FileText size={32} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">No files uploaded yet</p>
                </div>
              ) : (
                uploads.map((file) => (
                  <motion.div 
                    layout
                    key={file.id}
                    className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        file.file_type === 'pdf' ? "bg-rose-50 text-rose-500" : "bg-[#615DFA]/10 text-[#615DFA]"
                      )}>
                        {file.file_type === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-xs">{file.file_name}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{file.file_type}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span className="text-[10px] font-medium text-slate-400">{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a 
                        href={file.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-[#615DFA] hover:bg-[#615DFA]/10 rounded-xl transition-all"
                        title="View File"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        disabled={deletingId === file.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete File"
                      >
                        {deletingId === file.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserUploads;
