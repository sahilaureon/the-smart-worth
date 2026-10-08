import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { CertificateElement, CertificateTemplate, CertificateUserData } from '../types/certificate';

/**
 * Format date to standard DD-MM-YYYY
 */
export function formatCertificateDate(dateStr?: string | Date): string {
  if (!dateStr) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  }

  try {
    const dObj = new Date(dateStr);
    if (isNaN(dObj.getTime())) {
      // If already DD-MM-YYYY format
      if (/^\d{2}-\d{2}-\d{4}$/.test(String(dateStr).trim())) {
        return String(dateStr).trim();
      }
      return String(dateStr);
    }
    const d = String(dObj.getDate()).padStart(2, '0');
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const y = dObj.getFullYear();
    return `${d}-${m}-${y}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Replace placeholders like {{full_name}}, {{course_name}}, etc.
 */
export function resolveCertificatePlaceholders(
  text: string,
  userData: CertificateUserData
): string {
  if (!text) return '';

  return text
    .replace(/\{\{full_name\}\}/gi, userData.full_name || 'Valued Learner')
    .replace(/\{\{course_name\}\}/gi, userData.course_name || 'Skill Specialization Course')
    .replace(/\{\{package_name\}\}/gi, userData.package_name || 'The Smart Worth')
    .replace(/\{\{email\}\}/gi, userData.email || '')
    .replace(/\{\{completion_date\}\}/gi, formatCertificateDate(userData.completion_date))
    .replace(/\{\{tsw_id\}\}/gi, userData.tsw_id || 'TSW-STUDENT')
    .replace(/\{\{cert_id\}\}/gi, userData.cert_id || userData.id || 'TSW-CERT')
    .replace(/\{\{instructor_name\}\}/gi, userData.instructor_name || 'Sahil Baisla')
    .replace(/\{\{grade\}\}/gi, userData.grade || 'A+')
    .replace(/\{\{score\}\}/gi, userData.score || '95%')
    .replace(/\{\{completion_hours\}\}/gi, userData.completion_hours || '30+ Hours')
    .replace(/\{\{batch_name\}\}/gi, userData.batch_name || 'Batch 2026')
    .replace(/\{\{issue_date\}\}/gi, formatCertificateDate(userData.issue_date || userData.completion_date))
    .replace(/\{\{valid_until\}\}/gi, userData.valid_until || 'Lifetime')
    .replace(/\{\{achievement\}\}/gi, userData.achievement || 'Distinction')
    .replace(/\{\{verification_status\}\}/gi, userData.verification_status || 'VERIFIED');
}

/**
 * Generate permanent verification URL for certificates and QR codes
 * Always formats as: https://verify.thesmartworth.site/certificate/{CERTIFICATE_ID}
 */
export function getVerificationUrl(certId: string): string {
  const cleanId = encodeURIComponent((certId || 'TSW-CERT').trim());
  return `https://verify.thesmartworth.site/certificate/${cleanId}`;
}

/**
 * Get environment-aware verification URL (works in local dev/staging too)
 */
export function getActiveVerificationUrl(certId: string): string {
  const cleanId = encodeURIComponent((certId || 'TSW-CERT').trim());
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/certificate/${cleanId}`;
  }
  return `https://verify.thesmartworth.site/certificate/${cleanId}`;
}

/**
 * Default fallback avatar for students who don't have a profile image
 */
function createDefaultAvatarCanvas(name: string, size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  // Premium royal gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1E40AF');
  grad.addColorStop(1, '#4F46E5');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Initial letter
  const initial = (name || 'S').trim().charAt(0).toUpperCase();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(size * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, size / 2, size / 2);

  return c;
}

/**
 * Draw ornate corner flourish
 */
