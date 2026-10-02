import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Star,
  Award,
  Clock,
  Box,
  Check,
  Plus,
  Minus,
  Play,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Package as PackageIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import CleanPackageImage from '../components/CleanPackageImage';
import SEO from '../components/SEO';
import CustomCheckoutModal from '../components/CustomCheckoutModal';
import { fetchApi } from '../lib/api';
import { cn } from '../lib/utils';
import { useAuth } from '../App';
import {
  getIncludedCourses,
  getIncludedEbooks,
  getCourseModules,
  getCourseModuleCount,
  formatPackagePrice,
  getCachedPackages,
  setCachedPackages,
  getCachedCourses,
  setCachedCourses,
  getCachedEbooks,
  setCachedEbooks,
  formatSlugToTitle,
  findPackageByIdOrSlug,
  getPackageSlug,
  getCourseSeoPath,
  getEbookSeoPath,
  resolvePrimaryWorthCategory
} from '../lib/packageUtils';

export default function PackageDetails() {
  const { packageId } = useParams<{ packageId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pathSegment = location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
  const effectiveLookupKey = packageId || pathSegment;

  const passedPkg = (location.state as any)?.pkg || null;
  const passedCourses = (location.state as any)?.allCourses || null;

  const [packages, setPackages] = useState<any[]>(() => {
    const cached = getCachedPackages();
    if (passedPkg && !cached.some((p) => String(p.id) === String(passedPkg.id))) {
      return [passedPkg, ...cached];
    }
    return cached;
  });

  const [allCourses, setAllCourses] = useState<any[]>(() => {
    if (Array.isArray(passedCourses) && passedCourses.length > 0) return passedCourses;
    return getCachedCourses();
  });

  const [allEbooks, setAllEbooks] = useState<any[]>(() => getCachedEbooks());

  const matchedWorthCategory = resolvePrimaryWorthCategory(effectiveLookupKey);

  const currentPkg =
    findPackageByIdOrSlug(packages, effectiveLookupKey) ||
    (matchedWorthCategory
      ? packages.find((p) => {
          const pCat = resolvePrimaryWorthCategory(p.category || p.name);
          return pCat && pCat.slug === matchedWorthCategory.slug;
        })
      : null) ||
    (passedPkg && findPackageByIdOrSlug([passedPkg], effectiveLookupKey) ? passedPkg : null);

  const [loading, setLoading] = useState<boolean>(() => !currentPkg && packages.length === 0);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<{
    id: string;
    amount: number;
    packageId: string;
    packageName: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!currentPkg && packages.length === 0) {
        setLoading(true);
      }
      try {
        const [packagesRes, coursesRes, ebooksRes] = await Promise.all([
          fetchApi('/packages'),
          fetchApi('/courses'),
          fetchApi('/ebooks').catch(() => null)
        ]);

        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          const fetchedPackages = Array.isArray(packagesData)
            ? packagesData
            : packagesData?.packages || packagesData?.data || packagesData?.raw || [];
          setCachedPackages(fetchedPackages);
          if (isMounted) setPackages(fetchedPackages);
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const fetchedCourses = Array.isArray(coursesData)
            ? coursesData
            : coursesData?.courses || coursesData?.data || coursesData?.raw || [];
          setCachedCourses(fetchedCourses);
          if (isMounted) setAllCourses(fetchedCourses);
        }

        if (ebooksRes && ebooksRes.ok) {
          const ebooksData = await ebooksRes.json();
          const fetchedEbooks = Array.isArray(ebooksData)
            ? ebooksData
            : ebooksData?.ebooks || ebooksData?.data || ebooksData?.raw || [];
          setCachedEbooks(fetchedEbooks);
          if (isMounted) setAllEbooks(fetchedEbooks);
        }
      } catch (err) {
        console.error('Error loading package details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [effectiveLookupKey]);

  const includedCourses = currentPkg ? getIncludedCourses(currentPkg, allCourses) : [];
  const includedEbooks = currentPkg ? getIncludedEbooks(currentPkg, allEbooks) : [];

  useEffect(() => {
    setOpenCourseId(null);
    setIsDescExpanded(false);
  }, [effectiveLookupKey]);

  const totalModules = includedCourses.reduce(
    (sum, c) => sum + getCourseModuleCount(c),
    0
  );
  const durationText = String(currentPkg?.duration_text || '').trim();
  const ratingVal = Number(currentPkg?.rating || 0);
  const certificateText = String(currentPkg?.certificate_text || '').trim();

  const toggleCourse = (courseId: string) => {
    setOpenCourseId((prev) => (prev === courseId ? null : courseId));
  };

  const jumpToCourseModules = (courseId: string) => {
    setOpenCourseId(String(courseId));
    const el = document.getElementById(`course-accordion-${courseId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePayment = async (targetPkgId: string | number) => {
    if (!user) {
      navigate(`/register?packageId=${targetPkgId}`);
      return;
    }

    setEnrolling(String(targetPkgId));
    try {
      const selectedPkg =
        packages.find((p) => String(p.id) === String(targetPkgId)) || currentPkg;
      const pkgAmount = Number(selectedPkg?.offer_price || selectedPkg?.price || 0);

      const response = await fetchApi('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({
          package_id: targetPkgId,
          amount: pkgAmount,
          user_id: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await response.json();

      setActiveOrder({
        id: orderData.id,
        amount: pkgAmount || Math.round((orderData.amount || 0) / 100),
        packageId: String(targetPkgId),
        packageName: selectedPkg?.name || ''
      });
    } catch (err: any) {
      console.error('Payment Error:', err);
    } finally {
      setEnrolling(null);
    }
  };

  const handlePaymentSuccess = async (paymentResponse: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const pkgId = activeOrder?.packageId;
    setActiveOrder(null);
    try {
      await fetchApi('/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          order_id: paymentResponse.razorpay_order_id,
          payment_id: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          package_id: pkgId,
          user_id: user?.id
        })
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
    navigate('/dashboard/packages?payment=success');
  };

  const headerTitle =
    currentPkg?.name ||
    matchedWorthCategory?.name ||
    formatSlugToTitle(effectiveLookupKey, 'Our Packages');

  if (loading && !currentPkg) {
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

  if (!currentPkg && matchedWorthCategory) {
    const categoryCanonical = `https://thesmartworth.site/${matchedWorthCategory.slug}/`;
    const categoryCourses = allCourses.filter(
      (c) => resolvePrimaryWorthCategory(c.category)?.slug === matchedWorthCategory.slug
    );
    const categoryEbooks = allEbooks.filter(
      (eb) =>
        eb.is_active !== false &&
        eb.status !== 'draft' &&
        resolvePrimaryWorthCategory(eb.category)?.slug === matchedWorthCategory.slug
    );
    const activePkgs = packages.filter((p) => p.is_active !== false);

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${matchedWorthCategory.name} — ${matchedWorthCategory.focus} | The Smart Worth`,
      description: matchedWorthCategory.description,
      url: categoryCanonical
    };
    const catBreadcrumbSchema = {
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
          name: matchedWorthCategory.name,
          item: categoryCanonical
        }
      ]
    };

    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <SEO
          title={`${matchedWorthCategory.name} — ${matchedWorthCategory.focus} | The Smart Worth`}
          description={matchedWorthCategory.description}
          canonical={categoryCanonical}
          ogTitle={`${matchedWorthCategory.name} | The Smart Worth`}
          ogDescription={matchedWorthCategory.description}
          structuredData={[collectionSchema, catBreadcrumbSchema]}
        />
        <Navbar />
        <PageHeader
          title={matchedWorthCategory.name}
          breadcrumb={matchedWorthCategory.name}
        />

        <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#EEF2FF] border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold">
              <span>{matchedWorthCategory.focus}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#0A0E27] tracking-tight">
              {matchedWorthCategory.name} — <span className="text-[#615DFA]">{matchedWorthCategory.tagline}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {matchedWorthCategory.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {matchedWorthCategory.subcategories.map((sub) => (
                <span
                  key={sub}
                  className="px-3 py-1 rounded-lg bg-[#F8FAFF] border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {categoryCourses.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-display font-black text-[#0A0E27]">
                {matchedWorthCategory.name} Courses ({categoryCourses.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {categoryCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={getCourseSeoPath(course)}
                    state={{ course }}
                    className="bg-white hover:bg-[#EEF2FF]/40 border border-slate-200/90 hover:border-[#615DFA] rounded-xl p-4 flex items-center justify-between transition-all shadow-2xs"
                  >
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0A0E27]">{course.title}</h3>
                      {course.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{course.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#615DFA] shrink-0 ml-3">View →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {categoryEbooks.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-display font-black text-[#0A0E27]">
                {matchedWorthCategory.name} E-Books ({categoryEbooks.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {categoryEbooks.map((ebook) => (
                  <Link
                    key={ebook.id}
                    to={getEbookSeoPath(ebook)}
                    state={{ ebook }}
                    className="bg-white hover:bg-[#EEF2FF]/40 border border-slate-200/90 hover:border-[#615DFA] rounded-xl p-4 flex items-center justify-between transition-all shadow-2xs"
                  >
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0A0E27]">{ebook.title || ebook.name}</h3>
                      {(ebook.short_description || ebook.description) && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {ebook.short_description || ebook.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#615DFA] shrink-0 ml-3">Read →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {activePkgs.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-display font-black text-[#0A0E27]">
                Available Learning Packages
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activePkgs.map((pkg) => (
                  <Link
                    key={pkg.id}
                    to={`/packages/${encodeURIComponent(String(pkg.id))}`}
                    state={{ pkg, allCourses }}
                    className="bg-white hover:border-[#615DFA] border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs transition-all"
                  >
                    <div>
                      <h3 className="text-base font-extrabold text-[#0A0E27]">{pkg.name}</h3>
                      <p className="text-sm font-black text-[#615DFA] mt-1">
                        {formatPackagePrice(pkg.offer_price || pkg.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#615DFA]">Explore Package →</span>
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

  if (!currentPkg) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Navbar />
        <PageHeader title={headerTitle} breadcrumb={headerTitle} />
        <div className="max-w-2xl w-full mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
            <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Package Not Found</h1>
            <p className="text-slate-500 text-xs mb-6">
              The package you are looking for doesn't exist or may have been moved.
            </p>
            <div className="max-w-xs mx-auto">
              <BrutalistButton to="/packages" variant="primary" size="md" fullWidth>
                Explore All Packages
              </BrutalistButton>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const offerPrice = Number(currentPkg.offer_price || currentPkg.price || 0);
  const originalPrice = Number(
    currentPkg.original_price || currentPkg.originalPrice || 0
  );
  const discountPercent =
    originalPrice > offerPrice && originalPrice > 0
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : 0;

  // 100% Admin-Controlled Package Includes (features)
  const packageIncludesList: string[] = Array.isArray(currentPkg.features)
    ? currentPkg.features.map((s: any) => String(s).trim()).filter(Boolean)
    : typeof currentPkg.features === 'string' && currentPkg.features.trim()
      ? currentPkg.features
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  // 100% Admin-Controlled Perfect For list
  const perfectForList: string[] = Array.isArray(currentPkg.perfect_for)
    ? currentPkg.perfect_for.map((s: any) => String(s).trim()).filter(Boolean)
    : typeof currentPkg.perfect_for === 'string' && currentPkg.perfect_for.trim()
      ? currentPkg.perfect_for
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const insideThumbnailUrl =
    currentPkg.detail_thumbnail_url ||
    currentPkg.banner_url ||
    currentPkg.inner_thumbnail_url ||
    currentPkg.thumbnail_url ||
    '';

  const hasInfoBadges =
    ratingVal > 0 || Boolean(certificateText) || Boolean(durationText) || totalModules > 0;

  const rawDescription = String(currentPkg.description || '').trim();
  const isLongDescription = rawDescription.length > 320;

  const pkgSlug = getPackageSlug(currentPkg);
  const canonicalUrl =
    currentPkg.canonical_url ||
    (pkgSlug
      ? `https://thesmartworth.site/${pkgSlug}/`
      : `https://thesmartworth.site/packages/${encodeURIComponent(String(currentPkg.id))}`);
  const seoTitle = currentPkg.seo_title || `${currentPkg.name} | The Smart Worth`;
  const seoDescription =
    currentPkg.seo_description ||
    currentPkg.short_description ||
    rawDescription ||
    `Explore ${currentPkg.name} at The Smart Worth.`;
  const ogImageUrl =
    currentPkg.og_image || currentPkg.thumbnail_url || insideThumbnailUrl || undefined;

  const productImages = [currentPkg.thumbnail_url, insideThumbnailUrl]
    .map((u) => String(u || '').trim())
    .filter(Boolean);

  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: currentPkg.name,
    description: seoDescription,
    brand: {
      '@type': 'Brand',
      name: 'The Smart Worth'
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: String(offerPrice),
      availability:
        currentPkg.is_active === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'
    }
  };
  if (productImages.length > 0) {
    productSchema.image = productImages;
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
        name: 'Packages',
        item: 'https://thesmartworth.site/packages'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: currentPkg.name,
        item: canonicalUrl
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={currentPkg.seo_keywords || undefined}
        canonical={canonicalUrl}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogImage={ogImageUrl}
        ogType="product"
        noindex={currentPkg.is_indexed === false}
        structuredData={[productSchema, breadcrumbSchema]}
      />
      <Navbar />
      <PageHeader title={currentPkg.name} breadcrumb={currentPkg.name} />

      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-8">
        {/* Top Back Link for Easy Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#615DFA] hover:border-[#615DFA]/40 shadow-2xs transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to All Packages</span>
          </Link>

          {includedCourses.length > 0 && (
            <span className="text-xs font-bold text-slate-500">
              {includedCourses.length} {includedCourses.length === 1 ? 'Course' : 'Courses'} • {totalModules} Modules
            </span>
          )}
        </div>

        {/* TOP MAIN CLASSIC PACKAGE CARD */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Top Classic Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0A0E27] via-[#615DFA] to-[#0A0E27]" />

          <div className="p-4 sm:p-7 space-y-6">
            {/* Header Row: Badges + Package Title + Price Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#EEF2FF] border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold">
                    {currentPkg.name}
                  </span>
                  {currentPkg.badge_text && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0A0E27] text-white text-[11px] font-extrabold tracking-wide uppercase">
                      {currentPkg.badge_text}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-display font-black text-[#0A0E27] tracking-tight leading-snug">
                  {currentPkg.name}
                </h1>
              </div>

              <div className="flex items-baseline gap-2 sm:flex-col sm:items-end shrink-0 bg-[#F8FAFF] sm:bg-transparent px-3.5 py-2 sm:p-0 rounded-xl border border-slate-200/70 sm:border-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Offer Price
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#615DFA] tabular-nums">
                    ₹{offerPrice.toLocaleString('en-IN')}
                  </span>
                  {originalPrice > offerPrice && (
                    <span className="text-xs text-slate-400 line-through font-semibold tabular-nums">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Classic Info Badges Strip (Placed near top so users see key stats immediately) */}
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

                {totalModules > 0 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200/90 text-xs font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#615DFA] flex items-center justify-center shrink-0">
                      <Box size={13} />
                    </span>
                    <span>Modules {totalModules}</span>
                  </div>
                )}
              </div>
            )}

            {/* Classic Package Description Box (With Clean Read More / Less for Long Text) */}
            {rawDescription && (
              <div className="bg-[#F8FAFF] rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-2.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider">
                  Package Overview
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

            {/* Classic Structured Courses Included Cards */}
            {includedCourses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={15} className="text-[#615DFA]" />
                    <span>Courses Included ({includedCourses.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {includedCourses.map((course, idx) => {
                    const cModules = getCourseModuleCount(course);
                    const num = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={course.id}
                        onClick={() => jumpToCourseModules(String(course.id))}
                        className="group bg-[#F8FAFF] hover:bg-[#EEF2FF]/50 border border-slate-200/90 hover:border-[#615DFA]/40 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-[#615DFA] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                {num}
                              </span>
                              <h3 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] group-hover:text-[#615DFA] transition-colors truncate">
                                {course.title}
                              </h3>
                            </div>
                            {cModules > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-[#615DFA] shrink-0">
                                {cModules} Modules
                              </span>
                            )}
                          </div>

                          {course.description && (
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-[#615DFA]">
                          <span>See Course Modules ↓</span>
                          <Link
                            to={getCourseSeoPath(course)}
                            state={{ course }}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline text-slate-600 hover:text-[#615DFA]"
                          >
                            Course Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Classic Structured E-Books Included Cards */}
            {includedEbooks.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={15} className="text-[#615DFA]" />
                    <span>E-Books Included ({includedEbooks.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {includedEbooks.map((ebook, idx) => {
                    const num = String(idx + 1).padStart(2, '0');
                    const chapterCount = Array.isArray(ebook.chapters) ? ebook.chapters.length : 0;
                    return (
                      <Link
                        key={ebook.id}
                        to={getEbookSeoPath(ebook)}
                        state={{ ebook }}
                        className="group bg-[#F8FAFF] hover:bg-[#EEF2FF]/50 border border-slate-200/90 hover:border-[#615DFA]/40 rounded-xl p-3.5 sm:p-4 transition-all flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-[#0A0E27] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                {num}
                              </span>
                              <h3 className="text-xs sm:text-sm font-extrabold text-[#0A0E27] group-hover:text-[#615DFA] transition-colors truncate">
                                {ebook.title || ebook.name}
                              </h3>
                            </div>
                            {chapterCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-[#615DFA] shrink-0">
                                {chapterCount} Chapters
                              </span>
                            )}
                          </div>

                          {(ebook.short_description || ebook.description) && (
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {ebook.short_description || ebook.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-[#615DFA]">
                          <span>Read E-Book Overview</span>
                          <span>→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Classic Package Price, Benefits & 16:9 Banner Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">
              {/* Package Price & Includes Box */}
              <div
                className={cn(
                  'bg-[#F8FAFF] rounded-2xl border border-[#615DFA]/25 p-4 sm:p-6 shadow-2xs space-y-4',
                  insideThumbnailUrl ? 'lg:col-span-7' : 'lg:col-span-12'
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Package Price
                    </p>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <p className="text-2xl sm:text-3xl font-black text-[#615DFA] tabular-nums">
                        {formatPackagePrice(offerPrice)}
                      </p>
                      {originalPrice > offerPrice && (
                        <p className="text-xs sm:text-sm text-slate-400 line-through font-semibold tabular-nums">
                          MRP: {formatPackagePrice(originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Package Includes Checklist */}
                {packageIncludesList.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      Package Includes:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {packageIncludesList.map((item, idx) => (
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

                {/* Perfect For Checklist */}
                {perfectForList.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-extrabold text-[#0A0E27] uppercase tracking-wider">
                      Perfect For:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perfectForList.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium bg-white px-3 py-2 rounded-xl border border-slate-200/70"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#EEF2FF] border border-[#615DFA]/20 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-[#615DFA] stroke-[3]" />
                          </span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Buy Now / Enroll Now Signature BrutalistButton */}
                <div className="pt-2 sm:max-w-[240px]">
                  <BrutalistButton
                    onClick={() => handlePayment(currentPkg.id)}
                    disabled={enrolling === String(currentPkg.id)}
                    loading={enrolling === String(currentPkg.id)}
                    variant="primary"
                    size="sm"
                    className="py-3 px-6 text-xs sm:text-sm"
                    fullWidth
                  >
                    {currentPkg.button_text || 'Buy Now'}
                  </BrutalistButton>
                </div>
              </div>

              {/* Single 16:9 Inside-Package Thumbnail / Banner Card */}
              {insideThumbnailUrl && (
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                    <CleanPackageImage
                      src={insideThumbnailUrl}
                      fallbackSrc={currentPkg.thumbnail_url || ''}
                      mode="banner"
                      alt={`${currentPkg.name} Thumbnail`}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                  <div className="pt-2.5 px-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0A0E27] truncate">
                      {currentPkg.name}
                    </span>
                    <span className="text-[11px] font-bold text-[#615DFA]">
                      Official Package
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CLASSIC COMPLETE COURSE MODULES ACCORDION SECTION */}
        {includedCourses.length > 0 && (
          <section className="space-y-5">
            <div className="text-center max-w-xl mx-auto">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EEF2FF] border border-[#615DFA]/20 text-[#615DFA] text-xs font-bold shadow-2xs mb-2.5">
                <span>{currentPkg.name} Curriculum</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-display font-black text-[#0A0E27] tracking-tight mb-1.5">
                Complete Course <span className="text-[#615DFA]">Modules</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Tap on the <span className="font-bold text-[#615DFA]">+</span> button on any course below to view all lessons inside.
              </p>
            </div>

            {/* Classic Easy-to-Use Course Accordion List */}
            <div className="space-y-3.5">
              {includedCourses.map((course, courseIdx) => {
                const modules = getCourseModules(course);
                const isOpen = openCourseId === String(course.id);
                const numLabel = String(courseIdx + 1).padStart(2, '0');

                return (
                  <div
                    key={course.id}
                    id={`course-accordion-${course.id}`}
                    className={cn(
                      'rounded-2xl overflow-hidden border transition-all duration-200 bg-white',
                      isOpen
                        ? 'border-[#615DFA] shadow-[0_8px_24px_rgba(97,93,250,0.12)]'
                        : 'border-slate-200/90 hover:border-[#615DFA]/50 shadow-2xs'
                    )}
                  >
                    {/* Classic Accordion Header Bar */}
                    <button
                      type="button"
                      onClick={() => toggleCourse(String(course.id))}
                      className={cn(
                        'w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                        isOpen
                          ? 'bg-[#615DFA] text-white'
                          : 'bg-white hover:bg-[#F8FAFF] text-[#0A0E27]'
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={cn(
                            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center shrink-0 transition-colors',
                            isOpen
                              ? 'bg-white text-[#615DFA] shadow-2xs'
                              : 'bg-[#EEF2FF] text-[#615DFA] border border-[#615DFA]/20'
                          )}
                        >
                          {numLabel}
                        </span>

                        <div className="min-w-0">
                          <span
                            className={cn(
                              'block text-sm sm:text-base font-extrabold leading-snug truncate',
                              isOpen ? 'text-white' : 'text-[#0A0E27]'
                            )}
                          >
                            {course.title}
                          </span>
                          <span
                            className={cn(
                              'block text-[11px] font-semibold mt-0.5',
                              isOpen ? 'text-white/85' : 'text-slate-500'
                            )}
                          >
                            {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} •{' '}
                            {isOpen ? 'Tap − to hide' : 'Tap + to view modules'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                          isOpen
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-[#615DFA] text-white shadow-2xs'
                        )}
                      >
                        {isOpen ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
                      </span>
                    </button>

                    {/* Expanded Module Rows */}
                    {isOpen && (
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
                                  <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                                    {mod.label}
                                  </span>
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
                          <p className="text-xs text-slate-400 text-center py-3 font-medium">
                            No modules added for this course yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {activeOrder && (
        <CustomCheckoutModal
          isOpen={!!activeOrder}
          onClose={() => setActiveOrder(null)}
          orderId={activeOrder.id}
          amount={activeOrder.amount}
          originalPrice={originalPrice > activeOrder.amount ? originalPrice : undefined}
          packageName={activeOrder.packageName}
          customerName={user?.user_metadata?.full_name || user?.full_name || ''}
          customerEmail={user?.email || ''}
          customerPhone={user?.user_metadata?.mobile || user?.mobile || ''}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

