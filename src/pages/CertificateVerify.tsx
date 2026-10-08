import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  Award,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Share2,
  Loader2,
  Search,
  Copy,
  Check,
  Clock,
  Ban,
  ShieldAlert,
  QrCode,
  FileText,
  Building2,
  BadgeCheck,
  RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchApi } from '../lib/api';
import { CertificateUserData, CertificateTemplate } from '../types/certificate';
import { DEFAULT_MASTER_TEMPLATE } from '../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
  formatCertificateDate,
  getVerificationUrl
} from '../lib/certificateEngine';

interface VerificationResult {
  id: string;
  certificate_id: string;
  candidate_name: string;
  course_name: string;
  certificate_type: string;
  issue_date: string;
  completion_date?: string;
  status: 'verified' | 'pending' | 'revoked';
  verification_status: string;
  verified: boolean;
  issued_by: string;
  verification_url: string;
  verification_date: string;
  certificate_url?: string;
  user_id?: string;
  email?: string;
  tsw_id?: string;
  profile_image?: string;
}

export default function CertificateVerify() {
  const { certId: paramCertId } = useParams<{ certId?: string }>();
  const navigate = useNavigate();

  // Active query ID (from URL param or manual search)
  const [activeCertId, setActiveCertId] = useState<string>(paramCertId ? paramCertId.trim() : '');
  const [searchInput, setSearchInput] = useState<string>(paramCertId ? paramCertId.trim() : '');

  const [loading, setLoading] = useState<boolean>(Boolean(paramCertId));
  const [certData, setCertData] = useState<VerificationResult | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate>(DEFAULT_MASTER_TEMPLATE);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [notFoundId, setNotFoundId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf'>('png');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync param when URL changes
  useEffect(() => {
    if (paramCertId) {
      const clean = paramCertId.trim();
      setActiveCertId(clean);
      setSearchInput(clean);
      fetchCertificate(clean);
    } else {
      setActiveCertId('');
      setCertData(null);
      setNotFound(false);
      setLoading(false);
    }
  }, [paramCertId]);

  // SEO & robots meta tag handling
  useEffect(() => {
    // 1. Dynamic document title
    if (certData) {
      document.title = `${certData.candidate_name} – Certificate Verification | The Smart Worth`;
    } else if (notFound) {
      document.title = `Certificate Not Found | The Smart Worth`;
    } else {
      document.title = `Certificate Verification | The Smart Worth`;
    }

    // 2. Set "noindex, follow" for individual certificates to prevent public crawling of personal records
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    let createdMeta = false;
    if (activeCertId) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
        createdMeta = true;
      }
      robotsMeta.content = 'noindex, follow';
    }

    return () => {
      if (createdMeta && robotsMeta && robotsMeta.parentNode) {
        robotsMeta.parentNode.removeChild(robotsMeta);
      } else if (robotsMeta) {
        robotsMeta.content = 'index, follow';
      }
    };
  }, [certData, notFound, activeCertId]);

  const fetchCertificate = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setNotFound(false);
      setNotFoundId('');

      const res = await fetchApi(`/certificates/verify/${encodeURIComponent(cleanId)}`);

      if (res.status === 404) {
        setNotFound(true);
        setNotFoundId(cleanId);
        setCertData(null);
        return;
      }

      if (!res.ok) {
        throw new Error('Could not communicate with the verification server.');
      }

      const data: VerificationResult = await res.json();
      setCertData(data);
      setNotFound(false);

      // Load active certificate template for visual rendering
      try {
        const settingsRes = await fetchApi('/site-settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.certificate_custom_template) {
            const parsed = JSON.parse(settings.certificate_custom_template);
            if (parsed && parsed.elements) {
              setTemplate(parsed);
            }
          }
        }
      } catch (tErr) {
        console.warn('Using default template for rendering:', tErr);
      }
    } catch (err: any) {
      console.error('Certificate verification error:', err);
      setErrorMsg(err.message || 'An unexpected verification error occurred.');
      setCertData(null);
    } finally {
      setLoading(false);
    }
  };

  // Render canvas when certData and template are ready
  useEffect(() => {
    if (!certData || !previewCanvasRef.current) return;

    const userCertData: CertificateUserData = {
      id: certData.certificate_id,
      cert_id: certData.certificate_id,
      full_name: certData.candidate_name,
      course_name: certData.course_name,
      package_name: certData.course_name,
      email: certData.email || '',
      completion_date: formatCertificateDate(certData.completion_date || certData.issue_date),
      tsw_id: certData.tsw_id || 'TSW-STUDENT',
      profile_image: certData.profile_image || '',
      issue_date: formatCertificateDate(certData.issue_date),
      verification_status: certData.status.toUpperCase()
    };

    renderCertificateToCanvas(previewCanvasRef.current, template, userCertData, { scale: 1 }).catch(
      (err) => console.error('Canvas preview render error:', err)
    );
  }, [certData, template]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    navigate(`/certificate/${encodeURIComponent(clean)}`);
  };

  const handleCopyUrl = () => {
    if (!certData) return;
    const urlToCopy = certData.verification_url || getVerificationUrl(certData.certificate_id);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(urlToCopy);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleCopyId = () => {
    if (!certData) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(certData.certificate_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (!certData) return;
    try {
      setIsDownloading(true);
      const userCertData: CertificateUserData = {
        id: certData.certificate_id,
        cert_id: certData.certificate_id,
        full_name: certData.candidate_name,
        course_name: certData.course_name,
        package_name: certData.course_name,
        email: certData.email || '',
        completion_date: formatCertificateDate(certData.completion_date || certData.issue_date),
        tsw_id: certData.tsw_id || 'TSW-STUDENT',
        profile_image: certData.profile_image || '',
        issue_date: formatCertificateDate(certData.issue_date),
        verification_status: certData.status.toUpperCase()
      };

      if (downloadFormat === 'pdf') {
        await downloadCertificateAsPdf(template, userCertData);
      } else {
        await downloadCertificateAsPng(template, userCertData);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadQrCode = () => {
    if (!certData) return;
    const svgEl = document.getElementById('official-cert-qr-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 20, 20, 560, 560);
        const a = document.createElement('a');
        a.download = `QR_${certData.certificate_id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header & Brand Identity */}
        <header className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white shadow-xl shadow-indigo-600/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              SW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  THE SMART WORTH
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Official
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Certificate Verification Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700"
            >
              <span>Student Dashboard</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </header>

        {/* Search Bar - Always accessible to search any Certificate ID */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. TSW-2026-000001)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              <span>Verify ID</span>
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Verifying Certificate Authenticity...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Connecting to The Smart Worth official credential ledger to validate record integrity.
            </p>
          </div>
        )}

        {/* Initial Portal Landing (When no ID has been entered) */}
        {!loading && !activeCertId && !notFound && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
              <QrCode size={34} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Credential Verification System
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enter a Certificate ID in the search box above or scan the QR code printed on an official certificate issued by <strong>The Smart Worth</strong> to verify candidate authenticity.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span>Format example:</span>
              <span className="font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                TSW-YYYY-XXXXXX
              </span>
            </div>
          </div>
        )}

        {/* Not Found State (Requirement 4 & 12) */}
        {!loading && notFound && (
          <div className="bg-red-950/30 border border-red-800/60 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-700/60 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-900/20">
              <ShieldAlert size={36} />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                Verification Failed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                Certificate Not Found
              </h2>
              <p className="text-sm text-red-200/90 max-w-lg mx-auto leading-relaxed">
                The Certificate ID provided could not be found in The Smart Worth verification database.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-red-900/40 inline-block max-w-md mx-auto">
              <span className="text-xs text-slate-400 block mb-1">Requested Identifier:</span>
              <code className="text-sm font-mono text-white font-bold bg-slate-900 px-3 py-1 rounded border border-slate-800">
                {notFoundId || activeCertId}
              </code>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setNotFound(false);
                  setActiveCertId('');
                  setSearchInput('');
                  navigate('/certificate');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Verification
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('TSW-2026-000001');
                  navigate('/certificate/TSW-2026-000001');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-bold text-xs transition-colors cursor-pointer"
              >
                Try Sample ID: TSW-2026-000001
              </button>
            </div>
          </div>
        )}

        {/* Unexpected Network / Server Error */}
        {!loading && errorMsg && !notFound && (
          <div className="bg-red-950/30 border border-red-800/60 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <AlertCircle size={36} className="text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">System Error</h3>
            <p className="text-xs text-red-200/80">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchCertificate(activeCertId)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Certificate Found & Displayed (Requirement 3, 4, 13, 14) */}
        {!loading && certData && (
          <div className="space-y-6">

            {/* 1. Main Status Banner (Prominently Displayed) */}
            {certData.status === 'verified' && (
              <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xl shadow-emerald-500/10">
                    <ShieldCheck size={36} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                        ✓ CERTIFICATE VERIFIED
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {certData.certificate_id}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      This certificate has been successfully verified
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
                      Confirmed genuine and authentic in The Smart Worth certificate database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Copy permanent verification URL"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUrl ? 'URL Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {certData.status === 'pending' && (
              <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xl shadow-amber-500/10">
                    <Clock size={36} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold tracking-wider text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                        ⏳ CERTIFICATE PENDING
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {certData.certificate_id}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      Certificate Under Verification Review
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-200/90 mt-0.5">
                      This certificate exists in the database but has not yet been fully activated.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUrl ? 'URL Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {certData.status === 'revoked' && (
              <div className="bg-gradient-to-r from-red-950/95 via-slate-900 to-red-950/90 border-2 border-red-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-xl shadow-red-500/10">
                    <Ban size={36} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold tracking-wider text-red-300 bg-red-500/30 px-3 py-1 rounded-full border border-red-500/40">
                        ✕ CERTIFICATE REVOKED
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {certData.certificate_id}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      This Certificate Is No Longer Valid
                    </h2>
                    <p className="text-xs sm:text-sm text-red-200/90 mt-0.5">
                      This credential was previously issued but has been officially cancelled/revoked.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUrl ? 'URL Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Structured Verification Information Cards (Requirement 3, 14) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Candidate Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-blue-400" /> Candidate
                </span>
                <p className="text-lg font-black text-white">{certData.candidate_name}</p>
                {certData.tsw_id && (
                  <p className="text-xs text-slate-400 font-mono">TSW ID: {certData.tsw_id}</p>
                )}
              </div>

              {/* Course / Program Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" /> Program / Course
                </span>
                <p className="text-lg font-black text-white">{certData.course_name}</p>
                <p className="text-xs text-indigo-400 font-semibold">{certData.certificate_type}</p>
              </div>

              {/* Certificate ID Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BadgeCheck size={14} className="text-emerald-400" /> Certificate ID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </span>
                <p className="text-base font-mono font-black text-white tracking-wide">
                  {certData.certificate_id}
                </p>
                <p className="text-xs text-slate-400">Unique Ledger ID</p>
              </div>

              {/* Issue & Completion Date */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-400" /> Issue Date
                </span>
                <p className="text-base font-bold text-white">
                  {formatCertificateDate(certData.issue_date)}
                </p>
                {certData.completion_date && (
                  <p className="text-xs text-slate-400">
                    Completed: {formatCertificateDate(certData.completion_date)}
                  </p>
                )}
              </div>

              {/* Issued By */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-purple-400" /> Issued By
                </span>
                <p className="text-base font-bold text-white">{certData.issued_by}</p>
                <p className="text-xs text-slate-400">Authentic Authority</p>
              </div>

              {/* Verification Timestamp */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-cyan-400" /> Verification Date
                </span>
                <p className="text-sm font-semibold text-white">
                  {new Date(certData.verification_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-[11px] text-cyan-400 font-mono">
                  {new Date(certData.verification_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })} IST
                </p>
              </div>

            </div>

            {/* 3. Verification URL & QR Verification Section (Requirement 5) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      QR Verification &amp; Permanent Link
                    </h3>
                    <p className="text-xs text-slate-400">
                      Printed on the official certificate to enable instant smartphone validation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download QR</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* SVG QR Code (Clean & High Contrast) */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center border border-slate-200">
                  <QRCodeSVG
                    id="official-cert-qr-svg"
                    value={certData.verification_url || getVerificationUrl(certData.certificate_id)}
                    size={130}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-3 w-full text-center sm:text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Permanent Verification URL
                    </span>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono text-indigo-300 truncate select-all flex-1 text-left">
                        {certData.verification_url || getVerificationUrl(certData.certificate_id)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scanning this QR code from any standard camera or QR reader will directly open this verification record at <strong>verify.thesmartworth.site</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Live Visual Certificate Canvas & Download */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} className="text-amber-400" />
                    <span>Official Certificate Document</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-resolution cryptographic render with official stamp and watermark.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      <span>Download</span>
                    </button>

                    <select
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value as 'png' | 'pdf')}
                      className="bg-transparent text-white text-xs font-semibold px-2 py-2 pr-3 outline-none border-l border-white/20 cursor-pointer"
                    >
                      <option value="png" className="bg-slate-900 text-white">PNG</option>
                      <option value="pdf" className="bg-slate-900 text-white">PDF</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Canvas viewport */}
              <div className="relative w-full aspect-[1200/850] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Official Certification Footer */}
            <footer className="text-center py-6 text-xs text-slate-500 space-y-1.5 border-t border-slate-900">
              <p>
                Certificate successfully verified through <strong>The Smart Worth</strong> certificate database.
              </p>
              <p>
                For official institutional validation inquiries, email <a href="mailto:support@thesmartworth.site" className="text-indigo-400 hover:underline">support@thesmartworth.site</a>.
              </p>
            </footer>

          </div>
        )}

      </div>
    </div>
  );
}
