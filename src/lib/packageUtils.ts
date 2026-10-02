import { fetchApi } from './api';

export interface PrimaryWorthCategory {
  id: string;
  name: string;
  slug: string;
  focus: string;
  tagline: string;
  description: string;
  whoItIsFor: string[];
  subcategories: string[];
}

export const PRIMARY_WORTH_CATEGORIES: PrimaryWorthCategory[] = [
  {
    id: 'creator-worth',
    name: 'Creator Worth',
    slug: 'creator-worth',
    focus: 'Content & Creator',
    tagline: 'Content Creation & Creator Economy Skills',
    description:
      'Master modern content creation, video production, personal branding, audience growth, and digital product monetization in the creator economy.',
    whoItIsFor: [
      'Aspiring & active content creators on YouTube and Instagram',
      'Video editors, thumbnail designers, and script writers',
      'Freelancers building a personal brand and digital products'
    ],
    subcategories: [
      'Content Creation',
      'YouTube',
      'Instagram',
      'Short-form Video',
      'Video Editing',
      'Graphic Design',
      'Personal Branding',
      'Social Media',
      'Creator AI Tools',
      'Script Writing',
      'Thumbnail Design',
      'Audience Growth',
      'Digital Products'
    ]
  },
  {
    id: 'business-worth',
    name: 'Business Worth',
    slug: 'business-worth',
    focus: 'Business & Finance',
    tagline: 'Business Fundamentals, Marketing & Financial Literacy',
    description:
      'Build practical business acumen across digital marketing, sales, freelancing, e-commerce, money management, and scalable online services.',
    whoItIsFor: [
      'Entrepreneurs and digital business founders',
      'Marketers, sales professionals, and freelancers',
      'Learners seeking practical financial literacy and money management'
    ],
    subcategories: [
      'Entrepreneurship',
      'Business Fundamentals',
      'Digital Business',
      'Marketing',
      'Sales',
      'Branding',
      'Freelancing',
      'Finance Basics',
      'Money Management',
      'Business Strategy',
      'E-commerce',
      'Online Services',
      'Financial Literacy'
    ]
  },
  {
    id: 'tech-worth',
    name: 'Tech Worth',
    slug: 'tech-worth',
    focus: 'Tech & Development',
    tagline: 'Technology, Software Development & AI Automation',
    description:
      'Learn modern web and app development, programming fundamentals, APIs, databases, cloud architecture, and AI automation workflows.',
    whoItIsFor: [
      'Students and developers learning full-stack web & app development',
      'Professionals adopting AI tools and workflow automation',
      'Builders mastering Python, JavaScript, APIs, and databases'
    ],
    subcategories: [
      'Web Development',
      'HTML/CSS',
      'JavaScript',
      'PHP',
      'Python',
      'App Development',
      'Programming Fundamentals',
      'APIs',
      'Databases',
      'AI',
      'Automation',
      'Cloud',
      'Cybersecurity Fundamentals',
      'Developer Tools'
    ]
  },
  {
    id: 'next-worth',
    name: 'Next Worth',
    slug: 'next-worth',
    focus: 'Next & Life',
    tagline: 'Future Skills, Career Acceleration & Personal Development',
    description:
      'Develop high-leverage professional and life skills including communication, interview readiness, leadership, productivity, and critical thinking.',
    whoItIsFor: [
      'Students and job seekers preparing for interviews and career growth',
      'Working professionals building leadership and communication skills',
      'Lifelong learners upgrading productivity and critical thinking'
    ],
    subcategories: [
      'Productivity',
      'Communication',
      'Career Skills',
      'Interview Skills',
      'Leadership',
      'Time Management',
      'Learning Skills',
      'Critical Thinking',
      'Personal Development',
      'Professional Skills',
      'Future Skills',
      'Digital Literacy'
    ]
  }
];

