import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Video,
  FileText,
  ChevronRight,
  X,
  Save,
  Play,
  Clock,
  Layout,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { cn, sanitizeVideoUrl } from '../../lib/utils';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { setCachedCourses } from '../../lib/packageUtils';

import LoadingScreen from '../../components/LoadingScreen';

const Player = React.forwardRef((props: any, ref: any) => {
  const { onBuffer, onBufferEnd, ...rest } = props;
  return <ReactPlayer ref={ref} {...rest} />;
});

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  part_digit: string;
  features: string;
  description?: string;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  slug?: string;
  thumbnail_url: string;
  detail_thumbnail_url?: string;
  description: string;
  digit_lesson: string;
  duration_text?: string;
  rating?: number;
  category?: string;
  subcategory?: string;
  instructor?: string;
  level?: string;
  certificate_text?: string;
  button_text?: string;
  highlights?: string;
  lessons: Lesson[];
  show_on_home?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  og_image?: string;
  is_indexed?: boolean;
  created_at?: string;
}

const INITIAL_COURSE_STATE: Omit<Course, 'id'> = {
  title: '',
  slug: '',
  thumbnail_url: '',
  detail_thumbnail_url: '',
  description: '',
  digit_lesson: '',
  duration_text: '',
  rating: 0,
  category: 'Creator Worth',
  subcategory: '',
  instructor: '',
  level: 'All Levels',
  certificate_text: '',
  button_text: '',
  highlights: '',
  lessons: [],
  show_on_home: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  canonical_url: '',
  og_image: '',
  is_indexed: true
};

