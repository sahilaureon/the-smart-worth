import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  userId,
  currentImageUrl,
  onUploadSuccess,
  className
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB limit

    if (!validTypes.includes(file.type)) {
      return 'Please upload a JPG or PNG image.';
    }
    if (file.size > maxSize) {
      return 'Image size must be less than 2MB.';
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    await uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    try {
      const secureUrl = await storageService.uploadToCloudinary(file, 'user_dp');

      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'profiles',
        payload: {
          id: userId,
          data: { profile_pic: secureUrl }
        }
      });

      setPreviewUrl(secureUrl);
      setSuccess(true);
      if (onUploadSuccess) onUploadSuccess(secureUrl);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setPreviewUrl(currentImageUrl || null); // Revert on failure
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-6", className)}>
      <div className="relative">
        {/* Profile Image Container */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-50 flex items-center justify-center relative transition-all duration-500",
            uploading ? "ring-4 ring-blue-400/30" : "ring-4 ring-transparent hover:ring-blue-100"
          )}
        >
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center">
              <Camera size={48} strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">No Photo</span>
            </div>
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px] flex flex-col items-center justify-center"
              >
                <Loader2 className="text-white animate-spin mb-2" size={32} />
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Uploading</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Upload Trigger Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border-4 border-white"
          title="Upload New Photo"
        >
          <Upload size={20} />
        </button>
      </div>

      {/* Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
      />

      {/* Status Messages */}
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"
            >
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Profile Updated</span>
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-full border border-rose-100"
            >
              <AlertCircle size={16} />
              <span className="text-[11px] font-bold uppercase tracking-tight">{error}</span>
              <button onClick={() => setError(null)} className="ml-1 hover:text-rose-700">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          JPG or PNG • Max 2MB
        </p>
      </div>
    </div>
  );
};
