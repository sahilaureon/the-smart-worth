import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string, fileType: string, fileName: string) => void;
  folder?: string;
  allowedTypes?: string[]; // e.g. ['image/jpeg', 'image/png', 'application/pdf']
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onUploadSuccess,
  folder = 'user_uploads',
  allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB = 5,
  label,
  className
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    setFileName(file.name);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      const url = await storageService.uploadToCloudinary(file, folder);
      const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
      
      setSuccess(true);
      onUploadSuccess(url, fileType, file.name);
      
      // Reset after success
      setTimeout(() => {
        setSuccess(false);
        setFileName(null);
      }, 3000);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative min-h-[104px] py-4 px-4 rounded-lg border border-dashed transition-colors duration-150 flex flex-col items-center justify-center cursor-pointer overflow-hidden text-center",
          dragActive
            ? "border-indigo-600 bg-indigo-50/60"
            : "border-slate-300 bg-slate-50/80 hover:border-indigo-500 hover:bg-slate-100/70",
          uploading && "pointer-events-none opacity-75",
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={allowedTypes.join(',')}
        />

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center py-2"
            >
              <Loader2 className="text-indigo-600 animate-spin" size={26} />
            </motion.div>
          ) : success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 text-emerald-600 py-2"
            >
              <CheckCircle2 size={20} />
              <p className="text-xs font-semibold">Uploaded successfully</p>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-slate-500"
            >
              <div className="w-9 h-9 rounded-md bg-white shadow-2xs flex items-center justify-center mb-2 border border-slate-200 text-indigo-600">
                <Upload size={17} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {fileName ? fileName : "Click to upload or drag & drop"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                JPG, PNG or PDF (Max {maxSizeMB}MB)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 bg-rose-600 text-white px-3 py-1.5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-1.5">
                <AlertCircle size={13} />
                <span className="text-[11px] font-semibold">{error}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setError(null); }}
                className="hover:bg-white/20 p-0.5 rounded"
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
