import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Zap, BookOpen, Target, Share2, GraduationCap, MessageCircle, Star, ChevronLeft, ChevronRight, LayoutGrid, Award, Brain, Play, PlayCircle, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import BrutalistButton from '../components/BrutalistButton';
import SEO from '../components/SEO';
import PackageCard from '../components/PackageCard';
import CourseCard from '../components/CourseCard';
import { cn, formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { CONFIG } from '../lib/config';
import { fetchApi } from '../lib/api';
import {
  getCachedPackages,
  setCachedPackages,
  getCachedCourses,
  setCachedCourses
} from '../lib/packageUtils';
import liveClassShowcaseImg from '../assets/images/smart_worth_live_class_hero_1790877786136.jpg';

const DEFAULT_HOW_IT_WORKS_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const getYouTubeEmbedUrl = (rawUrl?: string): string => {
  const target = (rawUrl || DEFAULT_HOW_IT_WORKS_YOUTUBE_URL).trim();
  try {
    const url = new URL(target);
    let videoId = '';
    if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.replace(/^\/+/, '').split('/')[0];
    } else if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/watch')) {
        videoId = url.searchParams.get('v') || '';
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/embed/')[1]?.split('/')[0] || '';
      }
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    return target;
  } catch {
    return target;
  }
};

