/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Optimizes Cloudinary video URLs for fast delivery and correct format.
 * Adds f_auto,q_auto transformations.
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // If it's already an embed URL, don't optimize it as a delivery URL
  if (url.includes('player.cloudinary.com/embed')) {
    return url.trim().replace(/ /g, '%20');
  }
  
  // Handle URLs with spaces or special characters
  // We use a more robust encoding for the path part
  let encodedUrl = url.trim();
  
  // If it's already a transformation URL, don't mess with it too much
  if (encodedUrl.includes('/upload/')) {
    const parts = encodedUrl.split('/upload/');
    const baseUrl = parts[0];
    let pathPart = parts[1];
    
    // Check if transformations already exist
    // If pathPart doesn't start with 'v' and contains a '/', it likely has transformations
    const hasTransformations = !pathPart.startsWith('v') && pathPart.includes('/');
    
    if (hasTransformations) {
      // Already has transformations, just ensure it's encoded
      return `${baseUrl}/upload/${pathPart.replace(/ /g, '%20')}`;
    }
    
    // Insert f_auto,q_auto for optimization
    return `${baseUrl}/upload/f_auto,q_auto/${pathPart.replace(/ /g, '%20')}`;
  }
  
  return encodedUrl.replace(/ /g, '%20');
}

export function getCloudinaryEmbedUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Ensure spaces are encoded before any processing
  const trimmedUrl = url.trim().replace(/ /g, '%20');

  // If it's already an embed URL, return it as is (but ensure it has autoplay/muted params if desired)
  if (trimmedUrl.includes('player.cloudinary.com/embed')) {
    // Add autoplay if not present
    if (!trimmedUrl.includes('autoplay=')) {
      const separator = trimmedUrl.includes('?') ? '&' : '?';
      return `${trimmedUrl}${separator}autoplay=true&muted=false`;
    }
    return trimmedUrl;
  }
  
  try {
    // Regex to extract cloud name and public ID from a standard Cloudinary delivery URL
    // Supports: https://res.cloudinary.com/cloudname/video/upload/v12345/path/to/video.mp4
    const regex = /https?:\/\/res\.cloudinary\.com\/([^\/]+)\/video\/upload\/(?:[^\/]+\/)?(.+)\.[a-z0-9]+$/i;
    const match = trimmedUrl.match(regex);
    
    if (match && match[1] && match[2]) {
      const cloudName = match[1];
      // Decode first to handle already encoded URLs, then encode for the query param
      const publicId = decodeURIComponent(match[2]);
      return `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${encodeURIComponent(publicId)}&autoplay=true&muted=false`;
    }
  } catch (e) {
    console.error("Error parsing Cloudinary URL for embed:", e);
  }
  
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  if (!url || !url.includes('vimeo.com')) return null;

  const trimmedUrl = url.trim();

  // If it's already an embed URL, return it
  if (trimmedUrl.includes('player.vimeo.com/video/')) {
    return trimmedUrl;
  }

  try {
    // Match vimeo.com/ID/HASH or vimeo.com/ID
    // Also handles vimeo.com/ID?h=HASH
    const regex = /vimeo\.com\/(\d+)(?:\/([a-z0-9]+))?/i;
    const match = trimmedUrl.match(regex);

    if (match && match[1]) {
      const videoId = match[1];
      const hash = match[2];
      
      // If there's a hash in the URL params (e.g. ?h=...)
      const urlObj = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
      const hParam = urlObj.searchParams.get('h');
      
      const finalHash = hash || hParam;
      
      let embedUrl = `https://player.vimeo.com/video/${videoId}`;
      const params = new URLSearchParams();
      if (finalHash) params.set('h', finalHash);
      params.set('badge', '0');
      params.set('autopause', '0');
      params.set('player_id', '0');
      params.set('app_id', '58479');
      params.set('autoplay', '1');
      
      return `${embedUrl}?${params.toString()}`;
    }
  } catch (e) {
    console.error("Error parsing Vimeo URL for embed:", e);
  }

  return null;
}

/**
 * Sanitizes and prepares video URLs for the player.
 */
export function sanitizeVideoUrl(url: string): string {
  if (!url) return '';
  
  let sanitized = url.trim();
  
  // Handle Cloudinary specifically
  if (sanitized.includes('cloudinary.com')) {
    // If it's an embed URL, just ensure spaces are encoded
    if (sanitized.includes('player.cloudinary.com/embed')) {
      return sanitized.replace(/ /g, '%20');
    }
    sanitized = optimizeCloudinaryUrl(sanitized);
  } else if (!sanitized.includes('youtube.com') && !sanitized.includes('youtu.be')) {
    // General encoding for other direct links, but avoid breaking YouTube params
    sanitized = sanitized.replace(/ /g, '%20');
  }
  
  return sanitized;
}
