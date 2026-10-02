import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import CourseCard from '../components/CourseCard';
import { fetchApi } from '../lib/api';
import { getCachedCourses, setCachedCourses } from '../lib/packageUtils';

const PublicCourses = () => {
  const [courses, setCourses] = useState<any[]>(() => getCachedCourses());
  const [loading, setLoading] = useState<boolean>(() => getCachedCourses().length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.map((course, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: course.description || `Learn ${course.title} at The Smart Worth.`,
        provider: {
          '@type': 'Organization',
          name: 'The Smart Worth',
          sameAs: 'https://thesmartworth.site'
        }
      }
    }))
  };

  useEffect(() => {
    const fetchAllCourses = async () => {
      if (courses.length === 0) setLoading(true);
      try {
        const response = await fetchApi('/courses');
        if (response.ok) {
          const data = await response.json();
          const fetchedCourses = Array.isArray(data)
            ? data
            : data?.courses || data?.data || data?.raw || [];
          setCachedCourses(fetchedCourses);
          setCourses(fetchedCourses);
        }
      } catch {
        // Keep existing state on transient error
      } finally {
        setLoading(false);
      }
    };

    fetchAllCourses();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <SEO
        title="Courses | The Smart Worth - Master Digital Skills"
        description="Explore our wide range of professional courses including Web Development, Video Editing, Digital Marketing, Freelancing, and more at The Smart Worth."
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader
        title="Our Courses"
        subtitle="Explore our wide range of professional courses designed for your success"
      />

      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#615DFA] animate-spin" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course, i) => (
              <CourseCard key={course.id || i} course={course} index={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <BookOpen size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-display font-bold text-slate-900">No Courses Found</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                {searchQuery
                  ? "We couldn't find any courses matching your search."
                  : "We're currently updating our course catalog. Please check back soon!"}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#615DFA] text-xs font-bold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PublicCourses;
