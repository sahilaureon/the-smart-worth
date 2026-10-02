import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import PackageCard from '../components/PackageCard';
import { fetchApi } from '../lib/api';
import {
  getCachedPackages,
  setCachedPackages,
  getCachedCourses,
  setCachedCourses
} from '../lib/packageUtils';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>(() =>
    getCachedPackages().filter((p: any) => p.is_active !== false)
  );
  const [allCourses, setAllCourses] = useState<any[]>(() => getCachedCourses());
  const [loading, setLoading] = useState<boolean>(() => packages.length === 0);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: packages.map((pkg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: pkg.name,
        description: pkg.description,
        offers: {
          '@type': 'Offer',
          price: pkg.offer_price || pkg.price,
          priceCurrency: 'INR'
        }
      }
    }))
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, coursesRes] = await Promise.all([
          fetchApi('/packages'),
          fetchApi('/courses')
        ]);

        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          const fetchedPackages = Array.isArray(packagesData)
            ? packagesData
            : packagesData?.packages || packagesData?.data || packagesData?.raw || [];
          setCachedPackages(fetchedPackages);
          setPackages(fetchedPackages.filter((p: any) => p.is_active !== false));
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const fetchedCourses = Array.isArray(coursesData)
            ? coursesData
            : coursesData?.courses || coursesData?.data || coursesData?.raw || [];
          setCachedCourses(fetchedCourses);
          setAllCourses(fetchedCourses);
        }
      } catch {
        // Keep existing state on transient network error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title="Packages | The Smart Worth - Choose The Right Skill Worth"
        description="Explore career-focused packages designed to help you learn, grow and build practical digital skills for today's online world at The Smart Worth."
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader
        title="Our Packages"
        breadcrumb="Our Packages"
      />

      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10">
        {/* Classic Centered Header (Matches Screenshot 1) */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold shadow-2xs mb-3.5">
            <span>Our Learning Packages</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-[#0A0E27] tracking-tight mb-3">
            Choose The Right <span className="text-[#615DFA]">Skill Worth</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Explore career-focused packages designed to help you learn, grow and build practical digital skills for today's online world.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#615DFA]" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No packages available yet.</h3>
            <p className="text-xs text-slate-500 mt-1">Check back soon for our exclusive offers!</p>
          </div>
        ) : (
          /* 2-Column Grid on Mobile & 4-Column on Desktop (Matches Screenshot 1) */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-4 sm:gap-x-6 sm:gap-y-6 pt-2">
            {packages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                allCourses={allCourses}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
