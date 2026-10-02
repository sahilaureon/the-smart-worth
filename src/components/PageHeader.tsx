import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  showBreadcrumb?: boolean;
  onReload?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumb, showBreadcrumb = true, onReload }) => {
  const displayBreadcrumb = breadcrumb || title;
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const [spinning, setSpinning] = useState(false);

  const handleReloadClick = () => {
    setSpinning(true);
    if (onReload) {
      onReload();
    } else {
      window.dispatchEvent(new CustomEvent('app-fast-reload'));
    }
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div className={cn(
      "relative min-h-[210px] sm:min-h-[230px] md:min-h-[260px] flex items-center justify-center overflow-hidden bg-slate-50 transition-all pt-20 md:pt-24 pb-6 border-b border-slate-200",
      isDashboard && "min-h-[120px] md:min-h-[140px] pt-0 pb-0 bg-white"
    )}>
      {/* Hand-drawn style illustrations (public pages only) */}
      {!isDashboard && (
        <>
          {/* Planet with rings */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-1/2 left-[15%] md:left-[22%] -translate-y-1/2 w-24 md:w-32 opacity-20 pointer-events-none"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#615DFA]">
              <path d="M40,100 Q100,20 160,100 T40,100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M75,85 Q100,60 125,85 Q100,110 75,85" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M85,115 Q105,100 125,115" fill="none" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="100" cy="100" rx="80" ry="25" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-15 100 100)" />
            </svg>
          </motion.div>

          {/* Hand-drawn Star */}
          <motion.div 
            initial={{ opacity: 0, y: -20, rotate: 15 }}
            animate={{ opacity: 1, y: 0, rotate: 5 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute top-[20%] right-[15%] md:right-[20%] w-16 md:w-20 opacity-20 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#615DFA]">
              <path d="M50,10 L60,35 L90,35 L65,55 L75,85 L50,65 L25,85 L35,55 L10,35 L40,35 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="40" cy="45" r="2" fill="currentColor" />
              <circle cx="60" cy="45" r="2" fill="currentColor" />
              <path d="M45,55 Q50,60 55,55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Hand-drawn Notebook */}
          <motion.div 
            initial={{ opacity: 0, y: 20, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: 10 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute bottom-[10%] right-[25%] md:right-[30%] w-20 md:w-24 opacity-20 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#615DFA]">
              <rect x="25" y="20" width="50" height="65" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M25,30 L75,30 M25,40 L75,40 M25,50 L75,50 M25,60 L75,60 M25,70 L75,70" stroke="currentColor" strokeWidth="1" strokeDasharray="1,2" />
              <rect x="35" y="25" width="30" height="5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M20,25 Q23,25 25,25 M20,35 Q23,35 25,35 M20,45 Q23,45 25,45 M20,55 Q23,55 25,55 M20,65 Q23,65 25,65 M20,75 Q23,75 25,75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl px-6"
      >
        <div className="flex flex-col items-start md:items-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-[#0A0E27] mb-3 tracking-tight leading-tight md:text-center">
            {title}
          </h1>
          
          {showBreadcrumb && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base font-bold">
              <Link to={isDashboard ? "/dashboard" : "/"} className="text-[#0A0E27] hover:text-indigo-600 transition-colors">
                {isDashboard ? "Dashboard" : "Home"}
              </Link>
              <ChevronRight size={16} strokeWidth={3} className="text-slate-300 shrink-0" />
              <span className="text-[#9C7F44]">{displayBreadcrumb}</span>
            </div>
          )}
          
          {subtitle && !showBreadcrumb && (
            <p className="text-lg text-slate-400 font-bold mt-2">{subtitle}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PageHeader;
