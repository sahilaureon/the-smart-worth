import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, Box } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import BrutalistButton from '../components/BrutalistButton';
import { fetchApi } from '../lib/api';
import {
  getCachedEbooks,
  setCachedEbooks,
  getEbookSeoPath,
  PRIMARY_WORTH_CATEGORIES
} from '../lib/packageUtils';

export default function Ebooks() {
  const [ebooks, setEbooks] = useState<any[]>(() =>
    getCachedEbooks().filter((eb: any) => eb.is_active !== false && eb.status !== 'draft')
  );
  const [loading, setLoading] = useState<boolean>(() => ebooks.length === 0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const fetchAllEbooks = async () => {
      if (ebooks.length === 0) setLoading(true);
      try {
        const res = await fetchApi('/ebooks');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : data?.ebooks || data?.data || data?.raw || [];
          setCachedEbooks(list);
          setEbooks(list.filter((eb: any) => eb.is_active !== false && eb.status !== 'draft'));
        }
      } catch {
        // Keep cached state on transient error
      } finally {
        setLoading(false);
      }
    };

    fetchAllEbooks();
  }, []);

  const filteredEbooks =
    selectedCategory === 'All'
      ? ebooks
      : ebooks.filter(
          (eb) =>
            String(eb.category || '').toLowerCase() === selectedCategory.toLowerCase()
        );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredEbooks.map((ebook, i) => {
      const bookItem: Record<string, any> = {
        '@type': 'Book',
        name: ebook.title || ebook.name,
        description:
          ebook.seo_description ||
          ebook.short_description ||
          ebook.description ||
          `Read ${ebook.title || ebook.name} at The Smart Worth.`,
        url: `https://thesmartworth.site${getEbookSeoPath(ebook)}`,
        publisher: {
          '@type': 'Organization',
          name: 'The Smart Worth'
        }
      };
      if (ebook.author) {
        bookItem.author = {
          '@type': 'Person',
          name: ebook.author
        };
      }
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: bookItem
      };
    })
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title="E-Books | The Smart Worth - Digital Learning Resources"
        description="Explore practical E-books and digital guides across Creator Worth, Business Worth, Tech Worth, and Next Worth at The Smart Worth."
        canonical="https://thesmartworth.site/ebooks"
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader
        title="Our E-Books"
        subtitle="Practical step-by-step E-books and learning guides included with The Smart Worth packages"
      />

      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 space-y-6">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#615DFA] text-white border-[#615DFA]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#615DFA]/40'
            }`}
          >
            All Worth Categories
          </button>
          {PRIMARY_WORTH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-[#615DFA] text-white border-[#615DFA]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#615DFA]/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#615DFA] animate-spin" />
          </div>
        ) : filteredEbooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEbooks.map((ebook, i) => {
              const ebookUrl = getEbookSeoPath(ebook);
              const chapterCount = Array.isArray(ebook.chapters) ? ebook.chapters.length : 0;
              return (
                <div
                  key={ebook.id || i}
                  className="bg-white rounded-2xl border border-[#615DFA]/40 hover:border-[#615DFA] shadow-[0_6px_20px_rgba(97,93,250,0.06)] hover:shadow-[0_12px_28px_rgba(97,93,250,0.14)] transition-all duration-300 p-3 sm:p-4 flex flex-col items-center text-center group"
                >
                  {ebook.cover_image_url && (
                    <Link
                      to={ebookUrl}
                      state={{ ebook }}
                      className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200/80 bg-white mb-3 relative block shadow-2xs"
                    >
                      <img
                        src={ebook.cover_image_url}
                        alt={ebook.title || ebook.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#615DFA] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {ebook.category || 'Creator Worth'}
                  </span>

                  <Link
                    to={ebookUrl}
                    state={{ ebook }}
                    className="text-sm sm:text-base font-display font-extrabold text-[#0A0E27] hover:text-[#615DFA] transition-colors tracking-tight leading-snug mb-1.5 w-full truncate px-1"
                  >
                    {ebook.title || ebook.name}
                  </Link>

                  {(ebook.short_description || ebook.description) && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {ebook.short_description || ebook.description}
                    </p>
                  )}

                  {chapterCount > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-3">
                      <Box size={11} className="text-[#615DFA]" />
                      <span>{chapterCount} Chapters</span>
                    </div>
                  )}

                  <div className="w-full mt-auto pt-1">
                    <BrutalistButton
                      to={ebookUrl}
                      state={{ ebook }}
                      variant="primary"
                      size="sm"
                      className="py-2 sm:py-2.5 px-3 text-xs sm:text-sm"
                      fullWidth
                    >
                      View E-Book
                    </BrutalistButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <BookOpen size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-display font-bold text-slate-900">No E-Books Found</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                Explore our learning packages and courses while new E-books are added to this category.
              </p>
            </div>
            <div className="max-w-xs mx-auto pt-2">
              <BrutalistButton to="/packages" variant="primary" size="sm" fullWidth>
                Explore Packages
              </BrutalistButton>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