const INITIAL_LESSON_STATE: Omit<Lesson, 'id'> = {
  title: '',
  video_url: '',
  part_digit: '',
  features: '',
  description: ''
};

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState(INITIAL_COURSE_STATE);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState<Course | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isLessonDescExpanded, setIsLessonDescExpanded] = useState(false);
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);
  
  // Lesson management state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState(INITIAL_LESSON_STATE);
  const [stableLessonUrl, setStableLessonUrl] = useState('');
  const lessonPlayerRef = React.useRef<any>(null);

  // Debounce URL for hidden player to prevent "play() interrupted" errors
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableLessonUrl(currentLesson.video_url);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentLesson.video_url]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'courses',
        query: { order: { column: 'created_at', ascending: false } }
      });
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
      setCachedCourses(list);
      if (list.length > 0 && !selectedPreviewCourse) {
        setSelectedPreviewCourse(list[0]);
      }
      setError(null);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    const onFastReload = () => fetchCourses();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleSaveCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      setError("Title and description are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const computedSlug = (newCourse.slug || newCourse.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const coursePayload = {
      ...newCourse,
      slug: computedSlug
    };

    try {
      if (editingCourseId) {
        await invokeAdminFunction('admin-action', {
          action: 'update',
          table: 'courses',
          payload: {
            id: editingCourseId,
            data: {
              ...coursePayload,
              updated_at: new Date().toISOString()
            }
          }
        });
        setSuccess("Course updated successfully!");
      } else {
        await invokeAdminFunction('admin-action', {
          action: 'insert',
          table: 'courses',
          payload: {
            ...coursePayload,
            created_at: new Date().toISOString()
          }
        });
        setSuccess("Course created successfully!");
      }

      setIsModalOpen(false);
      setActiveField(null);
      fetchCourses();
      setNewCourse(INITIAL_COURSE_STATE);
      setEditingCourseId(null);
    } catch (err: any) {
      console.error("Error saving course:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await invokeAdminFunction('admin-action', {
        action: 'delete',
        table: 'courses',
        payload: { id: courseToDelete }
      });
      setSuccess("Course deleted successfully!");
      fetchCourses();
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (err: any) {
      console.error("Error deleting course:", err);
      setError(err.message);
    } finally {
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const openEditModal = (course: Course) => {
    const autoSlug = ((course as any).slug || course.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setNewCourse({
      title: course.title,
      slug: autoSlug,
      thumbnail_url: course.thumbnail_url || '',
      detail_thumbnail_url: (course as any).detail_thumbnail_url || (course as any).banner_url || '',
      description: course.description,
      digit_lesson: course.digit_lesson || '',
      duration_text: (course as any).duration_text || '',
      rating: Number((course as any).rating || 0),
      category: (course as any).category || 'Creator Worth',
      subcategory: (course as any).subcategory || '',
      instructor: (course as any).instructor || '',
      level: (course as any).level || 'All Levels',
      certificate_text: (course as any).certificate_text || '',
      button_text: (course as any).button_text || '',
      highlights: Array.isArray((course as any).highlights)
        ? (course as any).highlights.join(', ')
        : (course as any).highlights || '',
      lessons: course.lessons || [],
      show_on_home: course.show_on_home || false,
      seo_title: (course as any).seo_title || '',
      seo_description: (course as any).seo_description || '',
      seo_keywords: (course as any).seo_keywords || '',
      canonical_url: (course as any).canonical_url || '',
      og_image: (course as any).og_image || '',
      is_indexed: (course as any).is_indexed !== false
    });
    setEditingCourseId(course.id);
    setActiveField('title');
    setIsModalOpen(true);
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchYouTubeInfo = () => {
    const videoId = getYouTubeId(currentLesson.video_url);
    if (videoId) {
      if (!newCourse.thumbnail_url) {
        setNewCourse({
          ...newCourse,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        });
      }
      setSuccess("YouTube info detected!");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError("Invalid YouTube URL");
      setTimeout(() => setError(null), 2000);
    }
  };

  const toggleFeatured = async (course: Course) => {
    try {
      await invokeAdminFunction('admin-action', {
        action: 'update',
        table: 'courses',
        payload: {
          id: course.id,
          data: { show_on_home: !course.show_on_home }
        }
      });
      fetchCourses();
      setSuccess(`Course ${!course.show_on_home ? 'added to' : 'removed from'} home page!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error toggling featured status:", err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  };

  const handleAddLesson = () => {
    if (!currentLesson.title.trim()) {
      return;
    }

    const lessonWithId = {
      ...currentLesson,
      id: editingLessonIndex !== null ? newCourse.lessons[editingLessonIndex].id : Math.random().toString(36).substring(2, 9)
    };

    const updatedLessons = [...newCourse.lessons];
    if (editingLessonIndex !== null) {
      updatedLessons[editingLessonIndex] = lessonWithId;
    } else {
      updatedLessons.push(lessonWithId);
    }

    setNewCourse({ ...newCourse, lessons: updatedLessons });
    setActiveField('lessons');
    setIsLessonModalOpen(false);
    setCurrentLesson(INITIAL_LESSON_STATE);
    setEditingLessonIndex(null);
  };

  const removeLesson = (index: number) => {
    const updatedLessons = newCourse.lessons.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, lessons: updatedLessons });
    setActiveField('lessons');
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Course Management</h1>
          <p className="text-slate-500 text-sm">Create and manage your unlimited courses.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCourses}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Reload Courses"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", loading && "animate-spin")} />
            <span>Reload</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              setNewCourse(INITIAL_COURSE_STATE);
              setEditingCourseId(null);
              setActiveField('title');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#615DFA]/10 rounded-2xl flex items-center justify-center text-[#615DFA]">
            <Layout size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Courses</p>
            <p className="text-2xl font-black text-slate-800">{courses.length}</p>
          </div>
        </div>
        
        <div className="md:col-span-2 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search courses by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl focus:ring-4 focus:ring-[#615DFA]/5 focus:border-[#615DFA] outline-none transition-all font-medium shadow-sm"
          />
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center space-x-3"
          >
            <XCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-center space-x-3"
          >
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Courses Grid */}
      {loading ? (
        <LoadingScreen fullScreen={false} />
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div 
              layout
              key={course.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-[#615DFA]/5 transition-all duration-500"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {course.thumbnail_url ? (
                  <img 
                    src={optimizeCloudinaryUrl(course.thumbnail_url, 640, 360)} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Video size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button 
                    type="button"
                    onClick={() => openEditModal(course)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Edit size={14} className="text-indigo-600" />
                    <span>Edit</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setCourseToDelete(course.id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-md text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Trash2 size={14} className="text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {course.lessons?.length || 0} Lessons
                  </span>
                  {course.show_on_home && (
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
                      <Star size={10} className="fill-white" /> Featured
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1 flex-grow">{course.title}</h3>
                  <button 
                    type="button"
                    onClick={() => toggleFeatured(course)}
                    className={cn(
                      "ml-2 px-2.5 py-1.5 rounded-md transition-colors border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer",
                      course.show_on_home 
                        ? "bg-amber-50 text-amber-700 border-amber-300" 
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                    )}
                    title={course.show_on_home ? "Remove from Home Page" : "Show on Home Page"}
                  >
                    <Layout size={14} />
                    <span>{course.show_on_home ? 'Featured' : 'Feature'}</span>
                  </button>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{course.description}</p>
                
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-xs font-bold">Updated {new Date(course.created_at || '').toLocaleDateString()}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openEditModal(course)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold text-xs flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Manage</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Video size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Courses Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-6 text-sm">Start by creating your first course to share with your students.</p>
          <button 
            type="button"
            onClick={() => {
              setActiveField('title');
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-5 py-2.5 rounded-md font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
          >
            Create Your First Course
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Delete Course?</h3>
                <p className="text-slate-500 text-sm mt-2">This action cannot be undone. All lessons associated with this course will be removed.</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-md hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteCourse}
                  className="flex-1 px-4 py-2.5 bg-rose-600 border border-rose-700 text-white font-semibold text-sm rounded-md hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setActiveField(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-md flex items-center justify-center text-white">
                    <Video size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {editingCourseId ? 'Edit Course' : 'Create New Course'}
                    </h2>
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Unlimited Content</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveField(null);
                  }}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2.5 text-red-700"
                  >
                    <AlertCircle size={18} />
                    <p className="text-xs font-semibold">{error}</p>
                  </motion.div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Course Name</label>
                      <input 
                        type="text"
                        placeholder="Enter course name"
                        onFocus={() => setActiveField('title')}
                        value={newCourse.title}
                        onChange={(e) => {
                          const nextTitle = e.target.value;
                          const autoSlug = nextTitle
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          const prevAutoSlug = (newCourse.title || '')
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                          setActiveField('title');
                          setNewCourse({
                            ...newCourse,
                            title: nextTitle,
                            slug: (!newCourse.slug || newCourse.slug === prevAutoSlug) ? autoSlug : newCourse.slug
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Course URL Slug</label>
                        <input 
                          type="text"
                          placeholder="e.g. youtube-mastery"
                          onFocus={() => setActiveField('slug')}
                          value={newCourse.slug || ''}
                          onChange={(e) => {
                            setActiveField('slug');
                            setNewCourse({
                              ...newCourse,
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                            });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                        <p className="text-[10px] font-semibold text-indigo-600 truncate">
                          https://thesmartworth.site/courses/{newCourse.slug || 'course-slug'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Worth Category</label>
                        <select
                          value={newCourse.category || 'Creator Worth'}
                          onChange={(e) => {
                            setActiveField('category');
                            setNewCourse({ ...newCourse, category: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        >
                          <option value="Creator Worth">Creator Worth (Content & Creator)</option>
                          <option value="Business Worth">Business Worth (Business & Finance)</option>
                          <option value="Tech Worth">Tech Worth (Tech & Development)</option>
                          <option value="Next Worth">Next Worth (Next & Life)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subcategory</label>
                        <input 
                          type="text"
                          placeholder="e.g. YouTube, AI, Sales"
                          value={newCourse.subcategory || ''}
                          onChange={(e) => setNewCourse({ ...newCourse, subcategory: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instructor (Optional)</label>
                        <input 
                          type="text"
                          placeholder="Instructor Name"
                          value={newCourse.instructor || ''}
                          onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skill Level</label>
                        <select
                          value={newCourse.level || 'All Levels'}
                          onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-xs text-slate-800"
                        >
                          <option value="All Levels">All Levels</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveField('thumbnail_url')}
                      className="space-y-1.5"
                    >
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Course Thumbnail (Upload or Paste URL)</label>
                      <CloudinaryUpload
                        onUploadSuccess={(url) => {
                          setActiveField('thumbnail_url');
                          setNewCourse({ ...newCourse, thumbnail_url: url });
                        }}
                        folder="course_thumbnails"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <input 
                          type="url"
                          placeholder="Or paste direct image URL (https://...)"
                          onFocus={() => setActiveField('thumbnail_url')}
                          value={newCourse.thumbnail_url}
                          onChange={(e) => {
                            setActiveField('thumbnail_url');
                            setNewCourse({ ...newCourse, thumbnail_url: e.target.value });
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                        />
                        {newCourse.thumbnail_url && (
                          <button 
                            type="button"
                            onClick={() => setNewCourse({ ...newCourse, thumbnail_url: '' })}
                            className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveField('detail_thumbnail_url')}
                      className="space-y-1.5"
                    >
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inside Course Banner / Thumbnail (Optional)</label>
                      <CloudinaryUpload
                        onUploadSuccess={(url) => {
                          setActiveField('detail_thumbnail_url');
                          setNewCourse({ ...newCourse, detail_thumbnail_url: url });
                        }}
                        folder="course_banners"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <input 
                          type="url"
                          placeholder="Or paste inside course banner URL (https://...)"
                          onFocus={() => setActiveField('detail_thumbnail_url')}
                          value={newCourse.detail_thumbnail_url || ''}
                          onChange={(e) => {
                            setActiveField('detail_thumbnail_url');
                            setNewCourse({ ...newCourse, detail_thumbnail_url: e.target.value });
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium"
                        />
                        {newCourse.detail_thumbnail_url && (
                          <button 
                            type="button"
                            onClick={() => setNewCourse({ ...newCourse, detail_thumbnail_url: '' })}
                            className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Modules Count / Digit</label>
                        <input 
                          type="text"
                          placeholder="Leave empty or e.g. 9"
                          onFocus={() => setActiveField('digit_lesson')}
                          value={newCourse.digit_lesson}
                          onChange={(e) => {
                            setActiveField('digit_lesson');
                            setNewCourse({ ...newCourse, digit_lesson: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duration Text (Optional)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 12+ Hours"
                          onFocus={() => setActiveField('duration_text')}
                          value={newCourse.duration_text || ''}
                          onChange={(e) => {
                            setActiveField('duration_text');
                            setNewCourse({ ...newCourse, duration_text: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rating (0 = Hidden, or 1-5)</label>
                        <input 
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          onFocus={() => setActiveField('rating')}
                          value={newCourse.rating ?? 0}
                          onChange={(e) => {
                            setActiveField('rating');
                            setNewCourse({ ...newCourse, rating: Number(e.target.value) });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Category Badge</label>
                        <input 
                          type="text"
                          placeholder="e.g. Creator Worth"
                          onFocus={() => setActiveField('category')}
                          value={newCourse.category || ''}
                          onChange={(e) => {
                            setActiveField('category');
                            setNewCourse({ ...newCourse, category: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Certificate Badge (Optional)</label>
                        <input 
                          type="text"
                          placeholder="e.g. Certificate"
                          onFocus={() => setActiveField('certificate_text')}
                          value={newCourse.certificate_text || ''}
                          onChange={(e) => {
                            setActiveField('certificate_text');
                            setNewCourse({ ...newCourse, certificate_text: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Button Text</label>
                        <input 
                          type="text"
                          placeholder="View Modules"
                          onFocus={() => setActiveField('button_text')}
                          value={newCourse.button_text || ''}
                          onChange={(e) => {
                            setActiveField('button_text');
                            setNewCourse({ ...newCourse, button_text: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Course Highlights (Comma separated, Optional)</label>
                      <input 
                        type="text"
                        placeholder="Leave empty to hide, or comma-separated points"
                        onFocus={() => setActiveField('highlights')}
                        value={newCourse.highlights || ''}
                        onChange={(e) => {
                          setActiveField('highlights');
                          setNewCourse({ ...newCourse, highlights: e.target.value });
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {newCourse.description?.length || 0} characters
                        </span>
                      </div>
                      <textarea 
                        placeholder="What is this course about?"
                        onFocus={() => setActiveField('description')}
                        value={newCourse.description}
                        onChange={(e) => {
                          setActiveField('description');
                          setNewCourse({ ...newCourse, description: e.target.value });
                        }}
                        rows={isDescExpanded ? Math.max(14, (newCourse.description || '').split('\n').length + 4) : 4}
                        className={cn(
                          "w-full px-3.5 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium text-sm text-slate-800 leading-relaxed",
                          isDescExpanded
                            ? "min-h-[360px] sm:min-h-[440px] border-indigo-600 shadow-md resize-y"
                            : "h-28 border-slate-300 resize-none"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded((prev) => !prev)}
                        className={cn(
                          "w-full py-2 px-3.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs",
                          isDescExpanded
                            ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {isDescExpanded ? (
                          <>
                            <ChevronUp size={15} className="text-white" />
                            <span>Close Full Description Box (वापस छोटा करें)</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={15} className="text-indigo-600" />
                            <span>Open Full Description Box (पूरा लंबा डिस्क्रिप्शन खोलें)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preview & SEO */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Course Preview</label>
                      <div className="aspect-video rounded-lg bg-slate-50 border border-dashed border-slate-300 overflow-hidden relative group">
                        {newCourse.thumbnail_url ? (
                          <img 
                            src={newCourse.thumbnail_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5">
                            <Video size={28} />
                            <span className="text-xs font-semibold">Thumbnail Preview</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                        <FileText size={14} className="text-indigo-600" />
                        <span>Course Metadata</span>
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Lessons</span>
                          <span className="text-slate-900 font-bold">{newCourse.lessons.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Status</span>
                          <span className="text-emerald-600 font-bold">Active</span>
                        </div>
                        <div className="pt-1 space-y-2">
                          <label htmlFor="show_on_home" className="flex items-center space-x-2.5 bg-white p-3 rounded-md border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              id="show_on_home"
                              checked={newCourse.show_on_home}
                              onChange={(e) => setNewCourse({ ...newCourse, show_on_home: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-xs font-semibold text-slate-800">
                              Show on Home Page
                            </span>
                          </label>
                          <label htmlFor="course_is_indexed" className="flex items-center space-x-2.5 bg-white p-3 rounded-md border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              id="course_is_indexed"
                              checked={newCourse.is_indexed !== false}
                              onChange={(e) => setNewCourse({ ...newCourse, is_indexed: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-xs font-semibold text-slate-800">
                              Index in Google Sitemap (SEO Active)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Course SEO Section */}
                    <div className="border border-slate-200 rounded-lg bg-slate-50/70 p-3.5 space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsSeoExpanded((prev) => !prev)}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                      >
                        <div>
                          <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Google SEO & Course Structured Data
                          </span>
                          <span className="block text-[11px] font-medium text-slate-500">
                            Auto-fills from Course Name & Description if left blank
                          </span>
                        </div>
                        {isSeoExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
                      </button>

                      {isSeoExpanded && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Meta Title</label>
                            <input
                              type="text"
                              value={newCourse.seo_title || ''}
                              onChange={(e) => setNewCourse({ ...newCourse, seo_title: e.target.value })}
                              placeholder={`${newCourse.title || 'Course Title'} | The Smart Worth`}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 outline-none focus:border-indigo-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Meta Description</label>
                            <textarea
                              rows={2}
                              value={newCourse.seo_description || ''}
                              onChange={(e) => setNewCourse({ ...newCourse, seo_description: e.target.value })}
                              placeholder="Custom 150-160 character Google search snippet..."
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 outline-none focus:border-indigo-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Keywords</label>
                            <input
                              type="text"
                              value={newCourse.seo_keywords || ''}
                              onChange={(e) => setNewCourse({ ...newCourse, seo_keywords: e.target.value })}
                              placeholder="youtube course, creator worth, video editing..."
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lessons Management */}
                <div
                  onClick={() => setActiveField('lessons')}
                  className="space-y-4 pt-6 border-t border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                      <Play size={18} className="text-indigo-600" />
                      <span>Lessons & Content</span>
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setCurrentLesson(INITIAL_LESSON_STATE);
                        setEditingLessonIndex(null);
                        setIsLessonDescExpanded(false);
                        setActiveField('lessons');
                        setIsLessonModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-md font-semibold transition-colors text-xs shadow-2xs cursor-pointer"
                    >
                      <Plus size={14} className="text-indigo-600" />
                      <span>Add Lesson</span>
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {newCourse.lessons.length > 0 ? (
                      newCourse.lessons.map((lesson, index) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-md group transition-colors"
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-300">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{lesson.title}</h4>
                              <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                <span className="flex items-center space-x-1">
                                  <Video size={10} />
                                  <span>Part {lesson.part_digit || 'N/A'}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock size={10} />
                                  <span>{lesson.features || 'No Features'}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setCurrentLesson(lesson);
                                setEditingLessonIndex(index);
                                setIsLessonDescExpanded(false);
                                setActiveField('lessons');
                                setIsLessonModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit size={13} className="text-indigo-600" />
                              <span>Edit</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeLesson(index)}
                              className="px-2.5 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} className="text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center border border-dashed border-slate-300 bg-slate-50/50 rounded-md">
                        <p className="text-slate-500 text-xs font-semibold">No lessons added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveField(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveCourse}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{editingCourseId ? 'Update Course' : 'Create Course'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lesson Modal */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLessonModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-md flex items-center justify-center text-white">
                    <Play size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {editingLessonIndex !== null ? 'Edit Lesson' : 'Add New Lesson'}
                    </h3>
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Lesson &amp; Module Details</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar">
                {/* Hidden player for duration detection */}
                <div className="hidden">
                  <Player 
                    ref={lessonPlayerRef}
                    url={sanitizeVideoUrl(stableLessonUrl)}
                    playing={false}
                    muted={true}
                    width="0"
                    height="0"
                    playsinline
                    onReady={() => {
                      if (lessonPlayerRef.current) {
                        try {
                          const d = lessonPlayerRef.current.getDuration();
                          if (d && (!currentLesson.features || currentLesson.features === '00:00')) {
                            setCurrentLesson(prev => ({ ...prev, features: formatDuration(d) }));
                          }
                        } catch (e) {}
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lesson Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Introduction to Design"
                    value={currentLesson.title}
                    onChange={(e) => {
                      setActiveField('lessons');
                      setCurrentLesson({ ...currentLesson, title: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Video Link</label>
                    <button 
                      type="button"
                      onClick={fetchYouTubeInfo}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-indigo-600 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                    >
                      Auto Detect Info
                    </button>
                  </div>
                  <input 
                    type="text"
                    placeholder="YouTube/Vimeo Video URL"
                    value={currentLesson.video_url}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, video_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Part Digit (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 01 or MODULE 1"
                      value={currentLesson.part_digit}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, part_digit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duration (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 12:45"
                      value={currentLesson.features}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, features: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Module / Lesson Description (Optional)</label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {(currentLesson.description || '').length} characters
                    </span>
                  </div>
                  <textarea 
                    placeholder="Description of this module..."
                    value={currentLesson.description || ''}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                    rows={isLessonDescExpanded ? Math.max(12, (currentLesson.description || '').split('\n').length + 4) : 4}
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium text-sm text-slate-800 leading-relaxed",
                      isLessonDescExpanded
                        ? "min-h-[300px] sm:min-h-[360px] border-indigo-600 shadow-md resize-y"
                        : "h-28 border-slate-300 resize-none"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLessonDescExpanded((prev) => !prev)}
                    className={cn(
                      "w-full py-2 px-3.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs",
                      isLessonDescExpanded
                        ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    )}
                  >
                    {isLessonDescExpanded ? (
                      <>
                        <ChevronUp size={15} className="text-white" />
                        <span>Close Full Description Box (वापस छोटा करें)</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={15} className="text-indigo-600" />
                        <span>Open Full Description Box (पूरा लंबा खोलें)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleAddLesson}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-md text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  {editingLessonIndex !== null ? 'Update Lesson' : 'Add Lesson'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

