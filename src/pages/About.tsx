import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { Target, Users, Award, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';

const About = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "The Smart Worth",
      "description": "The Smart Worth is India's premier EdTech platform founded by Sahil Aureon, focusing on digital skills and financial empowerment.",
      "founder": {
        "@type": "Person",
        "name": "Sahil Aureon"
      }
    }
  };

  const values = [
    {
      icon: Target,
      title: "Practical Learning",
      subtitle: "Skill-First Approach",
      desc: "We focus on actionable digital skills that actually help you get hired or build an independent online business."
    },
    {
      icon: Users,
      title: "Community Support",
      subtitle: "Mentorship Network",
      desc: "Join an active network of ambitious learners, practitioners, and experienced mentors guiding your progress."
    },
    {
      icon: ShieldCheck,
      title: "Verified Results",
      subtitle: "Proven Frameworks",
      desc: "Our training modules are structured around real-world case studies and tested execution strategies."
    },
    {
      icon: Zap,
      title: "Fast-Track Growth",
      subtitle: "Structured Curriculum",
      desc: "Master in weeks what typically takes months through our step-by-step, distraction-free learning paths."
    },
    {
      icon: TrendingUp,
      title: "Earning Opportunities",
      subtitle: "Career & Monetization",
      desc: "Built-in guidance and ecosystem support to help you monetize your newly acquired skills effectively."
    },
    {
      icon: Award,
      title: "Certification",
      subtitle: "Official Recognition",
      desc: "Earn industry-recognized completion certificates to showcase your expertise on your resume and profile."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="About Us | The Smart Worth - Founded by Sahil Aureon"
        description="Learn about The Smart Worth, India's leading EdTech platform. Founded by Sahil Aureon, we empower students with digital skills and earning opportunities."
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader title="About Us" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Classic Mission Statement Card */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 shadow-2xs text-center">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Our Mission &amp; Purpose
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-black text-slate-900 mb-4 leading-tight">
              Empowering India&apos;s Digital Generation
            </h2>
            <div className="w-16 h-0.5 bg-slate-900 mx-auto mb-5" />
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              The Smart Worth is more than just an EdTech platform. We are a dedicated learning community bridging the gap between traditional education and the modern digital economy. Founded by Sahil Aureon, our mission is to equip every Indian student with practical tools and real-world knowledge to succeed online.
            </p>
          </div>
        </section>

        {/* Classic Founder & Vision Section */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Founder Portrait & Classic Nameplate */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                <div className="aspect-[4/4] sm:aspect-[4/3] lg:aspect-square overflow-hidden bg-slate-100">
                  <img
                    src="https://i.postimg.cc/Sxb2Qwvd/file-000000005a8c82079fdded954b4f0c04.png"
                    alt="Sahil Aureon - Founder of The Smart Worth"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base sm:text-lg font-black text-white tracking-tight">
                      Sahil Aureon
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 mt-0.5">
                      Founder &amp; CEO
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 border border-slate-700 rounded px-2.5 py-1 shrink-0">
                    The Smart Worth
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Vision & Key Metrics */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-4">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Leadership &amp; Vision
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                    A Vision for the Future
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sahil Aureon envisioned a platform where structured learning directly connects with real-world earning. Having navigated the challenges of the digital economy firsthand, Sahil created The Smart Worth to simplify the path for ambitious students across the country.
                </p>

                <blockquote className="border-l-3 border-slate-900 pl-4 py-3 pr-4 bg-slate-50 rounded-r-md text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;Our goal is not just to teach skills, but to build self-reliant digital professionals and entrepreneurs. We want to see a Smart Worth student in every corner of India, leading the digital revolution.&rdquo;
                </blockquote>
              </div>

              {/* Classic Metrics Directory Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 border border-slate-200 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50">
                <div className="p-3.5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">15K+</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Active Students
                  </p>
                </div>
                <div className="p-3.5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">500+</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Success Stories
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3.5 text-center border-t sm:border-t-0 border-slate-200">
                  <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Practical Focus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Classic Values Grid Section */}
        <section className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                Core Pillars
              </span>
              <h2 className="text-lg sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                Why Choose The Smart Worth?
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Built on practical education, mentorship, and career-focused execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <value.icon size={17} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {value.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">{value.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Classic CTA Banner with Login-style Animated BrutalistButton */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-10 text-center shadow-2xs">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Get Started With Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black !text-white tracking-tight">
              Start Your Journey Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              Join thousands of students who are already building their digital skills and future with The Smart Worth.
            </p>
            <div className="pt-4 pb-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <BrutalistButton
                to="/register"
                variant="primary"
                size="lg"
                containerClassName="w-full sm:w-auto"
              >
                Join Now
              </BrutalistButton>
              <BrutalistButton
                to="/packages"
                variant="white"
                size="lg"
                containerClassName="w-full sm:w-auto"
              >
                Explore Courses
              </BrutalistButton>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
