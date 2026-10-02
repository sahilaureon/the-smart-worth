import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Award, Clock } from 'lucide-react';
import BrutalistButton from './BrutalistButton';
import { getCourseModuleCount } from '../lib/packageUtils';

interface CourseCardProps {
  course: any;
  index?: number;
  compact?: boolean;
}

/**
 * Responsive course title sizing:
 * The wider/longer the device viewport (or the longer the course title text),
 * the smaller and more compact the course title becomes so it never wraps or overflows.
 */
function getCourseTitleClasses(title: string): string {
  const len = (title || '').trim().length;
  if (len > 22) {
    return 'text-xs sm:text-[11px] md:text-[11px] lg:text-[10px]';
  }
  if (len >= 14) {
    return 'text-sm sm:text-xs md:text-xs lg:text-[11px]';
  }
  return 'text-base sm:text-sm md:text-xs lg:text-xs';
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const courseUrl = `/courses/${encodeURIComponent(String(course.id))}`;
  const linkState = { course };
  const moduleCount = getCourseModuleCount(course);
  const durationText = String(course.duration_text || '').trim();
  const certText = String(course.certificate_text || '').trim();
  const buttonText = String(course.button_text || '').trim() || 'View Modules';
  const titleClasses = getCourseTitleClasses(course.title || '');

  const hasMeta = moduleCount > 0 || Boolean(durationText) || Boolean(certText);

  return (
    <div className="bg-white rounded-2xl border border-[#615DFA]/40 hover:border-[#615DFA] shadow-[0_6px_20px_rgba(97,93,250,0.06)] hover:shadow-[0_12px_28px_rgba(97,93,250,0.14)] transition-all duration-300 p-3 sm:p-4 flex flex-col items-center text-center group">
      {/* Classic 16:9 Course Thumbnail Frame */}
      {course.thumbnail_url && (
        <Link
          to={courseUrl}
          state={linkState}
          className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200/80 bg-white mb-3 relative block shadow-2xs"
        >
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </Link>
      )}

      {/* Responsive Compact Course Name (scales down on wider screens & longer titles, never overflows) */}
      <Link
        to={courseUrl}
        state={linkState}
        className={`${titleClasses} font-display font-extrabold text-[#0A0E27] hover:text-[#615DFA] transition-colors tracking-tight leading-snug mb-2 w-full truncate px-1`}
        title={course.title}
      >
        {course.title}
      </Link>

      {/* Real Admin-Controlled Meta Row (Only renders fields set in Admin Panel) */}
      {hasMeta && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 mb-3">
          {moduleCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Box size={11} className="text-[#615DFA]" />
              <span>{moduleCount} Modules</span>
            </span>
          )}
          {durationText && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} className="text-[#615DFA]" />
              <span>{durationText}</span>
            </span>
          )}
          {certText && (
            <span className="inline-flex items-center gap-1">
              <Award size={11} className="text-[#615DFA]" />
              <span>{certText}</span>
            </span>
          )}
        </div>
      )}

      {/* Signature BrutalistButton -> View Modules (Opens Course Details & Curriculum Page Instantly) */}
      <div className="w-full mt-auto pt-1">
        <BrutalistButton
          to={courseUrl}
          state={linkState}
          variant="primary"
          size="sm"
          className="py-2 sm:py-2.5 px-3 text-xs sm:text-sm"
          fullWidth
        >
          {buttonText}
        </BrutalistButton>
      </div>
    </div>
  );
};

export default CourseCard;
