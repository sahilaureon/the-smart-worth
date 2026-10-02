import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BrutalistButton from '../components/BrutalistButton';

const digits = [
  { char: '4', delay: 0, rotate: -4 },
  { char: '0', delay: 0.2, rotate: 0, isCenter: true },
  { char: '4', delay: 0.4, rotate: 4 },
];

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col justify-between relative overflow-hidden">
      <Navbar />

      {/* Classic subtle background geometry */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#0061FF]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#0A0E27]/[0.03] rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-[#0061FF]/[0.05] rounded-full blur-2xl" />
      </div>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
        <div className="max-w-3xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-[2.25rem] border-2 border-[#0A0E27] shadow-[0_10px_0_#0A0E27,0_28px_60px_rgba(10,14,39,0.10)] p-7 sm:p-12 md:p-14 text-center relative overflow-hidden"
          >
            {/* Top classic accent bar */}
            <div className="w-24 h-1.5 bg-[#0061FF] border border-[#0A0E27] rounded-full mx-auto mb-8" />

            {/* 3D Animated "404" built with the exact Login BrutalistButton visual language */}
            <div
              className="flex items-center justify-center gap-3 sm:gap-5 md:gap-6 my-4 select-none"
              style={{ perspective: '1000px' }}
            >
              {digits.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.7, y: 30 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -14, 0],
                    rotateX: [0, 10, -8, 0],
                    rotateY: [item.rotate, -item.rotate, item.rotate],
                    rotateZ: [item.rotate * 0.5, -item.rotate * 0.5, item.rotate * 0.5],
                  }}
                  transition={{
                    opacity: { duration: 0.4, delay: item.delay },
                    scale: { duration: 0.45, delay: item.delay },
                    y: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: item.delay,
                    },
                    rotateX: {
                      duration: 4.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: item.delay,
                    },
                    rotateY: {
                      duration: 4.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: item.delay,
                    },
                    rotateZ: {
                      duration: 3.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: item.delay,
                    },
                  }}
                  whileHover={{
                    y: 4,
                    scale: 0.97,
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{
                    y: 6,
                    scale: 0.95,
                  }}
                  className={`group relative cursor-pointer w-24 h-28 sm:w-32 sm:h-36 md:w-36 md:h-40 rounded-[1.75rem] sm:rounded-[2.25rem] border-[3px] border-[#0A0E27] flex items-center justify-center overflow-hidden transition-shadow duration-200 ${
                    item.isCenter
                      ? 'bg-[#0A0E27] text-white shadow-[0_8px_0_#0061FF,0_18px_35px_rgba(10,14,39,0.28)] hover:shadow-[0_3px_0_#0061FF,0_8px_16px_rgba(10,14,39,0.22)]'
                      : 'bg-[#0061FF] text-white shadow-[0_8px_0_#0A0E27,0_18px_35px_rgba(0,97,255,0.32)] hover:shadow-[0_3px_0_#0A0E27,0_8px_16px_rgba(0,97,255,0.24)]'
                  }`}
                >
                  {/* Top glossy highlight rim (matches Login button inner bevel) */}
                  <div className="absolute inset-x-3 top-2 h-2.5 rounded-full bg-white/25 pointer-events-none" />

                  {/* Continuous & Hover Diagonal Glossy Shine Sweep (Login button signature effect) */}
                  <motion.div
                    animate={{ x: ['-160%', '220%'] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      repeatDelay: 1.4,
                      delay: item.delay,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  />

                  {/* 3D Extruded Digit Typography */}
                  <span
                    className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight leading-none relative z-10"
                    style={{
                      textShadow: item.isCenter
                        ? '0 4px 0 #0061FF, 0 8px 16px rgba(0,0,0,0.4)'
                        : '0 4px 0 #0A0E27, 0 8px 16px rgba(10,14,39,0.35)',
                    }}
                  >
                    {item.char}
                  </span>

                  {/* Subtle corner rivet dot */}
                  <span
                    className={`absolute bottom-3 right-3 w-2 h-2 rounded-full ${
                      item.isCenter ? 'bg-[#0061FF]' : 'bg-white/60'
                    }`}
                  />
                </motion.div>
              ))}
            </div>

            {/* Classic Status Label */}
            <div className="mt-8 mb-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold tracking-widest uppercase text-[#0061FF]">
              <Sparkles size={15} className="shrink-0" />
              <span>Error 404 · Page Not Found</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#0A0E27] tracking-tight mb-4">
              This Page Took a Wrong Turn
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed mb-8 font-medium">
              The link <span className="font-mono text-xs sm:text-sm text-[#0A0E27] font-bold bg-slate-100 px-2 py-0.5 rounded-md">{location.pathname}</span> doesn&apos;t exist or may have been moved. Return to the homepage to continue your learning journey with <span className="font-bold text-[#0A0E27]">The Smart Worth</span>.
            </p>

            {/* Action Buttons using exact Login button component (BrutalistButton) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <BrutalistButton
                to="/"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto min-w-[220px]"
              >
                Back to Homepage
              </BrutalistButton>

              <BrutalistButton
                to="/courses"
                variant="white"
                size="lg"
                showIcons={false}
                className="w-full sm:w-auto min-w-[190px]"
              >
                Explore Courses
              </BrutalistButton>
            </div>

            {/* Quick go-back link */}
            <div className="mt-7 pt-6 border-t border-slate-100 flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#0061FF] transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Go Back to Previous Page</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
