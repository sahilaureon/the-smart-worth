import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'book';
  noIndex?: boolean;
  noindex?: boolean;
  schema?: Record<string, any> | Record<string, any>[];
  structuredData?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'The Smart Worth | Learn. Build. Grow.';
const DEFAULT_DESCRIPTION =
  'The Smart Worth is an online learning platform for Creator Worth, Business Worth, Tech Worth, and Next Worth skills, courses, and e-books.';
const DEFAULT_KEYWORDS =
  'The Smart Worth, Creator Worth, Business Worth, Tech Worth, Next Worth, online courses, digital skills, e-books';
const SITE_URL = 'https://thesmartworth.site';
const DEFAULT_IMAGE = 'https://i.postimg.cc/zBYXxpq0/Picsart-26-03-18-16-54-04-376.png';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noIndex = false,
  noindex = false,
  schema,
  structuredData
}) => {
  const fullTitle = title
    ? title.includes('The Smart Worth')
      ? title
      : `${title} | The Smart Worth`
    : DEFAULT_TITLE;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const resolvedCanonical = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${SITE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`
    : `${SITE_URL}${currentPath}`;

  const finalOgTitle = ogTitle || fullTitle;
  const finalOgDescription = ogDescription || description;
  const finalOgImage = ogImage || DEFAULT_IMAGE;
  const shouldNoIndex = Boolean(noIndex || noindex);

  const rawSchemas = structuredData || schema;
  const schemaList = Array.isArray(rawSchemas)
    ? rawSchemas.filter(Boolean)
    : rawSchemas
      ? [rawSchemas]
      : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={resolvedCanonical} />

      {/* Robots Control */}
      {shouldNoIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content="The Smart Worth" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={finalOgImage} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedCanonical} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Structured Data (JSON-LD) */}
      {schemaList.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
