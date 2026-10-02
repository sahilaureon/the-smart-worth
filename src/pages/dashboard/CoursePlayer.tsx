import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ListVideo,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, getVimeoEmbedUrl } from '../../lib/utils';
import { useAuth } from '../../App';
import { fetchApi } from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse, useLessonCompletions, useEnrolledCourses } from '../../lib/queries';

const Player = React.forwardRef((props: any, ref: any) => {
  const { onBuffer, onBufferEnd, ...rest } = props;
  return <ReactPlayer ref={ref} {...rest} />;
});

/**
 * Extracts a clean URL if an <iframe> snippet was pasted, and resolves
 * YouTube, Vimeo, Google Drive, Cloudinary, or direct video URLs.
 */
function resolveVideoSource(rawInput?: string): {
  type: 'iframe' | 'video' | 'react-player' | 'none';
  src: string;
} {
  if (!rawInput || !String(rawInput).trim()) {
    return { type: 'none', src: '' };
  }

  let url = String(rawInput).trim();

  // 1. If user pasted an <iframe ... src="..."> tag, extract src
  if (url.includes('<iframe')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      url = srcMatch[1].trim();
    }
  }

  // 2. YouTube URLs (watch?v=, youtu.be/, embed/, shorts/, live/)
  const ytRegex =
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch?.[1]) {
    const videoId = ytMatch[1];
    const originParam =
      typeof window !== 'undefined' && window.location?.origin
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : '';
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1${originParam}`
    };
  }

  // 3. Vimeo URLs
  if (url.includes('vimeo.com')) {
    const vimeoEmbed = getVimeoEmbedUrl(url);
    if (vimeoEmbed) {
      return { type: 'iframe', src: vimeoEmbed };
    }
  }

  // 4. Google Drive video links
  if (url.includes('drive.google.com')) {
    const driveFileMatch =
      url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveFileMatch?.[1]) {
      return {
        type: 'iframe',
        src: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`
      };
    }
  }

  // 5. Explicit Cloudinary Embed Player URL
  if (url.includes('player.cloudinary.com/embed')) {
    return { type: 'iframe', src: url.replace(/ /g, '%20') };
  }

  // 6. Direct video files (.mp4, .webm, .ogg, .mov) or Cloudinary direct video delivery URLs
  const cleanUrl = url.replace(/ /g, '%20');
  if (
    cleanUrl.includes('res.cloudinary.com') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(cleanUrl)
  ) {
    return { type: 'video', src: cleanUrl };
  }

  // 7. Any other streaming URL supported by ReactPlayer (without forceVideo!)
  return { type: 'react-player', src: cleanUrl };
}

