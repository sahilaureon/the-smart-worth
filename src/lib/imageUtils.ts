/**
 * Optimizes a Cloudinary URL by adding auto-format and auto-quality parameters.
 * If the URL is not a Cloudinary URL, it returns the original URL.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined, width?: number, height?: number): string {
  if (!url) return '';
  
  // Check if it's a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      let transformations = 'f_auto,q_auto';
      if (width) transformations += `,w_${width}`;
      if (height) transformations += `,h_${height}`;
      if (width && height) transformations += ',c_fill';
      
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
  }
  
  return url;
}
