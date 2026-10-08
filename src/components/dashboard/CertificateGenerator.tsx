import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Plus,
  History,
  FileCheck,
  User,
  Mail,
  Package,
  X,
  Check,
  ExternalLink,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../App';
import confetti from 'canvas-confetti';
import { cn } from '../../lib/utils';
import { storageService } from '../../services/storageService';
import { CertificateTemplate, CertificateUserData } from '../../types/certificate';
import { DEFAULT_MASTER_TEMPLATE } from '../../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  formatCertificateDate
} from '../../lib/certificateEngine';
import { jsPDF } from 'jspdf';

const CertificateGenerator = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [savedCertificates, setSavedCertificates] = useState<any[]>([]);
  const [fetchingLibrary, setFetchingLibrary] = useState(false);
  const [packageName, setPackageName] = useState<string>('FREE MEMBER');
  const [alertBanner, setAlertBanner] = useState<{
    type: 'warning' | 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deduplicateCertificates = (certs: any[]) => {
    const seen = new Set<string>();
    return (certs || []).filter((c: any) => {
      const key = String(c?.package_name || '').trim().toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getExistingCertificateForCourse = (courseTitle?: string) => {
    if (!courseTitle) return null;
    const target = courseTitle.trim().toLowerCase();
    return (
      savedCertificates.find(
        (c: any) => String(c?.package_name || '').trim().toLowerCase() === target
      ) || null
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user certificates right away so we know which courses already have certificates
      try {
        const certRes = await fetchApi(`/certificates/${user!.id}`);
        if (certRes.ok) {
          const certData = await certRes.json();
          setSavedCertificates(deduplicateCertificates(certData || []));
        }
      } catch (e) {
        console.warn('Could not pre-fetch certificates:', e);
      }

      // Fetch Profile
      const profileRes = await fetchApi(`/profile/${user!.id}`);
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();

      setProfile(profileData);
      if (!profileData?.package_id) {
        setPackageName('FREE MEMBER');
      }

      if (profileData?.package_id) {
        const pkgRes = await fetchApi(`/packages/${profileData.package_id}`);
        if (pkgRes.ok) {
          const pkgInfo = await pkgRes.json();
          setPackageName(pkgInfo.name || 'FREE MEMBER');
        } else {
          setPackageName('FREE MEMBER');
        }
      }

      // Fetch Enrolled Packages
      const enrollmentsRes = await fetchApi(`/enrollments/${user!.id}`);
      if (!enrollmentsRes.ok) throw new Error('Failed to fetch enrollments');
      const enrollments = await enrollmentsRes.json();

      const enrolledPkgIds = enrollments?.map((e: any) => e.package_id) || [];
      if (profileData?.package_id && !enrolledPkgIds.includes(profileData.package_id)) {
        enrolledPkgIds.push(profileData.package_id);
      }

      if (enrolledPkgIds.length > 0) {
        const pkgDataRes = await fetchApi('/packages');

        if (pkgDataRes.ok) {
          const allPkgs = await pkgDataRes.json();
          const pkgList = Array.isArray(allPkgs) ? allPkgs : [];
          const pkgData = pkgList.filter((p: any) => enrolledPkgIds.includes(p.id));
          setPackages(pkgData || []);

          if (pkgData && pkgData.length > 0) {
            const primaryPkg =
              pkgData.find((p: any) => String(p.id) === String(profileData?.package_id)) ||
              pkgData[0];
            if (primaryPkg?.name) setPackageName(primaryPkg.name);
          }

          const courseIdsSet = new Set<string>();
          pkgData?.forEach((pkg: any) => {
            if (pkg.courses && Array.isArray(pkg.courses)) {
              pkg.courses.forEach((id: string) => courseIdsSet.add(String(id)));
            } else if (pkg.courses && typeof pkg.courses === 'string') {
              pkg.courses.split(',').forEach((id: string) => {
                const trimmed = id.trim();
                if (trimmed) courseIdsSet.add(trimmed);
              });
            }
          });

          const uniqueCourseIds = Array.from(courseIdsSet);
          const courseDataRes = await fetchApi('/courses');
          if (courseDataRes.ok) {
            const coursesJson = await courseDataRes.json();
            const allCourses = Array.isArray(coursesJson)
              ? coursesJson
              : coursesJson?.courses || coursesJson?.data || coursesJson?.raw || [];
            const matchedCourses =
              uniqueCourseIds.length > 0
                ? allCourses.filter(
                    (c: any) =>
                      (uniqueCourseIds.includes(String(c.id)) ||
                        enrolledPkgIds.includes(String(c.package_id))) &&
                      c.is_active !== false
                  )
                : [];
            setCourses(
              matchedCourses.length > 0
                ? matchedCourses
                : allCourses.filter((c: any) => c.is_active !== false)
            );
          }
        }
      } else {
        const courseDataRes = await fetchApi('/courses');
        if (courseDataRes.ok) {
          const coursesJson = await courseDataRes.json();
          const allCourses = Array.isArray(coursesJson)
            ? coursesJson
            : coursesJson?.courses || coursesJson?.data || coursesJson?.raw || [];
          setCourses(allCourses);
        }
      }
    } catch (err) {
      console.error('Error fetching data for certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLibrary = async () => {
    if (!user) return;
    try {
      setFetchingLibrary(true);
      const response = await fetchApi(`/certificates/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch certificates');
      const data = await response.json();
      setSavedCertificates(deduplicateCertificates(data || []));
    } catch (err) {
      console.error('Error fetching library:', err);
    } finally {
      setFetchingLibrary(false);
    }
  };

  const downloadCertificate = async (imgUrl: string, title: string, certId?: string) => {
    if (!imgUrl) return;
    const trackingId = certId || title;
    setDownloadingId(trackingId);

    const safeFileName = `TSW_Certificate_${String(title || 'Course')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')}.png`;

    try {
      let blob: Blob | null = null;

      if (imgUrl.startsWith('data:')) {
        const parts = imgUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: mime });
      } else {
        const response = await fetch(imgUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Network fetch failed');
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1500);

      setDownloadedId(trackingId);
      setTimeout(() => {
        setDownloadedId((prev) => (prev === trackingId ? null : prev));
      }, 2500);
    } catch (err) {
      console.error('Direct blob download fallback:', err);
      // Fallback for external URLs
      const link = document.createElement('a');
      link.href = imgUrl.includes('cloudinary.com') && imgUrl.includes('/upload/')
        ? imgUrl.replace('/upload/', '/upload/fl_attachment/')
        : imgUrl;
      link.download = safeFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadCertificatePdf = async (imgUrl: string, title: string, certId?: string) => {
    if (!imgUrl) return;
    const trackingId = `pdf-${certId || title}`;
    setDownloadingId(trackingId);

    const safeFileName = `TSW_Certificate_${String(title || 'Course')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`;

    try {
      let finalImg = imgUrl;
      if (!imgUrl.startsWith('data:')) {
        const response = await fetch(imgUrl, { mode: 'cors' });
        const blob = await response.blob();
        finalImg = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(finalImg, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(safeFileName);

      setDownloadedId(trackingId);
      setTimeout(() => {
        setDownloadedId((prev) => (prev === trackingId ? null : prev));
      }, 2500);
    } catch (err) {
      console.warn('PDF export fallback:', err);
      downloadCertificate(imgUrl, title, certId);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setShowDropdown(false);

    const existing = getExistingCertificateForCourse(course?.title);
    if (existing) {
      setAlertBanner({
        type: 'warning',
        title: 'Certificate Pehle Se Bana Hua Hai!',
        message: `"${course.title}" course ka certificate pehle se bana hua hai. Ek course ka certificate dobara nahi banega. Aap ise My Library se download kar sakte hain.`
      });
    } else {
      setAlertBanner(null);
    }
  };

  const generateCertificate = async () => {
    if (!selectedCourse || !profile) return;

    // Strict check: prevent generating if already generated
    const existing = getExistingCertificateForCourse(selectedCourse.title);
    if (existing) {
      setAlertBanner({
        type: 'warning',
        title: 'Certificate Pehle Se Bana Hua Hai!',
        message: `"${selectedCourse.title}" course ka certificate pehle se bana hua hai. Ek course ka certificate dobara nahi banega.`
      });
      return;
    }

    setIsGenerating(true);
    setAlertBanner(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fetch active template if customized
      let activeTemplate: CertificateTemplate = DEFAULT_MASTER_TEMPLATE;
      try {
        const settingsRes = await fetchApi('/site-settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.certificate_custom_template) {
            const parsed = JSON.parse(settingsData.certificate_custom_template);
            if (parsed && parsed.elements) {
              activeTemplate = parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Using default master certificate template:', e);
      }

      const certId = crypto.randomUUID ? crypto.randomUUID() : `cert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const certSerial = `TSW-CERT-${certId.substring(0, 8).toUpperCase()}`;

      const certUserData: CertificateUserData = {
        id: certId,
        cert_id: certSerial,
        full_name: resolvedFullName,
        course_name: selectedCourse.title,
        package_name: packageName,
        email: user.email || profile?.email || '',
        completion_date: formatCertificateDate(new Date()),
        tsw_id: profile?.tsw_id || ('TSW-' + String(profile?.id || user.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 7).toUpperCase()),
        profile_image: profile?.avatar_url || profile?.profile_pic || '',
        issue_date: formatCertificateDate(new Date()),
        verification_status: 'VERIFIED & AUTHENTIC'
      };

      // Dynamically render the complete certificate onto canvas
      await renderCertificateToCanvas(canvas, activeTemplate, certUserData, { scale: 1 });

      const dataUrl = canvas.toDataURL('image/png');

      let finalCertificateUrl = dataUrl;
      try {
        const cloudinaryUrl = await storageService.uploadBase64ToCloudinary(
          dataUrl,
          'user_certificates'
        );
        if (cloudinaryUrl) {
          finalCertificateUrl = cloudinaryUrl;
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload failed, using local base64:', uploadErr);
      }

      const saveRes = await fetchApi('/certificates', {
        method: 'POST',
        body: JSON.stringify({
          id: certId,
          certificate_id: certSerial,
          user_id: user.id,
          user_name: resolvedFullName,
          package_name: selectedCourse.title,
          certificate_url: finalCertificateUrl
        })
      });

      const saveJson = await saveRes.json().catch(() => null);

      if (saveRes.status === 409 || saveJson?.alreadyExists) {
        if (saveJson?.certificate) {
          setSavedCertificates((prev) => deduplicateCertificates([saveJson.certificate, ...prev]));
        }
        setAlertBanner({
          type: 'warning',
          title: 'Certificate Pehle Se Bana Hua Hai!',
          message: `"${selectedCourse.title}" course ka certificate pehle se bana hua hai. Ek course ka certificate dobara nahi banega.`
        });
        return;
      }

      if (!saveRes.ok) throw new Error('Failed to save certificate');

      const createdCert = saveJson || {
        id: `cert-${Date.now()}`,
        user_id: user.id,
        user_name: profile.full_name || profile.username,
        package_name: selectedCourse.title,
        certificate_url: finalCertificateUrl,
        created_at: new Date().toISOString()
      };

      setSavedCertificates((prev) => deduplicateCertificates([createdCert, ...prev]));

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setAlertBanner({
        type: 'success',
        title: 'Certificate Successfully Ban Gaya!',
        message: `"${selectedCourse.title}" ka certificate ban chuka hai aur My Library me save ho gaya hai.`
      });

      // Automatically switch to My Library so user sees course name + download button
      setActiveTab('library');
    } catch (err) {
      console.error('Error generating certificate:', err);
      setAlertBanner({
        type: 'error',
        title: 'Certificate Generation Failed',
        message: 'Certificate generate karne me problem aayi. Kripya dobara try karein.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resolvedFullName = (() => {
    const nameCandidates = [
      profile?.full_name,
      user?.user_metadata?.full_name,
      profile?.username,
      user?.email?.split('@')[0]
    ].filter(Boolean);
    const rawName =
      nameCandidates.find((n) => (n as string).includes(' ')) || nameCandidates[0] || 'Student';
    return String(rawName).toUpperCase();
  })();

  const existingSelectedCert = getExistingCertificateForCourse(selectedCourse?.title);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Classic Header & Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award size={14} className="text-slate-700" />
            <span>Academic Credentials</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Certificates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each completed course is eligible for a single official certificate.
          </p>
        </div>

        {/* Classic Segmented Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-md border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'generate'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Plus size={14} />
            <span>Generate New</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'library'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <History size={14} />
            <span>My Library</span>
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded font-bold',
                activeTab === 'library'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              )}
            >
              {savedCertificates.length}
            </span>
          </button>
        </div>
      </div>

      {/* Classic Alert Banner */}
      {alertBanner && (
        <div
          className={cn(
            'rounded-lg border p-4 flex items-start justify-between gap-3 shadow-sm',
            alertBanner.type === 'warning' &&
              'bg-amber-50 border-amber-200 text-amber-900',
            alertBanner.type === 'success' &&
              'bg-emerald-50 border-emerald-200 text-emerald-900',
            alertBanner.type === 'error' &&
              'bg-red-50 border-red-200 text-red-900'
          )}
        >
          <div className="flex items-start gap-3">
            {alertBanner.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : alertBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {alertBanner.title}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {alertBanner.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="p-1 rounded hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {activeTab === 'generate' ? (
        <div className="space-y-6">
          {/* Student Details Classic Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Full Name
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {resolvedFullName}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {profile?.email || user?.email || 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Package size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Active Package
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {packageName.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Course Selection & Generation Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Select Completed Course
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose a course below to generate your completion certificate. Once generated, a certificate cannot be created again for the same course.
              </p>
            </div>

            <div className="p-5 space-y-5">
              {/* Classic Dropdown Selector */}
              <div className="max-w-xl" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Course Name
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full h-11 px-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-md flex items-center justify-between text-left transition-colors focus:outline-none focus:border-slate-900"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award size={16} className="text-slate-600 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {selectedCourse ? selectedCourse.title : 'Choose a completed course...'}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-slate-500 transition-transform duration-200 shrink-0 ml-2',
                        showDropdown && 'rotate-180'
                      )}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {courses.length > 0 ? (
                        courses.map((course) => {
                          const alreadyMade = Boolean(
                            getExistingCertificateForCourse(course.title)
                          );
                          const isSelected = selectedCourse?.id === course.id;

                          return (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => handleSelectCourse(course)}
                              className={cn(
                                'w-full px-4 py-3 text-left transition-colors flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer',
                                isSelected && 'bg-slate-50'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileCheck
                                  size={15}
                                  className={cn(
                                    'shrink-0',
                                    alreadyMade ? 'text-emerald-600' : 'text-slate-400'
                                  )}
                                />
                                <span className="text-xs font-bold text-slate-800 uppercase truncate">
                                  {course.title}
                                </span>
                              </div>

                              {alreadyMade ? (
                                <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Already Generated
                                </span>
                              ) : (
                                <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-slate-100 text-slate-600">
                                  Available
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-6 text-center text-slate-500">
                          <AlertCircle className="mx-auto text-slate-400 mb-1.5" size={20} />
                          <p className="text-xs font-semibold">No courses available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area based on whether selected course already has a certificate */}
              {selectedCourse && (
                <div className="pt-2">
                  {existingSelectedCert ? (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                            Pehle Se Bana Hua Hai (Already Generated)
                          </h4>
                          <p className="text-xs text-amber-800 mt-1">
                            Course <span className="font-bold">"{selectedCourse.title}"</span> ka certificate pehle hi ban chuka hai. Ek course ka certificate dobara nahi banega.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            downloadCertificate(
                              existingSelectedCert.certificate_url,
                              existingSelectedCert.package_name,
                              existingSelectedCert.id
                            )
                          }
                          disabled={downloadingId === (existingSelectedCert.id || existingSelectedCert.package_name)}
                          className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                        >
                          {downloadingId === (existingSelectedCert.id || existingSelectedCert.package_name) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          <span>Download Certificate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('library')}
                          className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Go to My Library
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Ready to Generate: {selectedCourse.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          Certificate will be issued to{' '}
                          <span className="font-semibold text-slate-900">{resolvedFullName}</span>. Note: Once generated, it cannot be regenerated for this course.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={generateCertificate}
                        disabled={isGenerating}
                        className="px-5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Award className="w-4 h-4" />
                            <span>Generate Certificate</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MY LIBRARY TAB: Classic Course Name + Direct Auto-Download Button (No Full Certificate Preview) */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                My Certificate Library
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click the download button next to any course to automatically download your certificate.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700">
              Total: {savedCertificates.length}
            </span>
          </div>

          {fetchingLibrary ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-slate-700 animate-spin" />
            </div>
          ) : savedCertificates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Award size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Certificates Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                You haven't generated any course certificates yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('generate')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Generate Certificate
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {savedCertificates.map((cert, index) => {
                const trackKey = cert.id || cert.package_name || String(index);
                const isDownloading = downloadingId === trackKey;
                const isDownloaded = downloadedId === trackKey;

                return (
                  <div
                    key={trackKey}
                    className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <Award size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">
                          {cert.package_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-slate-500">
                            Issued:{' '}
                            {cert.created_at
                              ? new Date(cert.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Verified'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap">
                      {(cert.certificate_id || cert.id) && (
                        <Link
                          to={`/certificate/${encodeURIComponent(cert.certificate_id || cert.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="Open dynamic verification & credential page"
                        >
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span>Verify</span>
                          <ExternalLink size={12} className="text-slate-400" />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          downloadCertificate(cert.certificate_url, cert.package_name, trackKey)
                        }
                        disabled={isDownloading}
                        className={cn(
                          'px-3.5 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60',
                          isDownloaded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        )}
                        title="Download high-resolution image"
                      >
                        {isDownloading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : isDownloaded ? (
                          <>
                            <Check size={13} />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} />
                            <span>PNG</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadCertificatePdf(cert.certificate_url, cert.package_name, trackKey)
                        }
                        disabled={downloadingId === `pdf-${trackKey}`}
                        className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
                        title="Download printable A4 landscape PDF"
                      >
                        {downloadingId === `pdf-${trackKey}` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <FileText size={13} />
                            <span>PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CertificateGenerator;
