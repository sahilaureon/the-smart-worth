import React, { useState, useEffect } from 'react';

interface CleanPackageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  mode?: 'box' | 'banner';
  onCleanedDataUrl?: (cleanedUrl: string) => void;
}

const cleanedCache = new Map<string, string>();

/**
 * Safely repairs ONLY legacy data:image/jpeg images that were created from transparent PNGs
 * where pure black (#000000) replaced transparency at the outer corners.
 * Never alters dark-themed thumbnails or internal artwork/colors.
 */
function repairLegacyBlackBackgroundJpeg(
  src: string,
  mode: 'box' | 'banner'
): Promise<string> {
  if (!src || !src.startsWith('data:image/jpeg;base64,')) {
    return Promise.resolve(src);
  }

  const cacheKey = `v2:${mode}:${src.slice(0, 120)}:${src.length}`;
  const cached = cleanedCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          resolve(src);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const getPixel = (x: number, y: number) => {
          const idx = (y * w + x) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };

        const isPureBlack = (x: number, y: number, threshold = 18) => {
          const [r, g, b] = getPixel(x, y);
          return r <= threshold && g <= threshold && b <= threshold;
        };

        const isBrightWhite = (x: number, y: number) => {
          const [r, g, b] = getPixel(x, y);
          return r >= 230 && g >= 230 && b >= 230;
        };

        // All 4 extreme corners must be pure black from PNG->JPEG transparency loss
        if (
          !isPureBlack(0, 0) ||
          !isPureBlack(w - 1, 0) ||
          !isPureBlack(0, h - 1) ||
          !isPureBlack(w - 1, h - 1)
        ) {
          resolve(src);
          return;
        }

        if (mode === 'banner') {
          // For a banner, only clean black rounded-corner artifacts if the banner itself has a white border/background
          // (top-center or bottom-center or left-center is bright white).
          // If the banner is a dark-themed image, DO NOT touch a single pixel!
          const midX = Math.floor(w / 2);
          const midY = Math.floor(h / 2);
          const hasWhiteEdges =
            isBrightWhite(midX, 2) ||
            isBrightWhite(midX, h - 3) ||
            isBrightWhite(2, midY) ||
            isBrightWhite(w - 3, midY);

          if (!hasWhiteEdges) {
            resolve(src);
            return;
          }
        }

        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const canFlood = (x: number, y: number, idx4: number) => {
          const r = data[idx4];
          const g = data[idx4 + 1];
          const b = data[idx4 + 2];
          if (mode === 'box') {
            // Only pure black outer background around 3D box
            return r < 22 && g < 22 && b < 22;
          } else {
            // In banner mode, restrict strictly to outer border/corner dark artifact pixels
            const nearBorder =
              x < Math.max(28, Math.floor(w * 0.06)) ||
              x >= w - Math.max(28, Math.floor(w * 0.06)) ||
              y < Math.max(28, Math.floor(h * 0.06)) ||
              y >= h - Math.max(28, Math.floor(h * 0.06));
            if (!nearBorder) return false;
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            return maxC < 90 && maxC - minC < 18;
          }
        };

        const pushIfValid = (x: number, y: number) => {
          const p = y * w + x;
          if (visited[p]) return;
          if (canFlood(x, y, p * 4)) {
            visited[p] = 1;
            queue[tail++] = p;
          }
        };

        // Seed from the 4 corners and outer edges
        for (let x = 0; x < w; x++) {
          pushIfValid(x, 0);
          pushIfValid(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushIfValid(0, y);
          pushIfValid(w - 1, y);
        }

        while (head < tail) {
          const p = queue[head++];
          const x = p % w;
          const y = (p - x) / w;
          const idx4 = p * 4;

          if (mode === 'box') {
            data[idx4 + 3] = 0;
          } else {
            data[idx4] = 255;
            data[idx4 + 1] = 255;
            data[idx4 + 2] = 255;
            data[idx4 + 3] = 255;
          }

          if (x > 0) pushIfValid(x - 1, y);
          if (x + 1 < w) pushIfValid(x + 1, y);
          if (y > 0) pushIfValid(x, y - 1);
          if (y + 1 < h) pushIfValid(x, y + 1);
        }

        ctx.putImageData(imgData, 0, 0);
        const cleaned = canvas.toDataURL('image/png');
        cleanedCache.set(cacheKey, cleaned);
        resolve(cleaned);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

const CleanPackageImage: React.FC<CleanPackageImageProps> = ({
  src,
  fallbackSrc = '',
  mode = 'box',
  onCleanedDataUrl,
  alt,
  className,
  ...rest
}) => {
  const effectiveSrc = src || fallbackSrc;
  const [displaySrc, setDisplaySrc] = useState<string>(effectiveSrc);

  useEffect(() => {
    let isMounted = true;
    const raw = src || fallbackSrc;
    setDisplaySrc(raw);

    if (raw && raw.startsWith('data:image/jpeg;base64,')) {
      repairLegacyBlackBackgroundJpeg(raw, mode).then((repaired) => {
        if (isMounted && repaired) {
          setDisplaySrc(repaired);
          if (repaired !== raw && onCleanedDataUrl) {
            onCleanedDataUrl(repaired);
          }
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc, mode]);

  if (!displaySrc) return null;

  return (
    <img
      src={displaySrc}
      alt={alt || 'Package'}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (fallbackSrc && (e.target as HTMLImageElement).src !== fallbackSrc) {
          (e.target as HTMLImageElement).src = fallbackSrc;
        }
      }}
      {...rest}
    />
  );
};

export default CleanPackageImage;
