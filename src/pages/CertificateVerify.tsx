import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  Award,
  Calendar,
  User,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Share2,
  Loader2,
  FileText
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { CertificateUserData, CertificateTemplate } from '../types/certificate';
import { DEFAULT_MASTER_TEMPLATE } from '../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
  formatCertificateDate
} from '../lib/certificateEngine';

export default function CertificateVerify() {
  const { certId } = useParams<{ certId: string }>();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<CertificateUserData | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate>(DEFAULT_MASTER_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf'>('png');
  const [copiedLink, setCopiedLink] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!certId) return;
    loadCertificateData();
  }, [certId]);

  const loadCertificateData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch certificate verification details from API
      const res = await fetchApi(`/certificates/verify/${certId}`);
      if (!res.ok) {
        throw new Error('This certificate could not be verified or does not exist.');
      }
      const data = await res.json();

      const userCertData: CertificateUserData = {
        id: data.id || certId,
        cert_id: data.id || certId,
        full_name: data.user_name || 'Valued Learner',
        course_name: data.course_name || 'Professional Specialization',
        package_name: data.package_name || 'The Smart Worth Member',
        email: data.email || '',
        completion_date: formatCertificateDate(data.completion_date || data.created_at),
        tsw_id: data.tsw_id || 'TSW-STUDENT',
        profile_image: data.profile_image || '',
        issue_date: formatCertificateDate(data.created_at || data.completion_date),
        verification_status: 'VERIFIED & AUTHENTIC'
      };

      setCertData(userCertData);

      // 2. Fetch active template from site-settings if customized
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
      } catch (err) {
        console.warn('Using default certificate template:', err);
      }
    } catch (err: any) {
      console.error('Certificate verification error:', err);
      setError(err.message || 'Verification record not found');
    } finally {
      setLoading(false);
    }
  };

  // Render canvas once certData and template are ready
  useEffect(() => {
    if (!certData || !previewCanvasRef.current) return;
    renderCertificateToCanvas(previewCanvasRef.current, template, certData, { scale: 1 }).catch(
      (err) => console.error('Canvas render error:', err)
    );
  }, [certData, template]);

  const handleDownload = async () => {
    if (!certData) return;
    try {
      setIsDownloading(true);
      if (downloadFormat === 'pdf') {
        await downloadCertificateAsPdf(template, certData);
      } else {
        await downloadCertificateAsPng(template, certData);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
              SW
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                THE SMART WORTH
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Official Verification Portal
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard/certificates"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>My Certificates</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Verifying Certificate Authenticity...</h3>
            <p className="text-sm text-slate-400">
              Querying cryptographic credential records from The Smart Worth ledger.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-700/60 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">Certificate Verification Failed</h3>
            <p className="text-sm text-red-200/80 max-w-md mx-auto">
              {error}
            </p>
            <p className="text-xs text-slate-400">
              Requested ID: <code className="bg-slate-900 px-2 py-1 rounded text-slate-300 font-mono">{certId}</code>
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        )}

        {/* Verified Certificate Showcase */}
        {!loading && certData && (
          <div className="space-y-6">
            {/* Authenticity Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-left w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Verified &amp; Authentic
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {certData.cert_id || certData.id}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Official Certificate of Completion
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Issued and authenticated by <strong>The Smart Worth (TSW)</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy verification link"
                >
                  <Share2 size={15} />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>

                <div className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-5 py-2 rounded-lg bg-transparent hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>Download Certificate</span>
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

            {/* Live Certificate Visual Preview Canvas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
              <div className="relative w-full aspect-[1200/850] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-blue-400" /> Student Name
                </span>
                <p className="text-base font-bold text-white">{certData.full_name}</p>
                <p className="text-xs text-slate-400 font-mono">TSW ID: {certData.tsw_id}</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={13} className="text-amber-400" /> Completed Course
                </span>
                <p className="text-base font-bold text-white">{certData.course_name}</p>
                <p className="text-xs text-indigo-400 font-semibold">{certData.package_name}</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-400" /> Completion Date
                </span>
                <p className="text-base font-bold text-white">{certData.completion_date}</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Permanent Verifiable Record
                </p>
              </div>
            </div>

            {/* Official Certification Footer */}
            <div className="text-center py-6 text-xs text-slate-500 space-y-1">
              <p>
                This digital credential was generated with cryptographic authenticity verification on <strong>The Smart Worth</strong> network.
              </p>
              <p>
                Questions or verification inquiries: <a href="mailto:support@thesmartworth.site" className="text-indigo-400 hover:underline">support@thesmartworth.site</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
