import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import BrutalistButton from '../components/BrutalistButton';
import BlogImage from '../components/BlogImage';
import { blogPosts, getRelatedBlogPosts, GLOBAL_BLOG_CTA } from '../data/blogPosts';
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug && p.status === 'published');

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <PageHeader title="Blogs" breadcrumb="Blogs" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-2xs max-w-md w-full">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Article Not Found</h1>
            <p className="text-xs text-slate-500 mb-5">
              The blog post you are looking for does not exist or may have been moved.
            </p>
            <Link
              to="/blog"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider border border-slate-900 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Blogs</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const relatedPosts = getRelatedBlogPosts(post, 3);
  const resolvedImageUrl =
    post.image_url?.trim() || post.image?.trim() || `/images/blog/${post.imageFileName}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: [resolvedImageUrl],
    datePublished: post.publishedDate,
    author: [
      {
        '@type': 'Person',
        name: post.author
      }
    ],
    publisher: {
      '@type': 'Organization',
      name: 'The Smart Worth',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thesmartworth.com/logo.png'
      }
    },
    description: post.excerpt
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title={`${post.title} | The Smart Worth Blogs`}
        description={post.excerpt}
        ogType="article"
        ogImage={resolvedImageUrl}
        structuredData={structuredData}
      />
      <Navbar />
      <PageHeader title="Blogs" breadcrumb="Blogs" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Top Classic Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/blog"
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-md text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Blogs</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-md text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share Article</span>
          </button>
        </div>

        {/* Classic Article Container (Strict 16:9 Image Container) */}
        <article className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="aspect-video overflow-hidden bg-slate-100 border-b border-slate-200">
            <BlogImage post={post} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 pb-4 border-b border-slate-200">
              <span className="text-slate-900">{post.category}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {post.readTime}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                {post.publishedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 mt-5 mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between py-4 px-4 rounded-md bg-slate-50 border border-slate-200 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{post.author}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Published on {post.publishedDate}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="prose prose-slate max-w-none
                prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-slate-900 prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-img:rounded-lg prose-img:border prose-img:border-slate-200"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Global CTA Section */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {GLOBAL_BLOG_CTA.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
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
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Grid (Strict 16:9 Image Containers) */}
        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                More in {post.category} &amp; Related Topics
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Related Articles
              </h2>
            </div>
            <Link
              to="/blog"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedPosts.map((relatedPost) => (
              <div
                key={relatedPost.id}
                className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video overflow-hidden bg-slate-100 border-b border-slate-200">
                    <BlogImage post={relatedPost} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {relatedPost.category} · {relatedPost.readTime}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {relatedPost.title}
                    </h3>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {relatedPost.publishedDate}
                  </span>
                  <Link
                    to={`/blog/${relatedPost.slug}`}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                  >
                    <span>Read</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
