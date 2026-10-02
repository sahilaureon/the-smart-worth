import React, { useState } from 'react';
import {
  BookOpen,
  Shield,
  Play,
  Search,
  Layers,
  Lock,
  Unlock,
  Package,
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import { useEnrolledCourses } from '../../lib/queries';
import LoadingScreen from '../../components/LoadingScreen';
import { cn } from '../../lib/utils';

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [lockedModalCourse, setLockedModalCourse] = useState<any | null>(null);

  const {
    data: courses = [],
    isLoading,
    error: queryError
  } = useEnrolledCourses(user?.id);

  const unlockedCount = courses.filter((c: any) => c.is_unlocked !== false).length;
  const lockedCount = courses.filter((c: any) => c.is_unlocked === false).length;

  const myPackageNames: string[] = Array.from(
    new Set(
      courses.flatMap((c: any) =>
        Array.isArray(c.my_package_names) ? c.my_package_names : []
      )
    )
  );

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    const isUnlocked = course.is_unlocked !== false;
    if (statusFilter === 'unlocked') return isUnlocked;
    if (statusFilter === 'locked') return !isUnlocked;
    return true;
  });

  if (isLoading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Classic Header & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <BookOpen size={14} className="text-slate-700" />
              <span>Learning Portal</span>
              {myPackageNames.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                  <Package size={11} />
                  <span>My Package: {myPackageNames.join(', ')}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Courses included in your active package show <strong className="text-emerald-700">Unlocked</strong>; other courses show a <strong className="text-amber-700">Lock</strong> icon.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full h-10 pl-9 pr-3.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
            />
          </div>
        </div>

        {/* Classic Filter Tabs (All / Unlocked in Package / Locked) */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center gap-1.5',
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              )}
            >
              <BookOpen size={12} />
              <span>All Courses ({courses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unlocked')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center gap-1.5',
                statusFilter === 'unlocked'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              )}
            >
              <Unlock size={12} />
              <span>Unlocked in My Package ({unlockedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('locked')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center gap-1.5',
                statusFilter === 'locked'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              )}
            >
              <Lock size={12} />
              <span>Locked ({lockedCount})</span>
            </button>
          </div>

          {lockedCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/dashboard/packages')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <Package size={13} />
              <span>Upgrade Package to Unlock All</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {queryError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 text-red-800">
          <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Connection Issue Detected</p>
            <p className="text-xs mt-1">{(queryError as Error).message}</p>
          </div>
        </div>
      )}

      {/* Classic Course Cards Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const lessonCount = Array.isArray(course.lessons) ? course.lessons.length : 0;
            const isUnlocked = course.is_unlocked !== false;

            return (
              <div
                key={course.id}
                className={cn(
                  'bg-white rounded-lg border shadow-sm transition-all overflow-hidden flex flex-col',
                  isUnlocked
                    ? 'border-slate-200 hover:border-emerald-400'
                    : 'border-slate-200 bg-slate-50/40 hover:border-amber-400'
                )}
              >
                {/* Course Thumbnail with Lock / Unlock Overlay */}
                <div
                  onClick={() => {
                    if (isUnlocked) {
                      navigate(`/dashboard/courses/${course.id}`);
                    } else {
                      setLockedModalCourse(course);
                    }
                  }}
                  className="aspect-video bg-slate-100 relative overflow-hidden border-b border-slate-200 cursor-pointer group"
                >
                  <img
                    src={optimizeCloudinaryUrl(
                      course.thumbnail_url ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
                      800,
                      450
                    )}
                    alt={course.title}
                    className={cn(
                      'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
                      !isUnlocked && 'grayscale-[35%] brightness-75'
                    )}
                    referrerPolicy="no-referrer"
                  />

                  {/* Top-Left Lock / Unlock Status Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {isUnlocked ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm border border-emerald-700">
                        <Unlock size={11} />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm border border-rose-700">
                        <Lock size={11} />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Top-Right Modules Count Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="px-2.5 py-1 rounded bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <Layers size={11} />
                      <span>{lessonCount} Modules</span>
                    </span>
                  </div>

                  {/* Center Tala (Lock Icon) Overlay when NOT included in My Package */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-900/95 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg">
                        <Lock size={22} />
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-900/90 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                        Not Included in My Package
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight line-clamp-2">
                        {course.title}
                      </h3>
                      {isUnlocked ? (
                        <span title="Unlocked in My Package" className="shrink-0 mt-0.5">
                          <Unlock size={16} className="text-emerald-600" />
                        </span>
                      ) : (
                        <span title="Locked - Not in My Package" className="shrink-0 mt-0.5">
                          <Lock size={16} className="text-rose-600" />
                        </span>
                      )}
                    </div>

                    {course.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    )}

                    {/* Package Inclusion Status Strip */}
                    {isUnlocked ? (
                      <div className="mt-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Unlocked in My Package</span>
                        </div>
                        {course.unlocked_by_package && (
                          <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider truncate max-w-[130px]">
                            {course.unlocked_by_package}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-bold">
                          <Lock size={13} className="text-amber-600 shrink-0" />
                          <span>Locked • Not in My Package</span>
                        </div>
                        {Array.isArray(course.required_packages) && course.required_packages.length > 0 && (
                          <p className="text-[10px] text-amber-800 font-medium pl-5 truncate">
                            Included in: <span className="font-bold">{course.required_packages.join(', ')}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                      className="w-full py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <Play size={14} className="fill-current" />
                      <span>Start Course</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLockedModalCourse(course)}
                      className="w-full py-2.5 px-4 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Lock size={14} className="text-amber-700" />
                      <span>Course Locked • Unlock Package</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto text-slate-400">
            <BookOpen size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            No Courses Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'No courses match your search query.'
              : "No courses found for the selected filter."}
          </p>
        </div>
      )}

      {/* Classic Locked Course Popup Modal */}
      {lockedModalCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Course Locked
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLockedModalCourse(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock size={26} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  {lockedModalCourse.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Yeh course aapke current package (<span className="font-bold text-slate-900">{myPackageNames.length > 0 ? myPackageNames.join(', ') : 'No Active Package'}</span>) ke andar included nahi hai. Isliye is par lock laga hua hai.
                </p>
              </div>

              {Array.isArray(lockedModalCourse.required_packages) &&
                lockedModalCourse.required_packages.length > 0 && (
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-left space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Available in Packages:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lockedModalCourse.required_packages.map((pkgName: string) => (
                        <span
                          key={pkgName}
                          className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Package size={12} className="text-indigo-600" />
                          <span>{pkgName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLockedModalCourse(null)}
                  className="flex-1 py-2.5 px-4 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockedModalCourse(null);
                    navigate('/dashboard/packages');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Unlock size={14} />
                  <span>Unlock Package</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