function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  // L-corner frame
  ctx.beginPath();
  ctx.moveTo(0, 45);
  ctx.lineTo(0, 0);
  ctx.lineTo(45, 0);
  ctx.stroke();

  // Secondary offset corner
  ctx.beginPath();
  ctx.moveTo(8, 35);
  ctx.lineTo(8, 8);
  ctx.lineTo(35, 8);
  ctx.stroke();

  // Corner floral dot / diamond
  ctx.beginPath();
  ctx.moveTo(18, 14);
  ctx.lineTo(22, 18);
  ctx.lineTo(18, 22);
  ctx.lineTo(14, 18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw embossed Gold Seal Emblem
 */
function drawEmbossedGoldSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const radius = size / 2;
  ctx.save();
  ctx.translate(cx, cy);

  // Ribbons hanging down
  ctx.fillStyle = '#991B1B'; // Deep royal red ribbon
  // Left ribbon
  ctx.beginPath();
  ctx.moveTo(-16, radius - 10);
  ctx.lineTo(-24, radius + 34);
  ctx.lineTo(-14, radius + 26);
  ctx.lineTo(-4, radius + 34);
  ctx.lineTo(-6, radius - 10);
  ctx.closePath();
  ctx.fill();

  // Right ribbon
  ctx.beginPath();
  ctx.moveTo(6, radius - 10);
  ctx.lineTo(4, radius + 34);
  ctx.lineTo(14, radius + 26);
  ctx.lineTo(24, radius + 34);
  ctx.lineTo(16, radius - 10);
  ctx.closePath();
  ctx.fill();

  // Starburst scalloped edge (24 points)
  const points = 24;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? radius : radius - 5;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Gold gradient fill
  const sealGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  sealGrad.addColorStop(0, '#FFE57F');
  sealGrad.addColorStop(0.3, '#F59E0B');
  sealGrad.addColorStop(0.7, '#D97706');
  sealGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = sealGrad;
  ctx.fill();

  // Outer border ring
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner gold ring
  ctx.beginPath();
  ctx.arc(0, 0, radius - 9, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dark core circle
  ctx.beginPath();
  ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius - 14);
  coreGrad.addColorStop(0, '#0F172A');
  coreGrad.addColorStop(1, '#070B1E');
  ctx.fillStyle = coreGrad;
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Seal center text / emblem
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICIAL', 0, -10);

  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('SEAL', 0, 2);

  ctx.font = '600 7px sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText('★ TSW ★', 0, 14);

  ctx.restore();
}

