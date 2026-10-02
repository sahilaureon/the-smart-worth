import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import BlogImage from '../components/BlogImage';
import { blogPosts, BLOG_CATEGORIES, GLOBAL_BLOG_CTA } from '../data/blogPosts';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowRight, CheckCircle2, Mail } from 'lucide-react';

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const categories = ['All', ...BLOG_CATEGORIES];

  const publishedPosts = blogPosts.filter((p) => p.status === 'published');

  const filteredPosts =
    selectedCategory === 'All'
      ? publishedPosts
      : publishedPosts.filter((p) => p.category === selectedCategory);

  const featuredPost = filteredPosts[0] || publishedPosts[0];
  const remainingPosts =
    selectedCategory === 'All' ? filteredPosts.slice(1) : filteredPosts;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'The Smart Worth Blogs',
    description:
      'Insights on content creation, entrepreneurship, finance, and investing to help you build practical digital skills.',
    publisher: {
      '@type': 'Organization',
      name: 'The Smart Worth'
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="Blogs | The Smart Worth - Digital Skills, Entrepreneurship & Finance"
        description="Read all 10 published articles on content creation, digital entrepreneurship, financial literacy, and long-term investing at The Smart Worth."
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader title="Blogs" breadcrumb="Blogs" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Classic Top Filter & Directory Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
              Editorial &amp; Guides ({filteredPosts.length}{' '}
              {filteredPosts.length === 1 ? 'Article' : 'Articles'})
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Latest Articles &amp; Insights
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Classic Featured Post Card (Strict 16:9 Image Container) */}
        {selectedCategory === 'All' && featuredPost && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 aspect-video overflow-hidden bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200">
                <BlogImage post={featuredPost} className="w-full h-full object-cover" />
              </div>

              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-3.5 border-b border-slate-100">
                    <span className="text-slate-900">{featuredPost.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {featuredPost.readTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {featuredPost.publishedDate}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mt-4 mb-3 leading-snug">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <User size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-none">
                        {featuredPost.author}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Published {featuredPost.publishedDate}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider border border-slate-900 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classic Blog Posts Grid (Strict 16:9 Image Containers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {remainingPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="aspect-video overflow-hidden bg-slate-100 border-b border-slate-200">
                  <BlogImage post={post} className="w-full h-full object-cover" />
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
                    <span className="text-slate-900">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-3.5 mb-2 leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{post.author}</p>
                  <p className="text-[10px] font-medium text-slate-500">{post.publishedDate}</p>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold uppercase tracking-wider border border-slate-900 transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Read More</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Global Blog CTA Card */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-slate-900">
              {GLOBAL_BLOG_CTA.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {GLOBAL_BLOG_CTA.description}
            </p>
          </div>
          <BrutalistButton
            to="/register"
            variant="primary"
            size="md"
            containerClassName="w-full sm:w-auto shrink-0"
          >
            {GLOBAL_BLOG_CTA.buttonText}
          </BrutalistButton>
        </section>

        {/* Classic Newsletter Subscription Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-10 text-center shadow-2xs">
          <div className="max-w-xl mx-auto space-y-4">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Newsletter Digest
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black !text-white tracking-tight">
              Never Miss an Update
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Subscribe to our newsletter and get the latest digital skills and learning guides directly in your inbox.
            </p>

            {subscribed ? (
              <div className="p-3.5 rounded-md bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Thank you for subscribing! You will receive our latest articles in your inbox.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="pt-3 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <Mail
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-[#615DFA] focus:outline-none transition-colors"
                  />
                </div>
                <BrutalistButton
                  type="submit"
                  variant="primary"
                  size="md"
                  containerClassName="w-full sm:w-auto shrink-0"
                >
                  Subscribe
                </BrutalistButton>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