const Home = () => {
  const MotionLink = motion.create(Link);
  const { settings } = useSettings();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [packages, setPackages] = useState<any[]>(() =>
    getCachedPackages().filter((p: any) => p.is_active !== false)
  );
  const [allCourses, setAllCourses] = useState<any[]>(() => getCachedCourses());
  const [featuredCourses, setFeaturedCourses] = useState<any[]>(() => {
    const cached = getCachedCourses();
    const featured = cached.filter((c: any) => c.show_on_home === true);
    return featured.length > 0 ? featured : cached.slice(0, 5);
  });
  const [loading, setLoading] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const el = sliderRef.current;
    if (el) {
      const handleScroll = () => {
        const { scrollLeft } = el;
        const isMobile = window.innerWidth < 768;
        const itemWidth = (isMobile ? 300 : 500) + 32;
        const index = Math.round(scrollLeft / itemWidth);
        setCurrentSlide(index);
      };
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [featuredCourses]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const isMobile = window.innerWidth < 768;
      const itemWidth = (isMobile ? 300 : 500) + 32;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -itemWidth : itemWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, courseRes] = await Promise.all([
          fetchApi('/packages'),
          fetchApi('/courses')
        ]);
        
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          const fetchedPackages = Array.isArray(pkgData) ? pkgData : (pkgData?.packages || pkgData?.data || pkgData?.raw || []);
          setCachedPackages(fetchedPackages);
          setPackages(fetchedPackages.filter((p: any) => p.is_active !== false));
        }

        if (courseRes.ok) {
          const courseData = await courseRes.json();
          const fetchedCourses = Array.isArray(courseData) ? courseData : (courseData?.courses || courseData?.data || courseData?.raw || []);
          setCachedCourses(fetchedCourses);
          setAllCourses(fetchedCourses);
          const featured = fetchedCourses.filter((c: any) => c.show_on_home === true);
          setFeaturedCourses(featured.length > 0 ? featured : fetchedCourses.slice(0, 5));
        }
      } catch {
        // Fallback to cached packages/courses silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Smart Worth",
    "url": "https://thesmartworth.com/",
    "logo": "https://i.postimg.cc/zBYXxpq0/Picsart-26-03-18-16-54-04-376.png",
    "founder": {
      "@type": "Person",
      "name": "Sahil Aureon"
    },
    "sameAs": [
      "https://www.instagram.com/thesmartworth",
      "https://www.youtube.com/@thesmartworth"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "helplinesmartworth@gmail.com",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO 
        title="The Smart Worth | India's Best Online Earning & Skill Platform"
        description="Master digital skills with The Smart Worth. Founded by Sahil Aureon, we offer the best digital earning courses in India. Start your freelancing journey today!"
        structuredData={structuredData}
      />
      <Navbar />
      {loading ? (
        <LoadingScreen fullScreen={false} className="min-h-[60vh]" />
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-24 pb-0 md:pt-32 md:pb-0 overflow-hidden bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto mb-10 relative z-20 flex flex-col items-center"
              >
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 bg-[#EEF2FF] text-[#615DFA] px-4 py-1.5 rounded-full mb-8 border border-[#615DFA]/10">
                  <div className="w-4 h-4 rounded-full bg-[#615DFA] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">India's #1 Earning Platform</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-[#0A0E27] leading-[1.1] mb-6 tracking-tight">
                  The Smart Worth: Master <br className="hidden md:block" />
                  <span className="text-[#615DFA]">Digital Skills</span> & Earn Online
                </h1>
                
                <p className="text-sm md:text-base text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  Join India's fastest-growing online learning platform. The Smart Worth provides expert-led courses in digital marketing, freelancing, and content creation to help you build a profitable career and earn money online.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <BrutalistButton
                    to="/register"
                    size="lg"
                    className="px-20 sm:px-28"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/register';
                    }}
                  >
                    Start Your Journey
                  </BrutalistButton>
                  
                  <Link 
                    to="/courses" 
                    className="flex items-center space-x-2 text-[#0A0E27] font-black text-sm uppercase tracking-widest hover:text-[#615DFA] transition-colors group"
                  >
                    <span>Browse Courses</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>

              {/* Visual Content - Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative max-w-[700px] mx-auto"
              >
                {/* Blue Circle Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-gradient-to-b from-[#615DFA] to-[#4F46E5] rounded-full z-0 opacity-100" />
                
                {/* Main Girl Image */}
                <div className="relative z-10 flex justify-center items-end">
                  <img
                    src="https://i.postimg.cc/zBYXxpq0/Picsart-26-03-18-16-54-04-376.png"
                    alt="The Smart Worth Student Learning Digital Skills"
                    className="w-full h-auto relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    draggable="false"
                  />
                  
                  {/* Bottom Fade Mask - Minimized height to remove gap */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-20" />
                  
                  {/* Floating Badge Left */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[45%] -left-4 md:-left-16 bg-white py-3 px-4 md:py-4 md:px-6 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-gray-50 flex items-center space-x-3 z-30"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#FF4B4B] flex items-center justify-center text-white shadow-lg shadow-red-200">
                      <BookOpen size={18} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-[#0A0E27] tracking-tight whitespace-nowrap">Valuable Courses</span>
                  </motion.div>

                  {/* Floating Badge Right */}
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[65%] -right-4 md:-right-24 bg-white py-3 px-4 md:py-4 md:px-6 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-gray-50 flex items-center space-x-3 z-30"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#615DFA] flex items-center justify-center text-white shadow-lg shadow-[#615DFA]/20">
                      <TrendingUp size={18} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-[#0A0E27] tracking-tight whitespace-nowrap">Fastest Growing Platform In India</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Why Choose The Smart Worth? Section */}
          <section className="pb-10 pt-0 md:pt-4 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-display font-black text-[#0A0E27] mb-6 tracking-tight">
                  Why Choose The Smart Worth?
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                  We don't just teach; we empower you with the tools and mentorship needed to succeed in the digital economy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    icon: Zap, 
                    title: 'Fast-Track Learning', 
                    desc: 'Our curriculum is designed to get you from beginner to pro in the shortest time possible.',
                    color: 'text-secondary',
                    bgColor: 'bg-secondary/10'
                  },
                  { 
                    icon: Target, 
                    title: 'Result-Oriented', 
                    desc: 'Every course is focused on practical application and helping you start earning immediately.',
                    color: 'text-secondary',
                    bgColor: 'bg-secondary/10'
                  },
                  { 
                    icon: Users, 
                    title: 'Community Support', 
                    desc: 'Join a vibrant community of 15,000+ students and mentors who support each other\'s growth.',
                    color: 'text-secondary',
                    bgColor: 'bg-secondary/10'
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-10 rounded-[2.5rem] border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all group"
                  >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3", item.bgColor)}>
                      <item.icon className={cn("w-8 h-8", item.color)} />
                    </div>
                    <h3 className="text-xl font-black text-[#0A0E27] mb-4 tracking-tight">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* About Us Section */}
          <section className="pt-10 pb-16 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Right Image Content (Moving to right for desktop, but in screenshot it is on top for mobile, left/right depends) */}
                {/* Actually in home.tsx I put Left Content then Right Image. I will stick to that but match the look. */}
                
                {/* Image Section - Replaced with New Smart Worth Live Class Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="relative order-1 lg:order-1 flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => setIsVideoOpen(true)}
                    aria-label="Play video to see how The Smart Worth works"
                    className="relative w-full max-w-[500px] aspect-square rounded-full overflow-hidden group cursor-pointer focus:outline-none"
                  >
                    <img
                      src={liveClassShowcaseImg}
                      alt="How The Smart Worth Works - Watch Video"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {/* Subtle Interactive Pulse Ring over the Center Play Button */}
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#615DFA]/45 animate-ping opacity-40 group-hover:opacity-75" />
                  </button>
                </motion.div>

                {/* Left Content */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8 order-2 lg:order-2"
                >
                  <div className="inline-flex items-center px-8 py-3 bg-[#EEF2FF] rounded-[2rem]">
                    <span className="text-sm md:text-base font-black text-[#4F46E5] uppercase tracking-[0.25em]">
                      {settings.about_tag || 'About Us'}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-[#0A0E27] leading-[1.05] tracking-tight">
                    25 Of Top <span className="bg-[#615DFA] bg-gradient-to-r from-[#615DFA] to-[#4F46E5] text-white px-4 py-2 rounded-[2rem] inline-block -rotate-1 shadow-[6px_6px_0px_#0A0E27]">Courses</span> <br />
                    Now In One Place
                  </h2>

                  <p className="text-gray-600 text-base md:text-lg font-medium leading-relaxed max-w-xl">
                    {settings.about_description || 'Discover a curated selection of the 25 best courses offered by The Smart Worth, covering a diverse range of subjects. Whether you\'re looking to enhance your skills.'}
                  </p>

                  <div className="pt-4 space-y-4">
                    {[
                      { icon: <ChevronRight size={18} />, text: settings.about_instructor_text || 'The Most World Class Instructors' },
                      { icon: <ChevronRight size={18} />, text: 'Access Your Class anywhere' },
                      { icon: <ChevronRight size={18} />, text: 'Flexible Course Plan' }
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center space-x-3 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#615DFA] bg-gradient-to-br from-[#615DFA] to-[#4F46E5] flex items-center justify-center text-white shadow-[0_4px_10px_rgba(97,93,250,0.3)] group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <span className="text-base md:text-lg font-bold text-[#1A1A1A] tracking-tight">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-8">
                    <BrutalistButton 
                      to="/register"
                      variant="gradient"
                      size="lg"
                      className="px-12 py-5"
                    >
                      <span className="uppercase tracking-wider">Enroll Now</span>
                    </BrutalistButton>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Background shapes (for animation) */}
            <div className="absolute top-0 right-0 -z-10 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EEF2FF] rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#EEF2FF] rounded-full blur-3xl opacity-50" />

            {/* YouTube Video Player Modal */}
            <AnimatePresence>
              {isVideoOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsVideoOpen(false)}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.94, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-4xl bg-[#0A0E27] border border-white/15 rounded-2xl overflow-hidden shadow-2xl relative"
                  >
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#060A22] border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <PlayCircle size={18} className="text-[#615DFA]" />
                        <span className="text-white font-display font-bold text-sm sm:text-base">
                          How The Smart Worth Works
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsVideoOpen(false)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Close video player"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="w-full aspect-video bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(settings.about_video_url)}
                        title="How The Smart Worth Works"
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Top Courses We Have Section (Slider) */}
          <section className="pt-10 pb-16 bg-white overflow-hidden border-t border-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center bg-[#EEF2FF] text-[#615DFA] px-8 py-2.5 rounded-full mb-6"
                >
                  <span className="text-sm md:text-lg font-bold">Trending Courses</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-[#0A0E27] mb-8 tracking-tight">
                  Top Courses We Have
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed text-base md:text-lg">
                  Explore our most popular and sought-after courses designed to elevate your skills and knowledge.
                </p>
              </div>

              {/* Horizontal Scroll Interface */}
              <div className="relative group overflow-visible">
                <div 
                  ref={sliderRef}
                  className="flex overflow-x-auto gap-5 pb-8 scrollbar-hide px-4 -mx-4 md:px-0 md:mx-0 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {featuredCourses.map((course, i) => (
                    <div
                      key={course.id || i}
                      className="min-w-[260px] sm:min-w-[290px] md:min-w-[310px] snap-center"
                    >
                      <CourseCard course={course} index={i} />
                    </div>
                  ))}
                </div>

                {/* Navigation Controls and Pagination Dots */}
                <div className="flex flex-col items-center gap-6 mt-6">
                  <div className="flex items-center justify-center gap-6 md:gap-12 w-full">
                    {/* Left Navigation Button */}
                    <div className="relative group/nav">
                      <div className="absolute inset-0 rounded-full translate-y-[4px] translate-x-[2px] md:translate-y-[6px] md:translate-x-[3px] bg-black z-0 transition-transform group-active/nav:translate-y-0 group-active/nav:translate-x-0" />
                      <motion.button
                        whileTap={{ y: 4, x: 2, scale: 0.98 }}
                        onClick={() => scrollSlider('left')}
                        className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#615DFA] border-2 border-black flex items-center justify-center text-white hover:-translate-y-[2px] hover:-translate-x-[1px] transition-all"
                      >
                        <ChevronLeft size={32} strokeWidth={3} />
                      </motion.button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex items-center gap-2 md:gap-4 px-6 md:px-10 py-3 md:py-4 bg-gray-50 rounded-full border border-black/5 shadow-inner">
                      {featuredCourses.map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scale: currentSlide === i ? 1.4 : 1,
                            backgroundColor: currentSlide === i ? "#615DFA" : "#D1D5DB"
                          }}
                          className={cn(
                            "w-2 h-2 md:w-3 md:h-3 rounded-full border border-black/10",
                            currentSlide === i ? "bg-[#615DFA]" : "bg-gray-300 shadow-sm"
                          )}
                        />
                      ))}
                    </div>

                    {/* Right Navigation Button */}
                    <div className="relative group/nav">
                      <div className="absolute inset-0 rounded-full translate-y-[4px] translate-x-[2px] md:translate-y-[6px] md:translate-x-[3px] bg-black z-0 transition-transform group-active/nav:translate-y-0 group-active/nav:translate-x-0" />
                      <motion.button
                        whileTap={{ y: 4, x: 2, scale: 0.98 }}
                        onClick={() => scrollSlider('right')}
                        className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#615DFA] border-2 border-black flex items-center justify-center text-white hover:-translate-y-[2px] hover:-translate-x-[1px] transition-all"
                      >
                        <ChevronRight size={32} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Course Category Section */}
          <section className="pt-10 pb-16 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Side */}
                <div className="text-left">
                  <span className="text-[#615DFA] font-black text-lg md:text-xl mb-4 block uppercase tracking-widest">Course Category</span>
                  <h2 className="text-5xl md:text-7xl font-display font-black text-[#0A0E27] tracking-tighter leading-[1.1] mb-8">
                    Explore Popular <br /> Courses
                  </h2>
                  <p className="text-gray-500 mb-10 max-w-md font-medium leading-relaxed">
                    Discover our top-rated courses designed to help you master the most in-demand digital skills.
                  </p>
                  <BrutalistButton
                    to="/courses"
                    size="lg"
                    className="px-10"
                    showIcons={true}
                  >
                    Browse All
                  </BrutalistButton>
                </div>

                {/* Right Side - Feature Cards */}
                <div className="space-y-6">
                  {[
                    { icon: LayoutGrid, title: 'Quality Courses', desc: 'Expertly crafted curriculum' },
                    { icon: Share2, title: 'Expert Mentors', desc: 'Learn from industry leaders' },
                    { icon: GraduationCap, title: 'Lifetime Access', desc: 'Learn at your own pace' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 flex items-center space-x-6 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#615DFA] group-hover:text-white transition-all">
                        <feature.icon size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-[#0A0E27] mb-1 tracking-tight">{feature.title}</h3>
                        <p className="text-sm md:text-base text-gray-500 font-medium">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Pick A Package Section */}
          <section id="courses-section" className="pt-8 pb-14 bg-[#F8FAFF] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 relative">
              <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-[#615DFA]/25 text-[#615DFA] text-xs font-bold shadow-2xs mb-3.5">
                  <span>Our Learning Packages</span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-[#0A0E27] tracking-tight mb-3">
                  Choose The Right <span className="text-[#615DFA]">Skill Worth</span>
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
                  Explore career-focused packages designed to help you learn, grow and build practical digital skills for today's online world.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-4 sm:gap-x-6 sm:gap-y-6 pt-2 relative z-10">
                {packages.map((pkg, i) => (
                  <PackageCard key={pkg.id} pkg={pkg} index={i} allCourses={allCourses} />
                ))}
              </div>
            </div>
          </section>

          {/* FAQs Section */}
          <section className="py-12 bg-[#F8FAFF]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-display font-black text-[#0A0E27] mb-6 tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-500 font-medium tracking-wide">Got questions? We've got answers.</p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                {[
                  { q: 'How fast can I start earning with The Smart Worth?', a: "Most of our action-takers start seeing results within their first 7-14 days. By following Sahil Aureon's proven 'Success Blueprint' included in our VIP packages, you bypass months of trial and error and go straight to the earning phase." },
                  { q: 'Why should I choose The Smart Worth over free YouTube videos?', a: 'YouTube gives you information; we give you a transformation. Free content is scattered and often outdated. The Smart Worth provides a structured, step-by-step ecosystem, secret earning hacks not available publicly, and direct mentorship from Sahil Aureon himself.' },
                  { q: 'Is this a one-time investment?', a: "Yes! Once you enroll in a VIP package, you get lifetime access to the courses and the community. There are no hidden monthly fees. It's a one-time investment for a lifetime of earning potential." },
                  { q: 'What if I have zero digital skills?', a: 'Perfect! Our courses are designed for absolute beginners. We take you from zero to hero. If you can use WhatsApp and Instagram, you have enough technical skill to succeed with our platform.' },
                  { q: 'Is there a refund policy?', a: "We are so confident in the value of our digital assets that we don't offer refunds. We only want 100% committed individuals in our community. Once you access our secrets, you're part of the elite circle. (See our Value & Refund Policy for details)." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100"
                  >
                    <h3 className="text-lg font-black text-[#0A0E27] mb-3">{item.q}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-[#0A0E27] rounded-[3.5rem] p-12 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative z-10"
                >
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-3">15K+</h3>
                  <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em]">Enrolled Students</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative z-10 border-y md:border-y-0 md:border-x border-white/10 py-10 md:py-0"
                >
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-3">25+</h3>
                  <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em]">Live Courses</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative z-10"
                >
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-3">15+</h3>
                  <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em]">Best Trainers</p>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Ready to Start CTA - Classic Website Look */}
          <section className="pt-4 pb-12 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl p-7 sm:p-12 md:p-14 text-center relative overflow-hidden shadow-xs">
                {/* Top Classic Accent Line */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0A0E27] via-[#615DFA] to-[#0A0E27]" />

                {/* Subtle Classic Dot Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] opacity-35 pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                  {/* Classic Kicker */}
                  <div className="inline-flex items-center space-x-2 bg-[#EEF2FF] border border-[#615DFA]/20 px-4 py-1.5 rounded-full mb-5">
                    <Zap size={14} className="text-[#615DFA]" />
                    <span className="text-[11px] md:text-xs font-black text-[#615DFA] uppercase tracking-wider">
                      Limited Slots for Mentorship
                    </span>
                  </div>

                  {/* Classic Typography matching Website */}
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-[#0A0E27] mb-5 tracking-tight leading-[1.1]">
                    Ready to Start Your{' '}
                    <span className="text-[#615DFA]">Learning Journey?</span>
                  </h2>

                  <p className="text-slate-600 text-sm sm:text-base md:text-lg mb-8 font-medium leading-relaxed max-w-2xl">
                    Join 15,000+ students already mastering high-income digital skills at The Smart Worth. Your career transformation starts with a single click.
                  </p>

                  {/* Preserved BrutalistButton */}
                  <div className="flex flex-col items-center gap-5 w-full sm:w-auto">
                    <BrutalistButton
                      to="/register"
                      variant="primary"
                      size="lg"
                      className="px-12 sm:px-16 w-full sm:w-auto py-5"
                    >
                      Start Your Success Journey
                    </BrutalistButton>

                    {/* Classic Student Trust Row */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <div className="flex -space-x-2.5 items-center">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-2xs"
                          >
                            <img
                              src={`https://i.pravatar.cc/100?img=${i + 10}`}
                              alt="Student"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-[#0A0E27] text-xs sm:text-sm font-bold">
                        +15k students joined
                      </span>
                    </div>
                  </div>

                  {/* Classic Bottom Highlights */}
                  <div className="mt-8 pt-6 border-t border-slate-200/80 w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#615DFA]" />
                      Step-by-Step Practical Training
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#615DFA]" />
                      Expert Mentorship Support
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#615DFA]" />
                      Lifetime Course Access
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Footer />
        </>
      )}
    </div>
  );
};

export default Home;
