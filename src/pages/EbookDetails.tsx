import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Check,
  Box,
  User,
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
  getCachedEbooks,
  setCachedEbooks,
  getCachedPackages,
  setCachedPackages,
  getCachedCourses,
  setCachedCourses,
  findEbookByIdOrSlug,
  getEbookSeoPath,
  getCourseSeoPath,
  formatSlugToTitle,
  resolvePrimaryWorthCategory
} from '../lib/packageUtils';

export default function EbookDetails() {
  const { ebookId } = useParams<{ ebookId: string }>();
  const location = useLocation();
  const passedEbook = (location.state as any)?.ebook || null;

  const [ebooks, setEbooks] = useState<any[]>(() => {
    const cached = getCachedEbooks();
    if (passedEbook && !cached.some((e) => String(e.id) === String(passedEbook.id))) {
      return [passedEbook, ...cached];
    }
    return cached;
  });
  const [packages, setPackages] = useState<any[]>(() => getCachedPackages());
  const [courses, setCourses] = useState<any[]>(() => getCachedCourses());
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const currentEbook =
    findEbookByIdOrSlug(ebooks, ebookId) ||
    (passedEbook && findEbookByIdOrSlug([passedEbook], ebookId) ? passedEbook : null);

  const [loading, setLoading] = useState<boolean>(() => !currentEbook && ebooks.length === 0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!currentEbook && ebooks.length === 0) {
        setLoading(true);
      }
      try {
        const [ebooksRes, packagesRes, coursesRes] = await Promise.all([
          fetchApi('/ebooks'),
          fetchApi('/packages'),
          fetchApi('/courses')
        ]);

        if (ebooksRes.ok) {
          const ebData = await ebooksRes.json();
          const ebList = Array.isArray(ebData)
            ? ebData
            : ebData?.ebooks || ebData?.data || ebData?.raw || [];
          setCachedEbooks(ebList);
          if (isMounted) setEbooks(ebList);
        }

        if (packagesRes.ok) {
          const pkgData = await packagesRes.json();
          const pkgList = Array.isArray(pkgData)
            ? pkgData
            : pkgData?.packages || pkgData?.data || pkgData?.raw || [];
          setCachedPackages(pkgList);
          if (isMounted) setPackages(pkgList);
        }

        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          const cList = Array.isArray(cData)
            ? cData
            : cData?.courses || cData?.data || cData?.raw || [];
          setCachedCourses(cList);
          if (isMounted) setCourses(cList);
        }
      } catch (err) {
        console.error('Error loading E-book details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [ebookId]);

  const ebookTitle =
    currentEbook?.title || currentEbook?.name || formatSlugToTitle(ebookId, 'Our E-Books');

  if (loading && !currentEbook) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Navbar />
        <PageHeader title={ebookTitle} breadcrumb={ebookTitle} />
        <div className="py-16 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-[#615DFA] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentEbook) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Navbar />
        <PageHeader title={ebookTitle} breadcrumb={ebookTitle} />
        <div className="max-w-2xl w-full mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">E-Book Not Found</h1>
            <p className="text-slate-500 text-xs mb-6">
              The E-book you are looking for doesn't exist or may have been moved.
            </p>
            <div className="max-w-xs mx-auto">
              <BrutalistButton to="/ebooks" variant="primary" size="md" fullWidth>
                Back to All E-Books
              </BrutalistButton>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const chapters: any[] = Array.isArray(currentEbook.chapters) ? currentEbook.chapters : [];
  const learningOutcomes: string[] = Array.isArray(currentEbook.learning_outcomes)
    ? currentEbook.learning_outcomes.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  const worthCat = resolvePrimaryWorthCategory(currentEbook.category);
  const parentPkg =
    packages.find(
      (pkg) =>
        (currentEbook.package_id && String(pkg.id) === String(currentEbook.package_id)) ||
        (Array.isArray(pkg.ebook_ids) && pkg.ebook_ids.includes(currentEbook.id)) ||
        (worthCat &&
          resolvePrimaryWorthCategory(pkg.category || pkg.name)?.slug === worthCat.slug)
    ) || null;

  const relatedCourses = courses.filter((c) => {
    if (
      Array.isArray(currentEbook.related_course_ids) &&
      currentEbook.related_course_ids.includes(c.id)
    ) {
      return true;
    }
    if (worthCat && resolvePrimaryWorthCategory(c.category)?.slug === worthCat.slug) {
      return true;
    }
    return false;
  });

  const rawDescription = String(
    currentEbook.description || currentEbook.short_description || ''
  ).trim();
  const isLongDescription = rawDescription.length > 320;

  const canonicalUrl =
    currentEbook.canonical_url ||
    `https://thesmartworth.site${getEbookSeoPath(currentEbook)}`;
  const seoTitle =
    currentEbook.seo_title || `${currentEbook.title || currentEbook.name} | The Smart Worth`;
  const seoDescription =
    currentEbook.seo_description ||
    currentEbook.short_description ||
    rawDescription ||
    `Read ${currentEbook.title || currentEbook.name} at The Smart Worth.`;
  const ogImageUrl = currentEbook.og_image || currentEbook.cover_image_url || undefined;

  const bookSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: currentEbook.title || currentEbook.name,
    description: seoDescription,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'The Smart Worth'
    }
  };
  if (ogImageUrl) {
    bookSchema.image = [ogImageUrl];
  }
  if (currentEbook.author && String(currentEbook.author).trim()) {
    bookSchema.author = {
      '@type': 'Person',
      name: String(currentEbook.author).trim()
    };
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
        name: 'E-Books',
        item: 'https://thesmartworth.site/ebooks'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: currentEbook.title || currentEbook.name,
        item: canonicalUrl
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={currentEbook.seo_keywords || undefined}
        canonical={canonicalUrl}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogImage={ogImageUrl}
        ogType="book"
        noindex={currentEbook.is_indexed === false}
        structuredData={[bookSchema, breadcrumbSchema]}
      />
      <Navbar />
      <PageHeader
        title={currentEbook.title || currentEbook.name}
        breadcrumb={currentEbook.title || currentEbook.name}
      />

      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-8">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/ebooks"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#615DFA] hover:border-[#615DFA]/40 shadow-2xs transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to All E-Books</span>
          </Link>

          {chapters.length > 0 && (
            <span className="text-xs font-bold text-slate-500">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>
          )}
        </div>

        {/* Main E-Book Card */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0A0E27] via-[#615DFA] to-[#0A0E27]" />

          <div className="p-4 sm:p-7 space-y-6">
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#EEF2FF] border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold">
                  {currentEbook.category || 'Creator Worth'}
                </span>
                {currentEbook.subcategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0A0E27] text-white text-[11px] font-extrabold uppercase tracking-wide">
                    {currentEbook.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-display font-black text-[#0A0E27] tracking-tight leading-snug">
                {currentEbook.title || currentEbook.name}
              </h1>
            </div>

            {/* Info Badges */}
            {(currentEbook.author || chapters.length > 0) && (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {currentEbook.author && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <User size={13} />
                    </span>
                    <span>Author: {currentEbook.author}</span>
                  </div>
                )}

                {chapters.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Box size={13} />
                    </span>
                    <span>{chapters.length} Chapters</span>
                  </div>
                )}
              </div>
            )}

            {/* Overview */}
            {rawDescription && (
              <div className="bg-[#F8FAFF] rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-2.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider">
                  E-Book Overview
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

            {/* Learning Outcomes & Parent Package */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div
                className={cn(
                  'bg-[#F8FAFF] rounded-2xl border border-[#615DFA]/25 p-4 sm:p-6 shadow-2xs space-y-4',
                  currentEbook.cover_image_url ? 'lg:col-span-7' : 'lg:col-span-12'
                )}
              >
                {learningOutcomes.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      What You Will Learn:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {learningOutcomes.map((item, idx) => (
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

                {parentPkg && (
                  <div className="pt-1 space-y-3">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      Included in Package:
                    </p>
                    <Link
                      to={`/packages/${encodeURIComponent(String(parentPkg.id))}`}
                      state={{ pkg: parentPkg, allCourses: courses }}
                      className="group block w-full sm:w-80 bg-white hover:bg-[#EEF2FF]/40 border border-slate-200/90 hover:border-[#615DFA] rounded-2xl p-2.5 sm:p-3 transition-all shadow-2xs"
                    >
                      <div className="mt-1 px-1 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-display font-extrabold text-[#0A0E27] group-hover:text-[#615DFA] transition-colors leading-snug truncate">
                          {parentPkg.name}
                        </span>
                        <span className="text-[11px] font-bold text-[#615DFA] shrink-0">
                          View Package →
                        </span>
                      </div>
                    </Link>

                    <div className="pt-1 sm:max-w-[240px]">
                      <BrutalistButton
                        to={`/packages/${encodeURIComponent(String(parentPkg.id))}`}
                        state={{ pkg: parentPkg, allCourses: courses }}
                        variant="primary"
                        size="sm"
                        className="py-3 px-6 text-xs sm:text-sm"
                        fullWidth
                      >
                        {parentPkg.button_text || `Unlock with ${parentPkg.name}`}
                      </BrutalistButton>
                    </div>
                  </div>
                )}
              </div>

              {currentEbook.cover_image_url && (
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                    <CleanPackageImage
                      src={currentEbook.cover_image_url}
                      mode="banner"
                      alt={currentEbook.title || currentEbook.name}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Chapters / Topics List */}
        {chapters.length > 0 && (
          <section className="space-y-4">
            <div className="text-center max-w-xl mx-auto">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EEF2FF] border border-[#615DFA]/20 text-[#615DFA] text-xs font-bold shadow-2xs mb-2">
                <span>Inside This E-Book</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#0A0E27] tracking-tight">
                Chapters & <span className="text-[#615DFA]">Topics</span>
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 space-y-2.5 shadow-2xs">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id || idx}
                  className="bg-[#F8FAFF] border border-slate-200/80 rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#615DFA] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0A0E27]">
                      {ch.title || ch.label || `Chapter ${idx + 1}`}
                    </h3>
                    {ch.summary && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {ch.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider">
              Related Courses in {currentEbook.category || 'This Category'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedCourses.slice(0, 4).map((course) => (
                <Link
                  key={course.id}
                  to={getCourseSeoPath(course)}
                  state={{ course }}
                  className="bg-white hover:bg-[#EEF2FF]/40 border border-slate-200/90 hover:border-[#615DFA] rounded-xl p-3.5 flex items-center justify-between transition-all shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0A0E27] truncate">
                    {course.title}
                  </span>
                  <span className="text-xs font-bold text-[#615DFA] shrink-0">
                    View Course →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
