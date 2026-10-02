import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { storageService } from './services/storageService';

interface ImageUploadProps {
  bucket: 'avatars' | 'course-content';
  path: string;
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  bucket, 
  path, 
  onUploadSuccess, 
  currentUrl,
  label = "Upload Image"
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setUploading(true);
      
      let publicUrl = '';
      if (bucket === 'avatars') {
        // Use Cloudinary for avatars to avoid Supabase Storage bucket errors
        try {
          publicUrl = await storageService.uploadToCloudinary(file, 'user_dp');
        } catch (cloudinaryError) {
          console.error("Cloudinary upload failed, falling back to Supabase:", cloudinaryError);
          publicUrl = await storageService.uploadImage(file, bucket, path);
        }
      } else {
        // Upload to Supabase Storage for other buckets
        publicUrl = await storageService.uploadImage(file, bucket, path);
      }
      
      onUploadSuccess(publicUrl);
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUploadSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-[#0A0E27] uppercase tracking-wider ml-1">{label}</label>
      
      <div className="relative group">
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            w-full aspect-video md:aspect-[16/9] rounded-2xl border-2 border-dashed 
            flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
            ${preview ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-[#0061FF] hover:bg-white'}
          `}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center space-y-2 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Upload size={20} />
              </div>
              <span className="text-xs font-bold">Click to upload or drag & drop</span>
            </div>
          )}

          {/* Uploading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 z-10">
              <Loader2 className="animate-spin text-[#0061FF]" size={24} />
              <span className="text-[10px] font-black text-[#0061FF] uppercase tracking-widest">Uploading...</span>
            </div>
          )}
        </div>

        {/* Remove Button */}
        {preview && !uploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeImage();
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors z-20"
          >
            <X size={16} />
          </button>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
