import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { setCachedEbooks, getEbookSeoPath } from '../../lib/packageUtils';
import LoadingScreen from '../../components/LoadingScreen';

interface ChapterItem {
  id: string;
  title: string;
  summary?: string;
}

interface EbookRecord {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  description: string;
  cover_image_url: string;
  pdf_url?: string;
  category: string;
  subcategory?: string;
  package_id?: string | null;
  author?: string;
  chapters: ChapterItem[];
  learning_outcomes: string[];
  related_course_ids: string[];
  related_package_ids: string[];
  tags: string[];
  status: string;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  og_image?: string;
  is_indexed?: boolean;
  published_at?: string;
  updated_at?: string;
  created_at?: string;
}

const INITIAL_EBOOK_STATE = {
  title: '',
  slug: '',
  short_description: '',
  description: '',
  cover_image_url: '',
  pdf_url: '',
  category: 'Creator Worth',
  subcategory: '',
  package_id: '',
  author: '',
  chapters: [] as ChapterItem[],
  learning_outcomes_text: '',
  related_course_ids: [] as string[],
  related_package_ids: [] as string[],
  tags_text: '',
  status: 'published',
  is_active: true,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  canonical_url: '',
  og_image: '',
  is_indexed: true
};

export default function EbookManagement() {
  const [ebooks, setEbooks] = useState<EbookRecord[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_EBOOK_STATE);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);
  const [chapterTitleInput, setChapterTitleInput] = useState('');
  const [chapterSummaryInput, setChapterSummaryInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ebooksRes, coursesRes, packagesRes] = await Promise.all([
        invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'ebooks',
          query: { order: { column: 'created_at', ascending: false } }
        }).catch(() => []),
        invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'courses',
          query: { select: 'id, title, category' }
        }).catch(() => []),
        invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'packages',
          query: { select: 'id, name, category' }
        }).catch(() => [])
      ]);

      const ebookList = Array.isArray(ebooksRes) ? ebooksRes : [];
      setEbooks(ebookList);
      setCachedEbooks(ebookList);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setPackages(Array.isArray(packagesRes) ? packagesRes : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load E-books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const onFastReload = () => fetchAllData();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(INITIAL_EBOOK_STATE);
    setIsDescExpanded(false);
    setIsSeoExpanded(false);
    setChapterTitleInput('');
    setChapterSummaryInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ebook: EbookRecord) => {
    const autoSlug = (ebook.slug || ebook.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setEditingId(ebook.id);
    setFormData({
      title: ebook.title || '',
      slug: autoSlug,
      short_description: ebook.short_description || '',
      description: ebook.description || '',
      cover_image_url: ebook.cover_image_url || '',
      pdf_url: ebook.pdf_url || '',
      category: ebook.category || 'Creator Worth',
      subcategory: ebook.subcategory || '',
      package_id: ebook.package_id || '',
      author: ebook.author || '',
      chapters: Array.isArray(ebook.chapters) ? ebook.chapters : [],
      learning_outcomes_text: Array.isArray(ebook.learning_outcomes)
        ? ebook.learning_outcomes.join('\n')
        : '',
      related_course_ids: Array.isArray(ebook.related_course_ids) ? ebook.related_course_ids : [],
      related_package_ids: Array.isArray(ebook.related_package_ids) ? ebook.related_package_ids : [],
      tags_text: Array.isArray(ebook.tags) ? ebook.tags.join(', ') : '',
      status: ebook.status || 'published',
      is_active: ebook.is_active !== false,
      seo_title: ebook.seo_title || '',
      seo_description: ebook.seo_description || '',
      seo_keywords: ebook.seo_keywords || '',
      canonical_url: ebook.canonical_url || '',
      og_image: ebook.og_image || '',
      is_indexed: ebook.is_indexed !== false
    });
    setIsDescExpanded(false);
    setIsSeoExpanded(false);
    setIsModalOpen(true);
  };

  const handleAddChapter = () => {
    if (!chapterTitleInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          id: `ch-${Date.now()}-${prev.chapters.length + 1}`,
          title: chapterTitleInput.trim(),
          summary: chapterSummaryInput.trim()
        }
      ]
    }));
    setChapterTitleInput('');
    setChapterSummaryInput('');
  };

  const handleRemoveChapter = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('E-book Title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const computedSlug = (formData.slug || formData.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const learningOutcomes = formData.learning_outcomes_text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    const tags = formData.tags_text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payloadData = {
      title: formData.title.trim(),
      slug: computedSlug,
      short_description: formData.short_description.trim(),
      description: formData.description.trim(),
      cover_image_url: formData.cover_image_url.trim(),
      pdf_url: formData.pdf_url.trim(),
      category: formData.category || 'Creator Worth',
      subcategory: formData.subcategory.trim(),
      package_id: formData.package_id || null,
      author: formData.author.trim(),
      chapters: formData.chapters,
      learning_outcomes: learningOutcomes,
      related_course_ids: formData.related_course_ids,
      related_package_ids: formData.related_package_ids,
      tags,
      status: formData.status || 'published',
      is_active: formData.is_active !== false,
      seo_title: formData.seo_title.trim(),
      seo_description: formData.seo_description.trim(),
      seo_keywords: formData.seo_keywords.trim(),
      canonical_url: formData.canonical_url.trim(),
      og_image: formData.og_image.trim(),
      is_indexed: formData.is_indexed !== false,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        await invokeAdminFunction('admin-action', {
          action: 'update',
          table: 'ebooks',
          payload: { id: editingId, data: payloadData }
        });
        setSuccess('E-book updated successfully!');
      } else {
        await invokeAdminFunction('admin-action', {
          action: 'insert',
          table: 'ebooks',
          payload: {
            ...payloadData,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        });
        setSuccess('E-book created successfully!');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_EBOOK_STATE);
      await fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to save E-book');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invokeAdminFunction('admin-action', {
        action: 'delete',
        table: 'ebooks',
        payload: { id }
      });
      setDeleteConfirmId(null);
      setSuccess('E-book deleted successfully!');
      await fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete E-book');
    } finally {
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const filteredEbooks = ebooks.filter((eb) => {
    const q = searchQuery.toLowerCase();
    return (
      (eb.title || '').toLowerCase().includes(q) ||
      (eb.category || '').toLowerCase().includes(q) ||
      (eb.subcategory || '').toLowerCase().includes(q) ||
      (eb.slug || '').toLowerCase().includes(q)
    );
  });

  if (loading && ebooks.length === 0) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2">
            <BookOpen size={12} />
            <span>SEO Digital Library</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">E-Book Management</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Create and manage SEO-indexed E-books across Creator Worth, Business Worth, Tech Worth, and Next Worth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAllData}
            className="p-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Refresh E-Books"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 border border-indigo-700 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New E-Book</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search E-books by title, category, or slug..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
        />
      </div>

      {/* E-Books Grid */}
      {filteredEbooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No E-Books Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create your first E-book to automatically publish its dedicated SEO page, Book structured data, and sitemap entry.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Create First E-Book</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEbooks.map((ebook) => {
            const seoUrl = getEbookSeoPath(ebook);
            return (
              <div
                key={ebook.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden border-b border-slate-100">
                  {ebook.cover_image_url ? (
                    <img
                      src={optimizeCloudinaryUrl(ebook.cover_image_url, 600, 360)}
                      alt={ebook.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <BookOpen size={32} />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-[10px] font-bold uppercase tracking-wider">
                      {ebook.category || 'Creator Worth'}
                    </span>
                    {ebook.subcategory && (
                      <span className="px-2 py-1 rounded-md bg-indigo-600/90 text-white text-[10px] font-semibold">
                        {ebook.subcategory}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        ebook.is_active !== false && ebook.status !== 'draft'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      )}
                    >
                      {ebook.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{ebook.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {ebook.short_description || ebook.description || 'No description provided.'}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{Array.isArray(ebook.chapters) ? ebook.chapters.length : 0} Chapters</span>
                      <a
                        href={seoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-indigo-600 hover:underline font-semibold"
                      >
                        <span>{seoUrl}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ebook)}
                      className="flex-1 py-2 px-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit size={13} className="text-indigo-600" />
                      <span>Edit E-Book</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(ebook.id)}
                      className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                      title="Delete E-Book"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete E-Book?</h3>
              <p className="text-xs text-slate-500">
                This will remove the E-book and its public SEO page from the catalog.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 px-3 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2 px-3 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit E-Book Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-indigo-600 text-white rounded-md flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {editingId ? 'Edit E-Book' : 'Create New E-Book'}
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Public SEO Book Page & Package Resource
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      E-Book Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const nextTitle = e.target.value;
                        const autoSlug = nextTitle
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        const prevAutoSlug = (formData.title || '')
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setFormData({
                          ...formData,
                          title: nextTitle,
                          slug: (!formData.slug || formData.slug === prevAutoSlug) ? autoSlug : formData.slug
                        });
                      }}
                      placeholder="e.g. YouTube Script Writing Blueprint"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      SEO URL Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        })
                      }
                      placeholder="e.g. youtube-script-writing-blueprint"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    />
                    <p className="text-[10px] font-semibold text-indigo-600 truncate">
                      https://thesmartworth.site/ebooks/{formData.slug || 'ebook-slug'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Primary Worth Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    >
                      <option value="Creator Worth">Creator Worth (Content & Creator)</option>
                      <option value="Business Worth">Business Worth (Business & Finance)</option>
                      <option value="Tech Worth">Tech Worth (Tech & Development)</option>
                      <option value="Next Worth">Next Worth (Next & Life)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="e.g. YouTube, Content Creation, Finance"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Primary Parent Package (Optional)
                    </label>
                    <select
                      value={formData.package_id}
                      onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    >
                      <option value="">-- Match by Worth Category automatically --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Author (Optional — Leave empty if none)
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="e.g. The Smart Worth Editorial"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>

                {/* Cover Image & PDF URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Cover Image (Upload or Paste URL)
                    </label>
                    <CloudinaryUpload
                      onUploadSuccess={(url) => setFormData({ ...formData, cover_image_url: url })}
                      folder="ebook_covers"
                    />
                    <input
                      type="url"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-indigo-600 outline-none mt-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      E-Book Read / Download URL (Optional, for enrolled users)
                    </label>
                    <input
                      type="url"
                      value={formData.pdf_url}
                      onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                      placeholder="https://... (PDF or Google Drive / Reader link)"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                    />
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Short Summary (1-2 lines for Cards & Meta Fallback)
                      </label>
                      <input
                        type="text"
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        placeholder="Concise summary of what this E-book teaches..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Description with Expand Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Full Description
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formData.description.length} characters
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={isDescExpanded ? 14 : 4}
                    placeholder="Detailed E-book overview, who it is for, and key takeaways..."
                    className={cn(
                      'w-full px-3.5 py-2.5 bg-white border rounded-md text-sm font-medium text-slate-800 outline-none transition-all leading-relaxed',
                      isDescExpanded
                        ? 'min-h-[320px] border-indigo-600 shadow-md resize-y'
                        : 'border-slate-300 resize-none'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded((prev) => !prev)}
                    className={cn(
                      'w-full py-2 px-3.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs',
                      isDescExpanded
                        ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    )}
                  >
                    {isDescExpanded ? (
                      <>
                        <ChevronUp size={15} />
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

                {/* Chapters Builder */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chapters / Topics Covered ({formData.chapters.length})
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={chapterTitleInput}
                      onChange={(e) => setChapterTitleInput(e.target.value)}
                      placeholder="Chapter Title (e.g. Chapter 1: Hook Mastery)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      value={chapterSummaryInput}
                      onChange={(e) => setChapterSummaryInput(e.target.value)}
                      placeholder="Short topic summary (optional)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="py-2 px-3 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Add Chapter</span>
                    </button>
                  </div>

                  {formData.chapters.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {formData.chapters.map((ch, idx) => (
                        <div
                          key={ch.id || idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-md text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {idx + 1}. {ch.title}
                            </span>
                            {ch.summary && <p className="text-slate-500 text-[11px] mt-0.5">{ch.summary}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChapter(idx)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Learning Outcomes & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Learning Outcomes (One per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.learning_outcomes_text}
                      onChange={(e) => setFormData({ ...formData, learning_outcomes_text: e.target.value })}
                      placeholder="Write viral hooks&#10;Structure 10-minute videos&#10;Increase audience retention"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tags (Comma separated)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.tags_text}
                      onChange={(e) => setFormData({ ...formData, tags_text: e.target.value })}
                      placeholder="YouTube, Script Writing, Content Creation"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Related Courses Selector */}
                {courses.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Related Courses (Internal SEO Linking)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      {courses.map((course) => {
                        const isChecked = formData.related_course_ids.includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...formData.related_course_ids, course.id]
                                  : formData.related_course_ids.filter((id) => id !== course.id);
                                setFormData({ ...formData, related_course_ids: next });
                              }}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                            <span className="truncate">{course.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collapsible SEO Overrides */}
                <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsSeoExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Google SEO & Book Structured Data Settings
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Automatically generates Book schema & OpenGraph tags from Title/Description if left blank
                      </span>
                    </div>
                    {isSeoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isSeoExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Title</label>
                        <input
                          type="text"
                          value={formData.seo_title}
                          onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                          placeholder={`${formData.title || 'E-Book Title'} | The Smart Worth`}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Keywords</label>
                        <input
                          type="text"
                          value={formData.seo_keywords}
                          onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                          placeholder="creator worth ebook, youtube script writing..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">SEO Meta Description</label>
                        <textarea
                          rows={2}
                          value={formData.seo_description}
                          onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                          placeholder="Custom 150-160 character description for Google search results..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div className="flex items-center space-x-4 pt-1">
                        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span>Active on Public Website</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_indexed}
                            onChange={(e) => setFormData({ ...formData, is_indexed: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span>Include in Google Sitemap</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-indigo-600 border border-indigo-700 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{saving ? 'Saving...' : editingId ? 'Update E-Book' : 'Create E-Book'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