const CoursePlayer = () => {
  const { user } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const [activeLesson, setActiveLesson] = useState(0);

  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: enrolledCourses = [], isLoading: enrolledLoading } = useEnrolledCourses(user?.id);
  const { data: completedLessons = [], isLoading: completionsLoading } = useLessonCompletions(
    user?.id,
    courseId
  );

  const loading = courseLoading || completionsLoading || enrolledLoading;

  const markCompleteMutation = useMutation({
    mutationFn: async ({ lessonId }: { lessonId: string }) => {
      const response = await fetchApi('/lesson-completions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user?.id,
          course_id: courseId,
          lesson_id: lessonId
        })
      });
      if (!response.ok) throw new Error('Failed to mark lesson complete');
    },
    onMutate: async ({ lessonId }) => {
      await queryClient.cancelQueries({ queryKey: ['lesson-completions', user?.id, courseId] });
      const previousCompletions = queryClient.getQueryData([
        'lesson-completions',
        user?.id,
        courseId
      ]);

      queryClient.setQueryData(
        ['lesson-completions', user?.id, courseId],
        (old: string[] = []) => {
          if (old.includes(lessonId)) return old;
          return [...old, lessonId];
        }
      );

      return { previousCompletions };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(
        ['lesson-completions', user?.id, courseId],
        context?.previousCompletions
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-completions', user?.id, courseId] });
    }
  });

  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const currentLesson = lessons[activeLesson];
  const isCompleted =
    currentLesson && completedLessons.includes(currentLesson.id || String(activeLesson));

  const videoSource = resolveVideoSource(currentLesson?.video_url);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLesson, courseId]);

  const handleLessonChange = (index: number) => {
    if (index === activeLesson || index < 0 || index >= lessons.length) return;
    setActiveLesson(index);
  };

  const handleToggleComplete = () => {
    if (!currentLesson) return;
    const lessonId = currentLesson.id || String(activeLesson);
    if (!isCompleted) {
      markCompleteMutation.mutate({ lessonId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-lg border border-slate-200 p-10 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            Course Unavailable
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            The requested course could not be found or you do not have access to it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/courses')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Back to My Courses
        </button>
      </div>
    );
  }

  const matchedAccess = enrolledCourses.find((c: any) => String(c.id) === String(courseId));
  if (matchedAccess && matchedAccess.is_unlocked === false) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-10 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 mb-2">
            <Lock size={11} />
            <span>Locked • Not in My Package</span>
          </span>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {course.title}
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
            Yeh course aapke current package ke andar included nahi hai. Isko dekhne ke liye package unlock/upgrade karein.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/courses')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Back to My Courses
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/packages')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Unlock size={14} />
            <span>Unlock Package</span>
          </button>
        </div>
      </div>
    );
  }

  const completedCount = lessons.filter((l: any, idx: number) =>
    completedLessons.includes(l.id || String(idx))
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Classic Top Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard/courses')}
            className="px-3 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>My Courses</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight truncate">
              {course.title}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Module {lessons.length > 0 ? activeLesson + 1 : 0} of {lessons.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            Completed: {completedCount}/{lessons.length}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left / Main Column: Video Player + Classic Lesson Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Frame */}
          <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-300 shadow-sm">
            {videoSource.type === 'iframe' ? (
              <iframe
                key={videoSource.src}
                src={videoSource.src}
                width="100%"
                height="100%"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                frameBorder="0"
                className="absolute inset-0 w-full h-full"
                title={currentLesson?.title || 'Course Video Player'}
              />
            ) : videoSource.type === 'video' ? (
              <video
                key={videoSource.src}
                src={videoSource.src}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onEnded={handleToggleComplete}
                className="w-full h-full object-contain bg-black"
              />
            ) : videoSource.type === 'react-player' ? (
              <Player
                key={videoSource.src}
                ref={playerRef}
                url={videoSource.src}
                width="100%"
                height="100%"
                controls={true}
                playsinline
                onEnded={handleToggleComplete}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
                <Play size={36} className="text-slate-500" />
                <p className="font-semibold uppercase tracking-wider text-xs">
                  No video link configured for this module
                </p>
              </div>
            )}
          </div>

          {/* Classic Lesson Info & Action Buttons Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                    Part {currentLesson?.part_digit || String(activeLesson + 1).padStart(2, '0')} • Module{' '}
                    {activeLesson + 1}
                  </span>
                  {currentLesson?.features && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                      <Clock size={11} />
                      <span>{currentLesson.features}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight">
                  {currentLesson?.title || 'Course Module'}
                </h1>

                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck size={14} className="text-slate-700" />
                  <span>{course.title}</span>
                </p>
              </div>

              {/* Classic Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {lessons.length > 1 && (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLessonChange(activeLesson - 1)}
                      disabled={activeLesson === 0}
                      className="px-3 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonChange(activeLesson + 1)}
                      disabled={activeLesson >= lessons.length - 1}
                      className="px-3 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToggleComplete}
                  disabled={isCompleted || markCompleteMutation.isPending}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-xs uppercase tracking-wider transition-colors border cursor-pointer',
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 shadow-sm'
                  )}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      {markCompleteMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Classic Overview Section */}
            <div className="p-5 bg-slate-50/60">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={15} className="text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Lesson Overview &amp; Details
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {currentLesson?.features
                  ? `Duration / Details: ${currentLesson.features}`
                  : 'Watch this module completely and click "Mark Complete" to track your course progress.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Classic Course Content / Modules List */}
        <div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <ListVideo size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Course Content
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lessons.length} {lessons.length === 1 ? 'Module' : 'Modules'} Available
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {lessons.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  No modules added to this course yet.
                </div>
              ) : (
                lessons.map((lesson: any, index: number) => {
                  const isActive = activeLesson === index;
                  const lessonIsCompleted = completedLessons.includes(
                    lesson.id || String(index)
                  );

                  return (
                    <button
                      key={lesson.id || index}
                      type="button"
                      onClick={() => handleLessonChange(index)}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 p-4 text-left transition-colors cursor-pointer',
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-md flex items-center justify-center shrink-0 border text-xs font-bold',
                            isActive
                              ? 'bg-white/10 border-white/20 text-white'
                              : lessonIsCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          )}
                        >
                          {isActive ? (
                            <Play size={14} className="fill-current" />
                          ) : lessonIsCompleted ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider',
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            )}
                          >
                            Part {lesson.part_digit || String(index + 1).padStart(2, '0')}
                            {lesson.features ? ` • ${lesson.features}` : ''}
                          </p>
                          <p
                            className={cn(
                              'text-xs sm:text-sm font-bold truncate uppercase tracking-tight mt-0.5',
                              isActive ? 'text-white' : 'text-slate-900'
                            )}
                          >
                            {lesson.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {lessonIsCompleted && !isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Done
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/15 text-white">
                            Playing
                          </span>
                        )}
                        <ChevronRight
                          size={15}
                          className={cn(isActive ? 'text-white' : 'text-slate-400')}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
