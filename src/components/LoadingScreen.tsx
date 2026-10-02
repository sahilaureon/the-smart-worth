import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LoadingScreenProps {
  fullScreen?: boolean;
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ fullScreen = true, className }) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center",
      fullScreen ? "fixed inset-0 z-[9999] bg-[#F8F9FA]" : "w-full h-full min-h-[400px] bg-transparent",
      className
    )}>
      <motion.div 
        animate={{ 
          rotate: 360,
        }}
        transition={{ 
          rotate: { duration: 1, repeat: Infinity, ease: "linear" },
        }}
        className="w-14 h-14 border-4 border-slate-100 border-t-[#615DFA] rounded-full shadow-xs"
      />
    </div>
  );
};

export default LoadingScreen;
