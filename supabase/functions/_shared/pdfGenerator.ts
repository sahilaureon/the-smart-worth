/**
 * Pure TypeScript / Deno / Edge-Compatible PDF 1.4 Binary Generator
 * Generates a clean, printable Official Payment Receipt PDF from The Smart Worth
 * without requiring native canvas or Node-only binaries in Edge Functions.
 */

export interface ReceiptPdfData {
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  dateStr: string;
  status: string;
  packageName: string;
  originalPrice: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  customerName: string;
  username: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  referralCode?: string;
  websiteName?: string;
  websiteUrl?: string;
  ownerName?: string;
  ownerEmail?: string;
}

const escapePdfText = (input: string): string =>
  String(input || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const formatCurrencyAscii = (amount: number): string =>
  `INR ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export function generateEdgeReceiptPdfBytes(data: ReceiptPdfData): Uint8Array {
  const websiteName = data.websiteName || 'The Smart Worth';
  const websiteUrl = data.websiteUrl || 'https://thesmartworth.site';
  const ownerName = data.ownerName || 'Sahil Aureon';
  const ownerEmail = data.ownerEmail || 'helplinesmartworth@gmail.com';

  const ops: string[] = [];

  // Top Header Banner (#312e81 Indigo)
  ops.push('0.19 0.18 0.51 rg');
  ops.push('0 742 595 100 re f');

  // Header Brand Title
  ops.push('BT /F2 22 Tf 1 1 1 rg 42 795 Td (' + escapePdfText(websiteName.toUpperCase()) + ') Tj ET');
  ops.push(
    'BT /F1 10 Tf 0.85 0.87 1 rg 42 777 Td (' +
      escapePdfText(`Official Tax Invoice & Payment Receipt  |  ${websiteUrl}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.85 0.87 1 rg 42 762 Td (' +
      escapePdfText(`Founder & Owner: ${ownerName}  |  Support: ${ownerEmail}`) +
      ') Tj ET'
  );

  // Right Header Badge
  ops.push('0.09 0.64 0.29 rg');
  ops.push('430 785 125 26 re f');
  ops.push('BT /F2 11 Tf 1 1 1 rg 444 794 Td (PAID & VERIFIED) Tj ET');
  ops.push(
    'BT /F2 10 Tf 1 1 1 rg 435 765 Td (' +
      escapePdfText(`Receipt: ${data.invoiceNumber}`) +
      ') Tj ET'
  );

  // Section 1: Transaction Metadata Box
  ops.push('0.96 0.97 0.99 rg');
  ops.push('42 650 511 74 re f');
  ops.push('0.85 0.87 0.92 RG 1 w 42 650 511 74 re S');

  ops.push('BT /F2 11 Tf 0.12 0.16 0.23 rg 54 706 Td (TRANSACTION & ORDER DETAILS) Tj ET');
  ops.push(
    'BT /F1 9.5 Tf 0.22 0.25 0.32 rg 54 688 Td (' +
      escapePdfText(`Order ID: ${data.orderId}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9.5 Tf 0.22 0.25 0.32 rg 54 673 Td (' +
      escapePdfText(`Transaction ID: ${data.paymentId || 'Verified via UPI'}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9.5 Tf 0.22 0.25 0.32 rg 54 658 Td (' +
      escapePdfText(`Payment Method: ${data.paymentMethod || 'UPI QR Code (The Smart Worth Pay)'}`) +
      ') Tj ET'
  );

  ops.push(
    'BT /F1 9.5 Tf 0.22 0.25 0.32 rg 330 688 Td (' +
      escapePdfText(`Invoice No: ${data.invoiceNumber}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9.5 Tf 0.22 0.25 0.32 rg 330 673 Td (' +
      escapePdfText(`Date: ${data.dateStr}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F2 9.5 Tf 0.09 0.55 0.25 rg 330 658 Td (' +
      escapePdfText(`Status: ${data.status.toUpperCase()}`) +
      ') Tj ET'
  );

  // Section 2: Customer & Merchant Columns
  ops.push('0.98 0.98 0.99 rg');
  ops.push('42 530 248 106 re f');
  ops.push('305 530 248 106 re f');
  ops.push('0.85 0.87 0.92 RG 1 w 42 530 248 106 re S');
  ops.push('0.85 0.87 0.92 RG 1 w 305 530 248 106 re S');

  ops.push('BT /F2 10.5 Tf 0.12 0.16 0.23 rg 54 618 Td (CUSTOMER BILLING DETAILS) Tj ET');
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 54 600 Td (' +
      escapePdfText(`Name: ${data.customerName || 'Valued Student'}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 54 586 Td (' +
      escapePdfText(`Username: @${data.username || 'student'}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 54 572 Td (' +
      escapePdfText(`Email: ${data.customerEmail}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 54 558 Td (' +
      escapePdfText(`Mobile: +91 ${data.customerPhone || 'N/A'}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 8.5 Tf 0.22 0.25 0.32 rg 54 542 Td (' +
      escapePdfText(`Address: ${data.billingAddress || 'India'}`) +
      ') Tj ET'
  );

  ops.push('BT /F2 10.5 Tf 0.12 0.16 0.23 rg 317 618 Td (MERCHANT & OWNER DETAILS) Tj ET');
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 317 600 Td (' +
      escapePdfText(`Platform: ${websiteName}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 317 586 Td (' +
      escapePdfText(`Founder & Owner: ${ownerName}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 317 572 Td (' +
      escapePdfText(`Website: ${websiteUrl}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.25 0.32 rg 317 558 Td (' +
      escapePdfText(`Support: ${ownerEmail}`) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 8.5 Tf 0.19 0.18 0.51 rg 317 542 Td (' +
      escapePdfText(`Referral Code: ${data.referralCode || 'Direct Enrollment'}`) +
      ') Tj ET'
  );

  // Section 3: Itemized Package & Offer Breakdown Table
  ops.push('0.19 0.18 0.51 rg');
  ops.push('42 485 511 28 re f');
  ops.push('BT /F2 10 Tf 1 1 1 rg 54 495 Td (PACKAGE / PRODUCT DESCRIPTION) Tj ET');
  ops.push('BT /F2 10 Tf 1 1 1 rg 355 495 Td (QTY) Tj ET');
  ops.push('BT /F2 10 Tf 1 1 1 rg 445 495 Td (AMOUNT) Tj ET');

  // Table Row
  ops.push('1 1 1 rg 42 445 511 40 re f');
  ops.push('0.85 0.87 0.92 RG 1 w 42 445 511 40 re S');
  ops.push(
    'BT /F2 10.5 Tf 0.12 0.16 0.23 rg 54 467 Td (' +
      escapePdfText(data.packageName) +
      ') Tj ET'
  );
  ops.push(
    'BT /F1 8.5 Tf 0.42 0.45 0.50 rg 54 453 Td (Digital Learning Package - Instant Lifetime Access) Tj ET'
  );
  ops.push('BT /F2 10 Tf 0.12 0.16 0.23 rg 360 460 Td (x1) Tj ET');
  ops.push(
    'BT /F2 10 Tf 0.12 0.16 0.23 rg 445 460 Td (' +
      escapePdfText(formatCurrencyAscii(data.originalPrice)) +
      ') Tj ET'
  );

  // Totals Box
  ops.push('0.97 0.98 1 rg 280 335 273 100 re f');
  ops.push('0.85 0.87 0.92 RG 1 w 280 335 273 100 re S');

  ops.push('BT /F1 9.5 Tf 0.30 0.33 0.40 rg 294 415 Td (Original Package Price (MRP):) Tj ET');
  ops.push(
    'BT /F1 9.5 Tf 0.30 0.33 0.40 rg 450 415 Td (' +
      escapePdfText(formatCurrencyAscii(data.originalPrice)) +
      ') Tj ET'
  );

  ops.push('BT /F2 9.5 Tf 0.09 0.58 0.26 rg 294 395 Td (Special Offer / Discount:) Tj ET');
  ops.push(
    'BT /F2 9.5 Tf 0.09 0.58 0.26 rg 442 395 Td (' +
      escapePdfText(`- ${formatCurrencyAscii(data.discountAmount)}`) +
      ') Tj ET'
  );

  ops.push('BT /F1 9.5 Tf 0.30 0.33 0.40 rg 294 375 Td (Subtotal:) Tj ET');
  ops.push(
    'BT /F1 9.5 Tf 0.30 0.33 0.40 rg 450 375 Td (' +
      escapePdfText(formatCurrencyAscii(data.finalAmount)) +
      ') Tj ET'
  );

  ops.push('0.19 0.18 0.51 RG 1.2 w 290 364 m 543 364 l S');
  ops.push('BT /F2 11.5 Tf 0.12 0.16 0.23 rg 294 346 Td (TOTAL AMOUNT PAID:) Tj ET');
  ops.push(
    'BT /F2 11.5 Tf 0.19 0.18 0.51 rg 445 346 Td (' +
      escapePdfText(formatCurrencyAscii(data.finalAmount)) +
      ') Tj ET'
  );

  // Footer Verification Stamp
  ops.push('0.93 0.98 0.95 rg 42 250 511 55 re f');
  ops.push('0.65 0.89 0.74 RG 1 w 42 250 511 55 re S');
  ops.push(
    'BT /F2 10 Tf 0.06 0.48 0.22 rg 56 283 Td (COMPUTER GENERATED OFFICIAL PAYMENT RECEIPT - VERIFIED BY THE SMART WORTH PAY) Tj ET'
  );
  ops.push(
    'BT /F1 9 Tf 0.22 0.35 0.28 rg 56 265 Td (' +
      escapePdfText(
        `Thank you for enrolling with ${websiteName}! For any assistance, email ${ownerEmail}.`
      ) +
      ') Tj ET'
  );

  const contentStream = ops.join('\n');
  const streamByteLen = new TextEncoder().encode(contentStream).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  const encoder = new TextEncoder();

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
