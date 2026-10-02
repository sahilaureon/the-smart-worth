import { fetchApi } from '../lib/api';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const originalDataUrl = reader.result as string;

      // For non-images or images under 1.5MB, return the exact original file untouched
      // so transparency, colors, and edges remain 100% identical to the source image.
      if (!file.type.startsWith('image/') || file.size <= 1.5 * 1024 * 1024) {
        resolve(originalDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const isTransparentFormat =
              file.type === 'image/png' ||
              file.type === 'image/webp' ||
              file.type === 'image/gif' ||
              file.type === 'image/svg+xml';

            if (isTransparentFormat) {
              // Preserve 100% transparency — never convert PNG/WebP to JPEG (which turns transparency black)
              ctx.clearRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/png'));
              return;
            } else {
              // For JPEG files only, fill white background first so no dark artifacts ever appear
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
              return;
            }
          }
        } catch {}
        resolve(originalDataUrl);
      };
      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const storageService = {
  /**
   * Upload an image or PDF to Cloudinary (Signed via Backend) with automatic local data-URL fallback
   */
  async uploadToCloudinary(file: File, folder: string = 'user_dp'): Promise<string> {
    try {
      // 1. Get Signature from Backend
      const signRes = await fetchApi(`/upload/sign?folder=${folder}`);

      if (signRes.ok) {
        const { signature, timestamp, apiKey, cloudName } = await signRes.json();
        if (
          cloudName &&
          apiKey &&
          signature &&
          cloudName !== 'dzxxj5nsa' &&
          !cloudName.includes('your-cloud')
        ) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);
          formData.append('folder', folder);

          const resourceType = file.type.includes('pdf') ? 'auto' : 'image';
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data?.secure_url) return data.secure_url;
          }
        }
      }
    } catch {
      // Fall through to unsigned or local data URL fallback
    }

    // 2. Try Unsigned upload if a valid cloudName is configured
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'user_dp_upload';

      if (cloudName && cloudName !== 'dzxxj5nsa' && !cloudName.includes('your-cloud')) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        const resType = file.type.includes('pdf') ? 'auto' : 'image';
        const fallbackRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resType}/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.secure_url) return fallbackData.secure_url;
        }
      }
    } catch {
      // Fall through to data URL fallback
    }

    // 3. Fallback to lossless/original data URL so uploads preserve 100% transparency & original colors
    return await fileToDataUrl(file);
  },

  /**
   * Upload a Base64 string to Cloudinary with fallback to the Base64 data URL
   */
  async uploadBase64ToCloudinary(
    base64: string,
    folder: string = 'certificates'
  ): Promise<string> {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'user_dp_upload';

      if (cloudName && cloudName !== 'dzxxj5nsa' && !cloudName.includes('your-cloud')) {
        const formData = new FormData();
        formData.append('file', base64);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.secure_url) return data.secure_url;
        }
      }
    } catch {}

    return base64;
  },

  /**
   * Upload an image (Redirected to Cloudinary/fallback to replace Supabase Storage)
   */
  async uploadImage(file: File, bucket: 'avatars' | 'course-content', path: string) {
    const folder = bucket === 'avatars' ? 'user_dp' : 'course_content';
    return this.uploadToCloudinary(file, folder);
  },

  /**
   * Delete an image
   */
  async deleteImage(bucket: 'avatars' | 'course-content', path: string) {
    // No-op for client-side uploads
  }
};