export const slugifyPackageName = (name?: string | null): string => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatSlugToTitle = (slugOrId?: string | null, fallback = ''): string => {
  if (!slugOrId) return fallback;
  const raw = decodeURIComponent(String(slugOrId)).trim();
  if (!raw || /^[0-9a-f-]{24,}$/i.test(raw)) return fallback;
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export const formatPackagePrice = (price: number | string | null | undefined): string => {
  const num = Number(price || 0);
  if (!Number.isFinite(num) || num <= 0) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

export const getPackageSlug = (pkg?: any): string => {
  if (!pkg) return '';
  const explicitSlug = slugifyPackageName(pkg.slug);
  if (explicitSlug) return explicitSlug;
  const fromName = slugifyPackageName(pkg.name);
  if (fromName) return fromName;
  return slugifyPackageName(pkg.id);
};

export const getPackageSeoPath = (pkg?: any): string => {
  if (!pkg) return '/packages';
  const slug = getPackageSlug(pkg);
  return slug ? `/${slug}/` : `/packages/${encodeURIComponent(String(pkg.id || ''))}`;
};

export const getPackageCanonicalPath = (pkg?: any): string => {
  return getPackageSeoPath(pkg);
};

export const getCourseSlug = (course?: any): string => {
  if (!course) return '';
  const explicitSlug = slugifyPackageName(course.slug);
  if (explicitSlug) return explicitSlug;
  const fromTitle = slugifyPackageName(course.title);
  if (fromTitle) return fromTitle;
  return String(course.id || '');
};

export const getCourseSeoPath = (course?: any): string => {
  if (!course) return '/courses';
  const slug = getCourseSlug(course);
  return slug ? `/courses/${slug}` : `/courses/${encodeURIComponent(String(course.id || ''))}`;
};

export const getEbookSlug = (ebook?: any): string => {
  if (!ebook) return '';
  const explicitSlug = slugifyPackageName(ebook.slug);
  if (explicitSlug) return explicitSlug;
  const fromName = slugifyPackageName(ebook.name || ebook.title);
  if (fromName) return fromName;
  return String(ebook.id || '');
};

export const getEbookSeoPath = (ebook?: any): string => {
  if (!ebook) return '/ebooks';
  const slug = getEbookSlug(ebook);
  return slug ? `/ebooks/${slug}` : `/ebooks/${encodeURIComponent(String(ebook.id || ''))}`;
};

export const resolvePrimaryWorthCategory = (categoryOrName?: string | null): PrimaryWorthCategory | null => {
  if (!categoryOrName) return null;
  const s = slugifyPackageName(categoryOrName);
  const direct = PRIMARY_WORTH_CATEGORIES.find(
    (c) => c.slug === s || slugifyPackageName(c.name) === s || slugifyPackageName(c.focus) === s
  );
  if (direct) return direct;

  if (s.includes('creator') || s.includes('content') || s.includes('youtube') || s.includes('video')) {
    return PRIMARY_WORTH_CATEGORIES[0];
  }
  if (
    s.includes('business') ||
    s.includes('finance') ||
    s.includes('marketing') ||
    s.includes('sales') ||
    s.includes('freelanc')
  ) {
    return PRIMARY_WORTH_CATEGORIES[1];
  }
  if (
    s.includes('tech') ||
    s.includes('dev') ||
    s.includes('code') ||
    s.includes('program') ||
    s.includes('ai') ||
    s.includes('pro-worth')
  ) {
    return PRIMARY_WORTH_CATEGORIES[2];
  }
  if (
    s.includes('next') ||
    s.includes('success') ||
    s.includes('career') ||
    s.includes('communication') ||
    s.includes('productivity') ||
    s.includes('life')
  ) {
    return PRIMARY_WORTH_CATEGORIES[3];
  }
  return null;
};

export const getCoursePublicPath = (course?: any): string => {
  return getCourseSeoPath(course);
};

export const getEbookPublicPath = (ebook?: any): string => {
  return getEbookSeoPath(ebook);
};

export const parseCourseIds = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((id) => String(id || '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((id) => String(id || '').trim()).filter(Boolean);
        }
      } catch {}
    }
    return trimmed
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
};

export const getIncludedCourses = (pkg: any, allCourses: any[]): any[] => {
  if (!pkg || !Array.isArray(allCourses) || allCourses.length === 0) return [];
  const explicitIds = parseCourseIds(pkg.course_ids || pkg.courses);
  if (explicitIds.length > 0) {
    const idSet = new Set(explicitIds.map((id) => String(id).trim().toLowerCase()));
    const matched = allCourses.filter(
      (c) =>
        idSet.has(String(c.id || '').trim().toLowerCase()) ||
        idSet.has(String(c.title || '').trim().toLowerCase()) ||
        idSet.has(getCourseSlug(c))
    );
    if (matched.length > 0) return matched;
  }

  // Fallback by package_id or matching Worth category if course_ids wasn't explicitly populated
  const pkgCat = resolvePrimaryWorthCategory(pkg.category || pkg.name);
  return allCourses.filter((c) => {
    if (c.package_id && String(c.package_id) === String(pkg.id)) return true;
    if (pkgCat) {
      const courseCat = resolvePrimaryWorthCategory(c.category);
      if (courseCat && courseCat.slug === pkgCat.slug) return true;
    }
    return false;
  });
};