/**
 * Main renderer: renders entire dynamic certificate onto HTML5 canvas
 */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  template: CertificateTemplate,
  userData: CertificateUserData,
  options?: { scale?: number }
): Promise<void> {
  const scale = options?.scale || 1;
  const baseW = template.canvas_width || 1200;
  const baseH = template.canvas_height || 850;

  canvas.width = baseW * scale;
  canvas.height = baseH * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Draw Background
  const theme = template.theme;
  if (theme.background_type === 'image' && theme.background_image) {
    try {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        bgImg.onload = res;
        bgImg.onerror = rej;
        bgImg.src = theme.background_image!;
      });
      ctx.drawImage(bgImg, 0, 0, baseW, baseH);
    } catch {
      ctx.fillStyle = theme.background_color || '#070B1E';
      ctx.fillRect(0, 0, baseW, baseH);
    }
  } else if (theme.background_type === 'classic_light') {
    // Elegant light parchment background with subtle texture
    ctx.fillStyle = theme.background_color || '#FBFBFC';
    ctx.fillRect(0, 0, baseW, baseH);

    // Subtle soft radial glow
    const lightGlow = ctx.createRadialGradient(baseW / 2, baseH / 2, 80, baseW / 2, baseH / 2, 600);
    lightGlow.addColorStop(0, '#FFFFFF');
    lightGlow.addColorStop(1, '#F1F5F9');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, baseW, baseH);
  } else if (theme.background_type === 'royal_purple') {
    const purpleGrad = ctx.createLinearGradient(0, 0, baseW, baseH);
    purpleGrad.addColorStop(0, '#1E1B4B');
    purpleGrad.addColorStop(0.5, '#0F172A');
    purpleGrad.addColorStop(1, '#311042');
    ctx.fillStyle = purpleGrad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else {
    // Default Navy Blue Gradient with royal accents
    const grad = ctx.createLinearGradient(0, 0, baseW, baseH);
    grad.addColorStop(0, '#060A1A'); // Deep midnight navy
    grad.addColorStop(0.45, '#0A122E'); // Rich royal blue-navy
    grad.addColorStop(0.85, '#0E1738'); // Subtle violet-navy sheen
    grad.addColorStop(1, '#060918');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);

    // Subtle soft luxury gold/blue radial spotlight in center
    const spotlight = ctx.createRadialGradient(baseW / 2, 420, 50, baseW / 2, 420, 550);
    spotlight.addColorStop(0, 'rgba(30, 64, 175, 0.18)');
    spotlight.addColorStop(0.6, 'rgba(99, 102, 241, 0.08)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  // 2. Borders & Corner Ornaments
  if (theme.show_outer_border) {
    const margin = 28;
    ctx.strokeStyle = theme.outer_border_color || '#D4AF37';
    ctx.lineWidth = theme.outer_border_width || 6;
    ctx.strokeRect(margin, margin, baseW - margin * 2, baseH - margin * 2);
  }

  if (theme.show_inner_border) {
    const margin2 = 40;
    ctx.strokeStyle = theme.inner_border_color || '#1E40AF';
    ctx.lineWidth = theme.inner_border_width || 2;
    ctx.strokeRect(margin2, margin2, baseW - margin2 * 2, baseH - margin2 * 2);

    // Thin accent hairline
    const margin3 = 45;
    ctx.strokeStyle = theme.corner_color ? `${theme.corner_color}66` : 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(margin3, margin3, baseW - margin3 * 2, baseH - margin3 * 2);
  }

  if (theme.show_corner_decorations) {
    const cornerCol = theme.corner_color || '#D4AF37';
    const inset = 46;
    drawCornerFlourish(ctx, inset, inset, 0, cornerCol); // Top-left
    drawCornerFlourish(ctx, baseW - inset, inset, Math.PI / 2, cornerCol); // Top-right
    drawCornerFlourish(ctx, baseW - inset, baseH - inset, Math.PI, cornerCol); // Bottom-right
    drawCornerFlourish(ctx, inset, baseH - inset, -Math.PI / 2, cornerCol); // Bottom-left
  }

  // 3. Render Elements
  // Pre-load images / QR if needed
  const certId = userData.cert_id || userData.id || 'TSW-CERT-DEMO';
  const verifyUrl = getVerificationUrl(certId);

  for (const el of template.elements) {
    if (!el.visible) continue;

    ctx.save();

    if (el.type === 'shape') {
      ctx.fillStyle = el.color || '#D4AF37';
      const w = el.width || 200;
      const h = el.height || 2;
      ctx.fillRect(el.x - w / 2, el.y - h / 2, w, h);
    } else if (el.type === 'seal') {
      const sealSize = el.width || 96;
      drawEmbossedGoldSeal(ctx, el.x, el.y, sealSize);
    } else if (el.type === 'qr') {
      const qrW = el.width || 80;
      const qrH = el.height || 80;
      const qx = el.x - qrW / 2;
      const qy = el.y - qrH / 2;

      // Draw white card backing for QR readability
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      const r = 8;
      ctx.moveTo(qx - 4 + r, qy - 4);
      ctx.arcTo(qx + qrW + 4, qy - 4, qx + qrW + 4, qy + qrH + 4, r);
      ctx.arcTo(qx + qrW + 4, qy + qrH + 4, qx - 4, qy + qrH + 4, r);
      ctx.arcTo(qx - 4, qy + qrH + 4, qx - 4, qy - 4, r);
      ctx.arcTo(qx - 4, qy - 4, qx + qrW + 4, qy - 4, r);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          margin: 1,
          width: qrW * 2,
          color: {
            dark: '#070B1E',
            light: '#FFFFFF'
          }
        });
        const qrImg = new Image();
        await new Promise((res, rej) => {
          qrImg.onload = res;
          qrImg.onerror = rej;
          qrImg.src = qrDataUrl;
        });
        ctx.drawImage(qrImg, qx, qy, qrW, qrH);
      } catch (qrErr) {
        console.warn('QR code generation failed, drawing placeholder:', qrErr);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(qx, qy, qrW, qrH);
      }
    } else if (el.type === 'image' && el.field_key === 'profile_image') {
      const imgW = el.width || 100;
      const imgH = el.height || 100;
      const ix = el.x - imgW / 2;
      const iy = el.y - imgH / 2;

      let avatarCanvas: HTMLCanvasElement | HTMLImageElement | null = null;
      const avatarSrc = userData.profile_image;

      if (avatarSrc && avatarSrc.trim().length > 0) {
        try {
          const userImg = new Image();
          if (!avatarSrc.startsWith('data:') && !avatarSrc.startsWith('blob:')) {
            userImg.crossOrigin = 'anonymous';
          }
          await new Promise((res, rej) => {
            userImg.onload = res;
            userImg.onerror = rej;
            userImg.src = avatarSrc;
          });
          avatarCanvas = userImg;
        } catch {
          avatarCanvas = createDefaultAvatarCanvas(userData.full_name, imgW);
        }
      } else {
        avatarCanvas = createDefaultAvatarCanvas(userData.full_name, imgW);
      }

      ctx.save();
      ctx.beginPath();
      if (el.shape === 'square') {
        const rad = 8;
        ctx.roundRect ? ctx.roundRect(ix, iy, imgW, imgH, rad) : ctx.rect(ix, iy, imgW, imgH);
      } else {
        ctx.arc(el.x, el.y, imgW / 2, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.clip();

      if (avatarCanvas) {
        const nw = (avatarCanvas as any).naturalWidth || avatarCanvas.width || imgW;
        const nh = (avatarCanvas as any).naturalHeight || avatarCanvas.height || imgH;
        const minDim = Math.min(nw, nh);
        const sx = (nw - minDim) / 2;
        const sy = (nh - minDim) / 2;
        ctx.drawImage(avatarCanvas, sx, sy, minDim, minDim, ix, iy, imgW, imgH);
      }
      ctx.restore();

      // Border outline
      ctx.strokeStyle = el.border_color || '#D4AF37';
      ctx.lineWidth = el.border_width || 3;
      ctx.beginPath();
      if (el.shape === 'square') {
        const rad = 8;
        ctx.roundRect ? ctx.roundRect(ix, iy, imgW, imgH, rad) : ctx.rect(ix, iy, imgW, imgH);
      } else {
        ctx.arc(el.x, el.y, imgW / 2, 0, Math.PI * 2);
      }
      ctx.stroke();
    } else {
      // Text element
      const rawText = el.default_text || '';
      const resolved = resolveCertificatePlaceholders(rawText, userData);

      const fontStyle = el.font_style === 'italic' ? 'italic ' : '';
      const fontWeight = el.font_weight || 'normal';
      const fontSize = el.font_size || 16;
      const fontFamily = el.font_family || 'Montserrat';

      ctx.font = `${fontStyle}${fontWeight} ${fontSize}px "${fontFamily}", serif, sans-serif`;
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.textAlign = el.text_align || 'center';
      ctx.textBaseline = 'middle';

      // Letter spacing support
      if (el.letter_spacing && el.letter_spacing > 0 && typeof (ctx as any).letterSpacing !== 'undefined') {
        (ctx as any).letterSpacing = `${el.letter_spacing}px`;
      }

      ctx.fillText(resolved, el.x, el.y);

      // Reset letter spacing
      if (typeof (ctx as any).letterSpacing !== 'undefined') {
        (ctx as any).letterSpacing = '0px';
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Download high-resolution PNG of the certificate
 */
export async function downloadCertificateAsPng(
  template: CertificateTemplate,
  userData: CertificateUserData,
  fileName?: string
): Promise<void> {
  const exportCanvas = document.createElement('canvas');
  // 2x high-resolution print ready (2400 x 1700)
  await renderCertificateToCanvas(exportCanvas, template, userData, { scale: 2 });

  const safeTitle = (userData.course_name || 'Course').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeName = (userData.full_name || 'Student').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const finalName = fileName || `TSW_Certificate_${safeName}_${safeTitle}.png`;

  const dataUrl = exportCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download printable A4 Landscape PDF of the certificate
 */
export async function downloadCertificateAsPdf(
  template: CertificateTemplate,
  userData: CertificateUserData,
  fileName?: string
): Promise<void> {
  const exportCanvas = document.createElement('canvas');
  await renderCertificateToCanvas(exportCanvas, template, userData, { scale: 2 });

  const imgData = exportCanvas.toDataURL('image/png');
  // Landscape A4: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const safeTitle = (userData.course_name || 'Course').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeName = (userData.full_name || 'Student').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const finalName = fileName || `TSW_Certificate_${safeName}_${safeTitle}.pdf`;

  pdf.save(finalName);
}
