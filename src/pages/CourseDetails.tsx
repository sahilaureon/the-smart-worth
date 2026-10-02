import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Star,
  Award,
  Clock,
  Box,
  Check,
  Plus,
  Minus,
  Play,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import CleanPackageImage from '../components/CleanPackageImage';
import SEO from '../components/SEO';
import { fetchApi } from '../lib/api';
import { cn } from '../lib/utils';
import {
  getCourseModules,
  getCourseModuleCount,
  parseCourseIds,
  getCachedCourses,
  setCachedCourses,
  getCachedPackages,
  setCachedPackages,
  formatSlugToTitle,
  findCourseByIdOrSlug,
  getCourseSlug,
  getCourseSeoPath
} from '../lib/packageUtils';

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const passedCourse = (location.state as any)?.course || null;

  const [courses, setCourses] = useState<any[]>(() => {
    const cached = getCachedCourses();
    if (passedCourse && !cached.some((c) => String(c.id) === String(passedCourse.id))) {
      return [passedCourse, ...cached];
    }
    return cached;
  });

  const [packages, setPackages] = useState<any[]>(() => getCachedPackages());
  const [isModulesOpen, setIsModulesOpen] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);

  const currentCourse =
    findCourseByIdOrSlug(courses, courseId) ||
    (passedCourse && findCourseByIdOrSlug([passedCourse], courseId) ? passedCourse : null);

  const [loading, setLoading] = useState<boolean>(() => !currentCourse && courses.length === 0);

  useEffect(() => {
    setIsModulesOpen(false);
    setIsDescExpanded(false);
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!currentCourse && courses.length === 0) {
        setLoading(true);
      }
      try {
        const [coursesRes, packagesRes] = await Promise.all([
          fetchApi('/courses'),
          fetchApi('/packages')
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const list = Array.isArray(data)
            ? data
            : data?.courses || data?.data || data?.raw || [];
          setCachedCourses(list);
          if (isMounted) setCourses(list);
        }

        if (packagesRes.ok) {
          const pkgData = await packagesRes.json();
          const pkgList = Array.isArray(pkgData)
            ? pkgData
            : pkgData?.packages || pkgData?.data || pkgData?.raw || [];
          setCachedPackages(pkgList);
          if (isMounted) setPackages(pkgList);
        }
      } catch (err) {
        console.error('Error loading course details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const headerTitle = currentCourse?.title || formatSlugToTitle(courseId, 'Our Courses');

  if (loading && !currentCourse) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Navbar />
        <PageHeader title={headerTitle} breadcrumb={headerTitle} />
        <div className="py-16 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-[#615DFA] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Navbar />
        <PageHeader title={headerTitle} breadcrumb={headerTitle} />
        <div className="max-w-2xl w-full mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Course Not Found</h1>
            <p className="text-slate-500 text-xs mb-6">
              The course you are looking for doesn't exist or may have been moved.
            </p>
            <div className="max-w-xs mx-auto">
              <BrutalistButton to="/courses" variant="primary" size="md" fullWidth>
                Back to All Courses
              </BrutalistButton>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const modules = getCourseModules(currentCourse);
  const moduleCount = getCourseModuleCount(currentCourse);
  const durationText = String(currentCourse.duration_text || '').trim();
  const ratingVal = Number(currentCourse.rating || 0);
  const categoryText = String(currentCourse.category || '').trim();
  const certificateText = String(currentCourse.certificate_text || '').trim();

  // Find packages that include this course in Admin Panel
  const matchingPackages = packages.filter((pkg) => {
    const ids = parseCourseIds(pkg.course_ids || pkg.courses).map((id) => id.toLowerCase());
    return (
      ids.includes(String(currentCourse.id || '').toLowerCase()) ||
      ids.includes(String(currentCourse.title || '').toLowerCase()) ||
      ids.includes(getCourseSlug(currentCourse)) ||
      String(currentCourse.package_id || '').toLowerCase() === String(pkg.id || '').toLowerCase()
    );
  });

  const primaryPkg = matchingPackages[0] || null;
  const primaryPkgBannerUrl = primaryPkg
    ? primaryPkg.detail_thumbnail_url ||
      primaryPkg.banner_url ||
      primaryPkg.inner_thumbnail_url ||
      primaryPkg.thumbnail_url ||
      ''
    : '';

  const highlightsList: string[] = Array.isArray(currentCourse.highlights)
    ? currentCourse.highlights.map((s: any) => String(s).trim()).filter(Boolean)
    : typeof currentCourse.highlights === 'string' && currentCourse.highlights.trim()
      ? currentCourse.highlights
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const insideThumbnail =
    currentCourse.detail_thumbnail_url ||
    currentCourse.banner_url ||
    currentCourse.thumbnail_url ||
    '';

  const hasInfoBadges =
    ratingVal > 0 || Boolean(certificateText) || Boolean(durationText) || moduleCount > 0;

  const rawDescription = String(currentCourse.description || '').trim();
  const isLongDescription = rawDescription.length > 320;

  const canonicalUrl =
    currentCourse.canonical_url ||
    `https://thesmartworth.site${getCourseSeoPath(currentCourse)}`;
  const seoTitle = currentCourse.seo_title || `${currentCourse.title} | The Smart Worth`;
  const seoDescription =
    currentCourse.seo_description ||
    rawDescription ||
    `Learn ${currentCourse.title} at The Smart Worth.`;
  const ogImageUrl =
    currentCourse.og_image || currentCourse.thumbnail_url || insideThumbnail || undefined;

  const courseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: currentCourse.title,
    description: seoDescription,
    url: canonicalUrl,
    provider: {
      '@type': 'Organization',
      name: 'The Smart Worth',
      sameAs: 'https://thesmartworth.site'
    }
  };
  if (ogImageUrl) {
    courseSchema.image = [ogImageUrl];
  }
  if (currentCourse.level) {
    courseSchema.educationalLevel = currentCourse.level;
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://thesmartworth.site/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses',
        item: 'https://thesmartworth.site/courses'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: currentCourse.title,
        item: canonicalUrl
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={currentCourse.seo_keywords || undefined}
        canonical={canonicalUrl}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogImage={ogImageUrl}
        noindex={currentCourse.is_indexed === false}
        structuredData={[courseSchema, breadcrumbSchema]}
      />
      <Navbar />
      <PageHeader title={currentCourse.title} breadcrumb={currentCourse.title} />

      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-8">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#615DFA] hover:border-[#615DFA]/40 shadow-2xs transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to All Courses</span>
          </Link>

          {moduleCount > 0 && (
            <span className="text-xs font-bold text-slate-500">
              {moduleCount} {moduleCount === 1 ? 'Module' : 'Modules'}
            </span>
          )}
        </div>

        {/* TOP MAIN CLASSIC COURSE CARD (100% Admin-Controlled Data) */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0A0E27] via-[#615DFA] to-[#0A0E27]" />

          <div className="p-4 sm:p-7 space-y-6">
            {/* Header Row */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#EEF2FF] border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold">
                  {currentCourse.title}
                </span>
                {categoryText && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0A0E27] text-white text-[11px] font-extrabold uppercase tracking-wide">
                    {categoryText}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-display font-black text-[#0A0E27] tracking-tight leading-snug">
                {currentCourse.title}
              </h1>
            </div>

            {/* Classic Info Badges Strip */}
            {hasInfoBadges && (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
                {ratingVal > 0 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Star size={13} className="fill-[#615DFA]" />
                    </span>
                    <span>{ratingVal} Rating</span>
                  </div>
                )}

                {certificateText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Award size={13} />
                    </span>
                    <span className="truncate">{certificateText}</span>
                  </div>
                )}

                {durationText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Clock size={13} />
                    </span>
                    <span className="truncate">Duration {durationText}</span>
                  </div>
                )}

                {moduleCount > 0 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Box size={13} />
                    </span>
                    <span>Modules {moduleCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Course Description Paragraph */}
            {rawDescription && (
              <div className="bg-[#F8FAFF] rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-2.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider">
                  Course Overview
                </h2>
                <p
                  className={cn(
                    'text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line',
                    !isDescExpanded && isLongDescription && 'line-clamp-4 sm:line-clamp-none'
                  )}
                >
                  {rawDescription}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded((prev) => !prev)}
                    className="sm:hidden inline-flex items-center gap-1 text-xs font-bold text-[#615DFA] hover:text-[#4F46E5] pt-1 cursor-pointer"
                  >
                    <span>{isDescExpanded ? 'Show Less' : 'Read Full Description'}</span>
                    {isDescExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
            )}

            {/* Inner Course Highlights & Single 16:9 Package Thumbnail Box */}
            {(highlightsList.length > 0 || primaryPkg) && (
              <div className="bg-[#F8FAFF] rounded-2xl border border-[#615DFA]/25 p-4 sm:p-6 shadow-2xs space-y-4">
                {highlightsList.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      Course Highlights:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {highlightsList.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium bg-white px-3 py-2 rounded-xl border border-slate-200/70"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-amber-500 stroke-[3]" />
                          </span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {primaryPkg && (
                  <div className="pt-1 space-y-3">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      Included in Package:
                    </p>
                    <Link
                      to={`/packages/${encodeURIComponent(String(primaryPkg.id))}`}
                      state={{ pkg: primaryPkg, allCourses: courses }}
                      className="group block w-full sm:w-80 bg-white hover:bg-[#EEF2FF]/40 border border-slate-200/90 hover:border-[#615DFA] rounded-2xl p-2.5 sm:p-3 transition-all shadow-2xs"
                    >
                      {primaryPkgBannerUrl && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                          <CleanPackageImage
                            src={primaryPkgBannerUrl}
                            fallbackSrc={primaryPkg.thumbnail_url || ''}
                            mode="banner"
                            alt={primaryPkg.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
                          />
                        </div>
                      )}
                      <div className="mt-2.5 px-1 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-display font-extrabold text-[#0A0E27] group-hover:text-[#615DFA] transition-colors leading-snug truncate">
                          {primaryPkg.name}
                        </span>
                        <span className="text-[11px] font-bold text-[#615DFA] shrink-0">
                          View Package →
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {primaryPkg && (
                  <div className="pt-2 sm:max-w-[240px]">
                    <BrutalistButton
                      to={`/packages/${encodeURIComponent(String(primaryPkg.id))}`}
                      state={{ pkg: primaryPkg, allCourses: courses }}
                      variant="primary"
                      size="sm"
                      className="py-3 px-6 text-xs sm:text-sm"
                      fullWidth
                    >
                      {primaryPkg.button_text || `View ${primaryPkg.name}`}
                    </BrutalistButton>
                  </div>
                )}
              </div>
            )}

            {/* Course Artwork / Thumbnail Preview Box (Only if course has its own separate banner) */}
            {insideThumbnail && !primaryPkg && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-3">
                <div className="w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-white">
                  <img
                    src={insideThumbnail}
                    alt={currentCourse.title}
                    className="w-full h-full object-cover block"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CLASSIC COMPLETE COURSE MODULES SECTION (Manual +/- Toggle) */}
        <section className="space-y-5">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EEF2FF] border border-[#615DFA]/20 text-[#615DFA] text-xs font-bold shadow-2xs mb-2.5">
              <span>{currentCourse.title} Curriculum</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-display font-black text-[#0A0E27] tracking-tight mb-1.5">
              Complete Course <span className="text-[#615DFA]">Modules</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Tap on the <span className="font-bold text-[#615DFA]">+</span> button below to view all lessons inside.
            </p>
          </div>

          <div
            className={cn(
              'rounded-2xl overflow-hidden border transition-all duration-200 bg-white',
              isModulesOpen
                ? 'border-[#615DFA] shadow-[0_8px_24px_rgba(97,93,250,0.12)]'
                : 'border-slate-200/90 hover:border-[#615DFA]/50 shadow-2xs'
            )}
          >
            <button
              type="button"
              onClick={() => setIsModulesOpen((prev) => !prev)}
              className={cn(
                'w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                isModulesOpen
                  ? 'bg-[#615DFA] text-white'
                  : 'bg-white hover:bg-[#F8FAFF] text-[#0A0E27]'
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center shrink-0 transition-colors',
                    isModulesOpen
                      ? 'bg-white text-[#615DFA] shadow-2xs'
                      : 'bg-[#EEF2FF] text-[#615DFA] border border-[#615DFA]/20'
                  )}
                >
                  01
                </span>
                <div className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm sm:text-base font-extrabold leading-snug truncate',
                      isModulesOpen ? 'text-white' : 'text-[#0A0E27]'
                    )}
                  >
                    {currentCourse.title}
                  </span>
                  <span
                    className={cn(
                      'block text-[11px] font-semibold mt-0.5',
                      isModulesOpen ? 'text-white/85' : 'text-slate-500'
                    )}
                  >
                    {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} •{' '}
                    {isModulesOpen ? 'Tap − to hide' : 'Tap + to view modules'}
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isModulesOpen
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-[#615DFA] text-white shadow-2xs'
                )}
              >
                {isModulesOpen ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
              </span>
            </button>

            {isModulesOpen && (
              <div className="p-3.5 sm:p-5 bg-[#F8FAFF] space-y-2.5 border-t border-slate-100">
                {modules.length > 0 ? (
                  modules.map((mod, modIdx) => (
                    <div
                      key={mod.id}
                      className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#EEF2FF] border border-[#615DFA]/20 text-[#615DFA] flex items-center justify-center shrink-0">
                          <Play size={11} className="fill-[#615DFA] ml-0.5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Module {String(modIdx + 1).padStart(2, '0')}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                            {mod.label}
                          </p>
                          {mod.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {mod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {mod.duration && (
                        <span className="text-[10px] font-bold text-[#615DFA] bg-[#EEF2FF] border border-[#615DFA]/15 px-2.5 py-1 rounded-lg shrink-0">
                          {mod.duration}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    No modules added in Admin Panel yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