export const getIncludedEbooks = (pkg: any, allEbooks: any[]): any[] => {
  if (!pkg || !Array.isArray(allEbooks) || allEbooks.length === 0) return [];
  const activeEbooks = allEbooks.filter((eb) => eb.is_active !== false && eb.status !== 'draft');
  const explicitIds = parseCourseIds(pkg.ebook_ids || pkg.ebooks);
  if (explicitIds.length > 0) {
    const idSet = new Set(explicitIds.map((id) => String(id).trim().toLowerCase()));
    const matched = activeEbooks.filter(
      (eb) =>
        idSet.has(String(eb.id || '').trim().toLowerCase()) ||
        idSet.has(getEbookSlug(eb))
    );
    if (matched.length > 0) return matched;
  }

  const pkgCat = resolvePrimaryWorthCategory(pkg.category || pkg.name);
  return activeEbooks.filter((eb) => {
    if (eb.package_id && String(eb.package_id) === String(pkg.id)) return true;
    if (Array.isArray(eb.related_package_ids) && eb.related_package_ids.includes(pkg.id)) return true;
    if (pkgCat) {
      const ebCat = resolvePrimaryWorthCategory(eb.category);
      if (ebCat && ebCat.slug === pkgCat.slug) return true;
    }
    return false;
  });
};

export const getCourseModules = (course: any): any[] => {
  if (!course) return [];
  let rawList: any[] = [];
  if (Array.isArray(course.lessons) && course.lessons.length > 0) {
    rawList = course.lessons;
  } else if (typeof course.lessons === 'string' && course.lessons.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(course.lessons);
      if (Array.isArray(parsed)) rawList = parsed;
    } catch {}
  } else if (Array.isArray(course.modules) && course.modules.length > 0) {
    rawList = course.modules;
  }

  return rawList.map((mod, idx) => {
    if (typeof mod === 'string') {
      return {
        id: `mod-${idx + 1}`,
        label: mod,
        title: mod,
        duration: ''
      };
    }
    const text = String(mod?.label || mod?.title || mod?.name || `Module ${idx + 1}`).trim();
    return {
      ...mod,
      id: mod?.id || `mod-${idx + 1}`,
      label: text,
      title: text,
      duration: mod?.duration || mod?.features || ''
    };
  });
};

export const getCourseModuleCount = (course: any): number => {
  if (!course) return 0;
  const digit = Number(String(course.digit_lesson || '').replace(/[^0-9]/g, ''));
  if (Number.isFinite(digit) && digit > 0) return digit;
  const modules = getCourseModules(course);
  return modules.length;
};

export const findPackageByIdOrSlug = (packages: any[], idOrSlug?: string | null) => {
  if (!idOrSlug || !Array.isArray(packages) || packages.length === 0) return null;
  const cleanTarget = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  const slugTarget = slugifyPackageName(cleanTarget);

  return (
    packages.find((pkg) => {
      const pkgId = String(pkg.id || '').trim().toLowerCase();
      const pkgName = String(pkg.name || '').trim().toLowerCase();
      const pkgSlug = getPackageSlug(pkg);
      const nameSlug = slugifyPackageName(pkg.name);
      return (
        pkgId === cleanTarget ||
        pkgSlug === slugTarget ||
        nameSlug === slugTarget ||
        pkgName === cleanTarget
      );
    }) || null
  );
};

export const findCourseByIdOrSlug = (courses: any[], idOrSlug?: string | null) => {
  if (!idOrSlug || !Array.isArray(courses) || courses.length === 0) return null;
  const cleanTarget = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  const slugTarget = slugifyPackageName(cleanTarget);

  return (
    courses.find((course) => {
      const cId = String(course.id || '').trim().toLowerCase();
      const cSlug = getCourseSlug(course);
      const titleSlug = slugifyPackageName(course.title);
      return cId === cleanTarget || cSlug === slugTarget || titleSlug === slugTarget;
    }) || null
  );
};

