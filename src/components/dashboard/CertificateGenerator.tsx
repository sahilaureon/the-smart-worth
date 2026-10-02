import React, { useState, useEffect, useRef } from 'react';
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
  Check
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../App';
import confetti from 'canvas-confetti';
import { cn } from '../../lib/utils';
import { storageService } from '../../services/storageService';

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

      // Fetch template if exists
      const settingsRes = await fetchApi('/site-settings');
      if (!settingsRes.ok) throw new Error('Failed to fetch settings');
      const settingsData = await settingsRes.json();

      const templateUrl = settingsData.certificate_template;
      const positionsRaw = settingsData.certificate_positions || '{}';
      let positions: any = {};
      try {
        positions = typeof positionsRaw === 'string' ? JSON.parse(positionsRaw) : positionsRaw;
      } catch (e) {
        console.error('Error parsing positions:', e);
      }

      const customPos = templateUrl ? positions[templateUrl] : null;
      const certId = `TSW-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Set canvas size (A4 Landscape aspect ratio roughly)
      canvas.width = 1200;
      canvas.height = 850;

      let usedTemplate = false;
      if (templateUrl) {
        try {
          const img = new Image();
          if (!templateUrl.startsWith('data:') && !templateUrl.startsWith('blob:')) {
            img.crossOrigin = 'anonymous';
          }
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Template image failed to load'));
            img.src =
              templateUrl.startsWith('data:') || templateUrl.startsWith('blob:')
                ? templateUrl
                : `${templateUrl}${templateUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
          });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          usedTemplate = true;

          // Draw User DP (Profile Picture 1:1) if template is used
          const dpSrc = profile.avatar_url || profile.profile_pic;
          if (dpSrc) {
            try {
              const avatarImg = new Image();
              if (!dpSrc.startsWith('data:') && !dpSrc.startsWith('blob:')) {
                avatarImg.crossOrigin = 'anonymous';
              }
              await new Promise((resolve, reject) => {
                avatarImg.onload = resolve;
                avatarImg.onerror = reject;
                avatarImg.src = dpSrc;
              });

              const dpX = Number(customPos?.dp?.x ?? 138);
              const dpY = Number(customPos?.dp?.y ?? 182);
              const dpSize = Number(customPos?.dp?.size ?? 120);
              const dpShape = customPos?.dp?.shape || 'circle';
              const halfSize = dpSize / 2;

              // 1:1 Center-Crop (object-fit: cover) calculation
              const imgW = avatarImg.naturalWidth || avatarImg.width || dpSize;
              const imgH = avatarImg.naturalHeight || avatarImg.height || dpSize;
              const minDim = Math.min(imgW, imgH);
              const sx = (imgW - minDim) / 2;
              const sy = (imgH - minDim) / 2;

              ctx.save();
              ctx.beginPath();
              if (dpShape === 'square') {
                const r = Math.min(12, halfSize * 0.15);
                const x0 = dpX - halfSize;
                const y0 = dpY - halfSize;
                ctx.moveTo(x0 + r, y0);
                ctx.arcTo(x0 + dpSize, y0, x0 + dpSize, y0 + dpSize, r);
                ctx.arcTo(x0 + dpSize, y0 + dpSize, x0, y0 + dpSize, r);
                ctx.arcTo(x0, y0 + dpSize, x0, y0, r);
                ctx.arcTo(x0, y0, x0 + dpSize, y0, r);
              } else {
                ctx.arc(dpX, dpY, halfSize, 0, Math.PI * 2);
              }
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(
                avatarImg,
                sx,
                sy,
                minDim,
                minDim,
                dpX - halfSize,
                dpY - halfSize,
                dpSize,
                dpSize
              );
              ctx.restore();
            } catch (e) {
              console.warn('Could not draw user avatar on certificate:', e);
            }
          }
        } catch (tplErr) {
          console.warn('Custom template could not be loaded, using default certificate design:', tplErr);
          usedTemplate = false;
        }
      }

      if (!usedTemplate) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0A0E27');
        gradient.addColorStop(1, '#1A1E37');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 15;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        ctx.strokeStyle = '#615DFA';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE SMART WORTH', canvas.width / 2, 120);

        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 80px sans-serif';
        ctx.fillText('CERTIFICATE', canvas.width / 2, 220);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'italic 30px sans-serif';
        ctx.fillText('OF COMPLETION', canvas.width / 2, 275);
      }

      ctx.fillStyle = usedTemplate ? '#555555' : '#A0AEC0';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      if (!usedTemplate) {
        ctx.fillText('THIS CERTIFICATE IS PROUDLY PRESENTED TO', canvas.width / 2, 355);
      }

      ctx.fillStyle = '#D4AF37';
      ctx.font = usedTemplate ? 'bold 64px Cinzel, serif' : 'bold 72px serif';
      ctx.shadowBlur = usedTemplate ? 0 : 4;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      const nameY = (usedTemplate ? customPos?.name?.y : null) || 440;
      const nameX = (usedTemplate ? customPos?.name?.x : null) || canvas.width / 2;

      const nameCandidates = [
        profile?.full_name,
        user?.user_metadata?.full_name,
        profile?.username,
        user?.email?.split('@')[0]
      ].filter(Boolean);

      const rawName =
        nameCandidates.find((n) => (n as string).includes(' ')) || nameCandidates[0] || 'Student';
      const displayName = String(rawName).toUpperCase();

      ctx.fillText(displayName, nameX, nameY);
      ctx.shadowBlur = 0;

      if (!usedTemplate) {
        ctx.strokeStyle = '#615DFA';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 300, 465);
        ctx.lineTo(canvas.width / 2 + 300, 465);
        ctx.stroke();
      }

      ctx.fillStyle = usedTemplate ? '#555555' : '#A0AEC0';
      ctx.font = '24px sans-serif';
      if (!usedTemplate) {
        ctx.fillText('FOR SUCCESSFULLY COMPLETING THE COURSE', canvas.width / 2, 525);
      }

      ctx.fillStyle = usedTemplate ? '#D4AF37' : '#FFFFFF';
      ctx.font = usedTemplate ? 'bold 50px Cinzel, serif' : 'bold 44px sans-serif';
      const courseY = (usedTemplate ? customPos?.course?.y : null) || (usedTemplate ? 585 : 580);
      const courseX = (usedTemplate ? customPos?.course?.x : null) || canvas.width / 2;
      ctx.fillText(selectedCourse.title.toUpperCase(), courseX, courseY);

      if (!usedTemplate) {
        ctx.fillStyle = '#4A5568';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ID: ${certId}`, 60, 810);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#718096';
        ctx.font = '16px sans-serif';
        ctx.fillText(
          'FROM THE SMART WORTH ACADEMY WISH YOU ALL THE BEST FOR THE FUTURE',
          canvas.width / 2,
          640
        );

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ISSUE DATE:', 150, 750);
        ctx.fillText(
          new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }),
          150,
          780
        );

        ctx.textAlign = 'right';
        ctx.font = 'italic 36px "Brush Script MT", cursive';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Sahil Aureon', canvas.width - 150, 745);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('FOUNDER & CEO', canvas.width - 150, 775);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

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
          user_id: user.id,
          user_name: profile.full_name || profile.username,
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

                    <div className="flex items-center justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCertificate(cert.certificate_url, cert.package_name, trackKey)
                        }
                        disabled={isDownloading}
                        className={cn(
                          'w-full sm:w-auto px-4 py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60',
                          isDownloaded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        )}
                      >
                        {isDownloading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isDownloaded ? (
                          <>
                            <Check size={14} />
                            <span>Downloaded</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Download Certificate</span>
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
