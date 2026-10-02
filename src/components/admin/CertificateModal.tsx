import React, { useState, useEffect, useRef } from 'react';
import { X, Award, Loader2, Send, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { cn } from '../../lib/utils';

interface CertificateModalProps {
  user: any;
  onClose: () => void;
}

export default function CertificateModal({ user, onClose }: CertificateModalProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'packages'
        });

        setPackages(data || []);
        if (data && data.length > 0) {
          const userPkg = data.find((p: any) => p.id === user.package_id);
          setSelectedPackage(userPkg ? userPkg.name : data[0].name);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };
    fetchPackages();
  }, [user.package_id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const secureUrl = await storageService.uploadToCloudinary(file, 'certificates');
      setUploadedImage(secureUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Failed to upload certificate. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const sendCertificate = async () => {
    if (!uploadedImage || !selectedPackage) return;
    setIsSending(true);
    try {
      await invokeAdminFunction('admin-action', {
        action: 'insert',
        table: 'certificates',
        payload: {
          user_id: user.id || user.uid,
          user_name: user.fullName || user.full_name || user.username || 'Student',
          package_name: selectedPackage,
          certificate_url: uploadedImage
        }
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error sending certificate:', error);
      let msg = error.message || 'Failed to send certificate. Please try again.';
      if (msg.includes('permission denied') || msg.includes('42501')) {
        msg = 'Database permission denied. Please check RLS rules.';
      }
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-md flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Issue Certificate
              </h3>
              <p className="text-xs text-slate-500">
                Manual upload for {user.fullName || user.full_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-md transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Certificate Issued</h4>
                <p className="text-xs text-slate-500 mt-1">
                  The certificate has been added to the user&apos;s library.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    User Name
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 font-semibold truncate">
                    {user.fullName || user.full_name || ''}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Course / Package
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-900 focus:border-slate-900 outline-none"
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  'min-h-[140px] max-h-[220px] bg-slate-50 rounded-md border border-dashed transition-colors flex flex-col items-center justify-center overflow-hidden relative cursor-pointer p-4',
                  uploadedImage
                    ? 'border-emerald-400'
                    : 'border-slate-300 hover:border-slate-900 hover:bg-slate-100/60'
                )}
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Uploaded Certificate"
                    className="max-h-[180px] w-auto object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-4 px-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 text-slate-700 rounded-md flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-slate-800 font-semibold text-xs">
                      Click to upload certificate image
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">JPG or PNG (Max 5MB)</p>
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSending}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploadedImage ? 'Change Image' : 'Select Image'}
                </button>
                <button
                  type="button"
                  onClick={sendCertificate}
                  disabled={!uploadedImage || isUploading || isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 rounded-md font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Issue Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
