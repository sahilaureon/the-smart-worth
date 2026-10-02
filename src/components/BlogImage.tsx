import React, { useState } from 'react';
import { BlogPost } from '../data/blogPosts';
import { BookOpen } from 'lucide-react';

interface BlogImageProps {
  post: BlogPost;
  className?: string;
}

const BlogImage: React.FC<BlogImageProps> = ({
  post,
  className = 'w-full h-full object-cover'
}) => {
  const [failed, setFailed] = useState(false);
  const src = (post.image_url || post.image || '').trim();

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-slate-900 text-white p-5 sm:p-6 flex flex-col justify-between select-none">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {post.category}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            The Smart Worth
          </span>
        </div>

        <div className="my-auto py-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#23D2E2] mb-1">
            Featured Subject
          </p>
          <p className="text-base sm:text-lg font-display font-black text-white leading-snug line-clamp-2">
            {post.author}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={12} className="text-slate-400" />
            <span>Editorial Insight</span>
          </span>
          <span>{post.readTime}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={post.title}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

export default BlogImage;
