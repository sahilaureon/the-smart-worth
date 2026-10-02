import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronsRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface BrutalistButtonProps {
  to?: string;
  state?: any;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  type?: 'button' | 'submit';
  showIcons?: boolean;
  shadow?: boolean;
  variant?: 'primary' | 'secondary' | 'white' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const BrutalistButton = ({ 
  to, 
  state,
  onClick, 
  children, 
  className, 
  containerClassName,
  type = 'button',
  showIcons = true,
  shadow = true,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false
}: BrutalistButtonProps) => {
  const MotionLink = motion.create(Link);
  
  const variants = {
    primary: 'bg-[#615DFA] text-white',
    secondary: 'bg-[#0A0E27] text-white',
    white: 'bg-white text-[#0A0E27]',
    danger: 'bg-red-600 text-white',
    gradient: 'bg-gradient-to-r from-[#615DFA] to-[#4F46E5] text-white border-none',
  };

  const shadowColors = {
    primary: 'bg-black',
    secondary: 'bg-black',
    white: 'bg-black',
    danger: 'bg-[#450A0A]',
    gradient: 'bg-[#0A0E27]',
  };

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-8 text-sm',
    lg: 'py-3 px-8 md:py-4 md:px-10 text-base md:text-lg',
    xl: 'py-6 px-12 text-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  };

  const content = (
    <>
      {loading && (
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
      )}
      <span className="relative z-10">{loading ? 'Processing...' : children}</span>
      {showIcons && !loading && (
        <div className="relative z-10">
          <ChevronsRight size={iconSizes[size]} strokeWidth={3} />
        </div>
      )}
    </>
  );

  const commonClasses = cn(
    "relative z-10 w-full rounded-full font-black border border-black hover:-translate-y-[2px] hover:-translate-x-[1px] transition-all flex items-center justify-center space-x-2",
    variants[variant],
    sizes[size],
    className
  );

  const tapProps = {
    scale: 0.98,
    backgroundColor: "#000000",
    color: "#ffffff",
    translateY: shadow ? 6 : 0,
    translateX: shadow ? 3 : 0
  };

  return (
    <div className={cn(
      "relative group/btn-container",
      fullWidth ? "w-full block" : "inline-block",
      containerClassName
    )}>
      {/* Brutalist Shadow Layer */}
      {shadow && (
        <div className={cn(
          "absolute inset-0 rounded-full translate-y-[6px] translate-x-[3px] z-0",
          shadowColors[variant]
        )} />
      )}
      
      {to ? (
        <MotionLink
          to={to}
          state={state}
          whileTap={tapProps}
          className={commonClasses}
        >
          {content}
        </MotionLink>
      ) : (
        <motion.button
          type={type}
          onClick={loading ? undefined : onClick}
          data-brutalist-btn="true"
          whileTap={tapProps}
          className={commonClasses}
        >
          {content}
        </motion.button>
      )}
    </div>
  );
};

export default BrutalistButton;