export const findEbookByIdOrSlug = (ebooks: any[], idOrSlug?: string | null) => {
  if (!idOrSlug || !Array.isArray(ebooks) || ebooks.length === 0) return null;
  const cleanTarget = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  const slugTarget = slugifyPackageName(cleanTarget);

  return (
    ebooks.find((eb) => {
      const eId = String(eb.id || '').trim().toLowerCase();
      const eSlug = getEbookSlug(eb);
      const nameSlug = slugifyPackageName(eb.name || eb.title);
      return eId === cleanTarget || eSlug === slugTarget || nameSlug === slugTarget;
    }) || null
  );
};

const PKG_CACHE_KEY = 'tsw_packages_cache_v3';
const COURSES_CACHE_KEY = 'tsw_courses_cache_v3';
const EBOOKS_CACHE_KEY = 'tsw_ebooks_cache_v1';
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

export const getCachedPackages = (): any[] => {
  try {
    const raw = localStorage.getItem(PKG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.data) && Date.now() - (parsed?.ts || 0) < CACHE_MAX_AGE_MS) {
      return parsed.data;
    }
  } catch {}
  return [];
};

export const setCachedPackages = (packages: any[]) => {
  try {
    if (Array.isArray(packages)) {
      localStorage.setItem(PKG_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: packages }));
    }
  } catch {}
};

export const getCachedCourses = (): any[] => {
  try {
    const raw = localStorage.getItem(COURSES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.data) && Date.now() - (parsed?.ts || 0) < CACHE_MAX_AGE_MS) {
      return parsed.data;
    }
  } catch {}
  return [];
};

export const setCachedCourses = (courses: any[]) => {
  try {
    if (Array.isArray(courses)) {
      localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: courses }));
    }
  } catch {}
};

export const getCachedEbooks = (): any[] => {
  try {
    const raw = localStorage.getItem(EBOOKS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.data) && Date.now() - (parsed?.ts || 0) < CACHE_MAX_AGE_MS) {
      return parsed.data;
    }
  } catch {}
  return [];
};

export const setCachedEbooks = (ebooks: any[]) => {
  try {
    if (Array.isArray(ebooks)) {
      localStorage.setItem(EBOOKS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: ebooks }));
    }
  } catch {}
};

let preloadPromise: Promise<void> | null = null;

export const preloadCatalogData = async (): Promise<void> => {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    try {
      const [pkgRes, courseRes, ebookRes] = await Promise.all([
        fetchApi('/packages').catch(() => null),
        fetchApi('/courses').catch(() => null),
        fetchApi('/ebooks').catch(() => null)
      ]);

      if (pkgRes && pkgRes.ok) {
        const pkgData = await pkgRes.json();
        const pkgList = Array.isArray(pkgData)
          ? pkgData
          : pkgData?.packages || pkgData?.data || pkgData?.raw || [];
        setCachedPackages(pkgList);
      }

      if (courseRes && courseRes.ok) {
        const courseData = await courseRes.json();
        const courseList = Array.isArray(courseData)
          ? courseData
          : courseData?.courses || courseData?.data || courseData?.raw || [];
        setCachedCourses(courseList);
      }

      if (ebookRes && ebookRes.ok) {
        const ebookData = await ebookRes.json();
        const ebookList = Array.isArray(ebookData)
          ? ebookData
          : ebookData?.ebooks || ebookData?.data || ebookData?.raw || [];
        setCachedEbooks(ebookList);
      }
    } catch {
      // Ignore background preload errors
    } finally {
      preloadPromise = null;
    }
  })();
  return preloadPromise;
};

export const getPackageDisplayPrice = (pkg: any): number => {
  if (!pkg) return 0;
  return Number(pkg.offer_price || pkg.price || 0);
};

export const isPackageUnlocked = (
  targetPkg: any,
  userPackageIdOrSlug: string | null | undefined,
  allPackages: any[]
): boolean => {
  if (!targetPkg || !userPackageIdOrSlug) return false;
  const userPkg = findPackageByIdOrSlug(allPackages, userPackageIdOrSlug);
  if (!userPkg) {
    return (
      String(targetPkg.id).toLowerCase() === String(userPackageIdOrSlug).toLowerCase() ||
      slugifyPackageName(targetPkg.name) === slugifyPackageName(userPackageIdOrSlug)
    );
  }
  if (String(targetPkg.id) === String(userPkg.id)) return true;
  const userPrice = getPackageDisplayPrice(userPkg);
  const targetPrice = getPackageDisplayPrice(targetPkg);
  return userPrice > 0 && targetPrice > 0 && userPrice >= targetPrice;
};
