import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import LoadingScreen from '../../components/LoadingScreen';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import CleanPackageImage from '../../components/CleanPackageImage';
import { setCachedPackages } from '../../lib/packageUtils';

const INITIAL_PACKAGE_STATE = {
  name: '',
  slug: '',
  category: 'Creator Worth',
  short_description: '',
  price: 0,
  original_price: 0,
  offer_price: 0,
  discount_label: '',
  enrolled_count_text: '',
  button_text: 'Buy Now',
  badge_text: '',
  certificate_text: '',
  thumbnail_url: '',
  detail_thumbnail_url: '',
  duration_text: '',
  perfect_for: '',
  rating: 0,
  status: 'active',
  users: 0,
  revenue: 0,
  description: '',
  gst: 0,
  features: '',
  courses: [] as string[],
  books: '' as string | string[],
  ebook_ids: [] as string[],
  tags: '',
  is_featured: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  canonical_url: '',
  og_title: '',
  og_description: '',
  og_image: '',
  is_indexed: true
};

export default function PackageManagement() {
  const [packages, setPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState(INITIAL_PACKAGE_STATE);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allEbooks, setAllEbooks] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [selectedPreviewPkg, setSelectedPreviewPkg] = useState<any | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'packages',
        query: { order: { column: 'created_at', ascending: false } }
      });
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      setCachedPackages(list);
      if (list.length > 0 && !selectedPreviewPkg) {
        setSelectedPreviewPkg(list[0]);
      }
      setError(null);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'courses',
        query: {
          select: 'id, title, is_active, digit_lesson, lessons',
          order: { column: 'title', ascending: true }
        }
      });
      setAllCourses(Array.isArray(data) ? data.filter((c) => c.is_active !== false) : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAllEbooks = async () => {
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'ebooks',
        query: { order: { column: 'created_at', ascending: false } }
      });
      setAllEbooks(Array.isArray(data) ? data.filter((e) => e.is_active !== false) : []);
    } catch {}
  };

  useEffect(() => {
    fetchPackages();
    fetchAllCourses();
    fetchAllEbooks();
    const onFastReload = () => {
      fetchPackages();
      fetchAllCourses();
      fetchAllEbooks();
    };
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const handleDelete = async () => {
    if (!packageToDelete) return;
    try {
      await invokeAdminFunction('admin-action', {
        action: 'delete',
        table: 'packages',
        payload: { id: packageToDelete }
      });
      setSuccess('Package deleted successfully!');
      setIsDeleteModalOpen(false);
      setPackageToDelete(null);
      setError(null);
      fetchPackages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting package:', err);
      setError(`Error deleting package: ${err.message}`);
    }
  };

  const confirmDelete = (id: string) => {
    setPackageToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const pkg = newPackage as any;
      const computedSlug = (pkg.slug || pkg.name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const packageData = {
        ...pkg,
        slug: computedSlug,
        category: (pkg.category || 'Creator Worth').trim(),
        short_description: (pkg.short_description || '').trim(),
        price: Number(pkg.offer_price || pkg.price || 0),
        original_price: Number(pkg.original_price || 0),
        offer_price: Number(pkg.offer_price || pkg.price || 0),
        rating: Number(pkg.rating || 0),
        gst: Number(pkg.gst || 0),
        thumbnail_url: (pkg.thumbnail_url || '').trim(),
        detail_thumbnail_url: (pkg.detail_thumbnail_url || '').trim(),
        banner_url: (pkg.detail_thumbnail_url || '').trim(),
        duration_text: (pkg.duration_text || '').trim(),
        certificate_text: (pkg.certificate_text || '').trim(),
        perfect_for: (pkg.perfect_for || '').trim(),
        features:
          typeof pkg.features === 'string'
            ? pkg.features
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : pkg.features,
        courses: Array.isArray(pkg.courses)
          ? pkg.courses
          : typeof pkg.courses === 'string'
            ? pkg.courses
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        books:
          typeof pkg.books === 'string'
            ? pkg.books
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : pkg.books,
        ebook_ids: Array.isArray(pkg.ebook_ids) ? pkg.ebook_ids : [],
        tags:
          typeof pkg.tags === 'string'
            ? pkg.tags
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : Array.isArray(pkg.tags)
              ? pkg.tags
              : [],
        is_featured: Boolean(pkg.is_featured),
        seo_title: (pkg.seo_title || '').trim(),
        seo_description: (pkg.seo_description || '').trim(),
        seo_keywords: (pkg.seo_keywords || '').trim(),
        canonical_url: (pkg.canonical_url || '').trim(),
        og_title: (pkg.og_title || '').trim(),
        og_description: (pkg.og_description || '').trim(),
        og_image: (pkg.og_image || '').trim(),
        is_indexed: pkg.is_indexed !== false
      };

      const { users, revenue, status, ...dataToSave } = packageData;
      const payload: any = {
        ...dataToSave,
        is_active: pkg.status === 'active'
      };

      if (editingPackageId) {
        await invokeAdminFunction('admin-action', {
          action: 'update',
          table: 'packages',
          payload: { id: editingPackageId, data: payload }
        });
        setSuccess('Package updated successfully!');
      } else {
        const id = computedSlug || `pkg-${Math.random().toString(36).substring(2, 9)}`;

        await invokeAdminFunction('admin-action', {
          action: 'insert',
          table: 'packages',
          payload: { ...payload, id }
        });
        setSuccess('Package created successfully!');
      }
      await fetchPackages();
      setTimeout(() => setSuccess(null), 5000);
      closeModal();
    } catch (err: any) {
      console.error('Error saving package:', err);
      setError(`Error saving package: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (pkg: any) => {
    const autoSlug = (pkg.slug || pkg.name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setNewPackage({
      name: pkg.name || '',
      slug: autoSlug,
      category: pkg.category || 'Creator Worth',
      short_description: pkg.short_description || '',
      price: pkg.price || 0,
      original_price: pkg.original_price || 0,
      offer_price: pkg.offer_price || pkg.price || 0,
      discount_label: pkg.discount_label || '',
      enrolled_count_text: pkg.enrolled_count_text || '',
      button_text: pkg.button_text || 'Buy Now',
      badge_text: pkg.badge_text || '',
      certificate_text: pkg.certificate_text || '',
      thumbnail_url: pkg.thumbnail_url || '',
      detail_thumbnail_url: pkg.detail_thumbnail_url || pkg.banner_url || '',
      duration_text: pkg.duration_text || '',
      perfect_for: Array.isArray(pkg.perfect_for)
        ? pkg.perfect_for.join(', ')
        : pkg.perfect_for || '',
      rating: Number(pkg.rating || 0),
      status: pkg.status || (pkg.is_active === false ? 'inactive' : 'active'),
      users: pkg.users || 0,
      revenue: pkg.revenue || 0,
      description: pkg.description || '',
      gst: pkg.gst || 0,
      features: Array.isArray(pkg.features) ? pkg.features.join(', ') : pkg.features || '',
      courses: Array.isArray(pkg.courses) ? pkg.courses : [],
      books: Array.isArray(pkg.books) ? pkg.books.join(', ') : pkg.books || '',
      ebook_ids: Array.isArray(pkg.ebook_ids) ? pkg.ebook_ids : [],
      tags: Array.isArray(pkg.tags) ? pkg.tags.join(', ') : pkg.tags || '',
      is_featured: Boolean(pkg.is_featured),
      seo_title: pkg.seo_title || '',
      seo_description: pkg.seo_description || '',
      seo_keywords: pkg.seo_keywords || '',
      canonical_url: pkg.canonical_url || '',
      og_title: pkg.og_title || '',
      og_description: pkg.og_description || '',
      og_image: pkg.og_image || '',
      is_indexed: pkg.is_indexed !== false
    });
    setEditingPackageId(pkg.id);
    setActiveField('name');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackageId(null);
    setActiveField(null);
    setError(null);
    setNewPackage(INITIAL_PACKAGE_STATE);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-emerald-700">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Package Management</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Control Outer Card &amp; Inside Package Thumbnails
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchPackages();
              fetchAllCourses();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Reload Packages"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-indigo-600', loading && 'animate-spin')} />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingPackageId(null);
              setNewPackage(INITIAL_PACKAGE_STATE);
              setActiveField('name');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-md font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create New Package</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Package?</h3>
              <p className="text-slate-500 font-bold mb-8">
                Are you sure you want to delete this package? This action cannot be undone.
              </p>
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
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 border border-rose-700 text-white font-semibold text-sm rounded-md hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#615DFA] flex items-center justify-center text-white shadow-lg shadow-[#615DFA]/20">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingPackageId ? 'Edit Package' : 'New Package'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Package Configuration &amp; Thumbnails
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 bg-white hover:bg-slate-100 rounded-md transition-colors border border-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar"
            >
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center space-x-3 text-rose-700 mb-6">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              {/* DEDICATED THUMBNAILS SECTION: OUTER CARD + INSIDE PACKAGE */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <ImageIcon className="w-4 h-4 text-[#615DFA]" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Package Thumbnails (Outer Card &amp; Inside Package Details)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1. Outer Card Thumbnail */}
                  <div
                    onClick={() => setActiveField('thumbnail_url')}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        1. Outer Card Thumbnail (3D Box / Main Card)
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Yeh image Home aur Packages page ke bahar card par dikhegi.
                      </p>
                    </div>

                    <CloudinaryUpload
                      onUploadSuccess={(url) => {
                        setActiveField('thumbnail_url');
                        setNewPackage((prev) => ({ ...prev, thumbnail_url: url }));
                      }}
                      folder="package_thumbnails"
                      allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Or Paste Direct Image URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          required
                          onFocus={() => setActiveField('thumbnail_url')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-xs text-slate-800"
                          value={newPackage.thumbnail_url}
                          onChange={(e) => {
                            setActiveField('thumbnail_url');
                            setNewPackage({ ...newPackage, thumbnail_url: e.target.value });
                          }}
                          placeholder="https://i.postimg.cc/.../box-image.png"
                        />
                        {newPackage.thumbnail_url && (
                          <button
                            type="button"
                            onClick={() => setNewPackage({ ...newPackage, thumbnail_url: '' })}
                            className="p-2 bg-white text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 cursor-pointer shrink-0"
                            title="Clear Outer Thumbnail"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {newPackage.thumbnail_url && (
                      <div className="rounded-md overflow-hidden border border-slate-200 aspect-[4/3] w-36 bg-white flex items-center justify-center p-2 mx-auto">
                        <CleanPackageImage
                          src={newPackage.thumbnail_url}
                          mode="box"
                          alt="Outer Card Preview"
                          className="w-full h-full object-contain"
                          onCleanedDataUrl={(cleaned) =>
                            setNewPackage((prev) => ({ ...prev, thumbnail_url: cleaned }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Inside Package Thumbnail / Banner */}
                  <div
                    onClick={() => setActiveField('detail_thumbnail_url')}
                    className="bg-white border border-slate-300 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Inside Package Banner
                      </span>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        2. Package Ke Andar Wala Thumbnail (16:9)
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Yeh thumbnail package ke andar (Buy Now button ke neeche) dikhega.
                      </p>
                    </div>

                    <CloudinaryUpload
                      onUploadSuccess={(url) => {
                        setActiveField('detail_thumbnail_url');
                        setNewPackage((prev) => ({ ...prev, detail_thumbnail_url: url }));
                      }}
                      folder="package_banners"
                      allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Or Paste Inside Thumbnail URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          onFocus={() => setActiveField('detail_thumbnail_url')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-xs text-slate-800"
                          value={newPackage.detail_thumbnail_url}
                          onChange={(e) => {
                            setActiveField('detail_thumbnail_url');
                            setNewPackage({ ...newPackage, detail_thumbnail_url: e.target.value });
                          }}
                          placeholder="https://i.postimg.cc/.../inside-banner.png"
                        />
                        {newPackage.detail_thumbnail_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewPackage({ ...newPackage, detail_thumbnail_url: '' })
                            }
                            className="p-2 bg-white text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 cursor-pointer shrink-0"
                            title="Clear Inside Thumbnail"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {(newPackage.detail_thumbnail_url || newPackage.thumbnail_url) && (
                      <div className="rounded-md overflow-hidden border border-slate-200 w-full bg-white flex items-center justify-center">
                        <CleanPackageImage
                          src={newPackage.detail_thumbnail_url || newPackage.thumbnail_url}
                          mode="banner"
                          alt="Inside Package Preview"
                          className="w-full h-auto object-contain block"
                          onCleanedDataUrl={(cleaned) => {
                            if (newPackage.detail_thumbnail_url) {
                              setNewPackage((prev) => ({ ...prev, detail_thumbnail_url: cleaned }));
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Package Name (e.g. Creator Worth)
                  </label>
                  <input
                    type="text"
                    required
                    onFocus={() => setActiveField('name')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveField('name');
                      const autoSlug = val
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      setNewPackage((prev) => ({
                        ...prev,
                        name: val,
                        slug:
                          !prev.slug ||
                          prev.slug ===
                            prev.name
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-+|-+$/g, '')
                            ? autoSlug
                            : prev.slug
                      }));
                    }}
                    placeholder="e.g. Creator Worth"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Primary Worth Category
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={(newPackage as any).category || 'Creator Worth'}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, category: e.target.value } as any)
                    }
                  >
                    <option value="Creator Worth">Creator Worth (Content &amp; Creator)</option>
                    <option value="Business Worth">Business Worth (Business &amp; Finance)</option>
                    <option value="Tech Worth">Tech Worth (Tech &amp; Development)</option>
                    <option value="Next Worth">Next Worth (Next &amp; Life)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Public SEO Slug (URL)
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      https://thesmartworth.site/{(newPackage as any).slug || 'package-slug'}/
                    </span>
                  </div>
                  <input
                    type="text"
                    onFocus={() => setActiveField('slug')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={(newPackage as any).slug || ''}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, '-')
                      } as any)
                    }
                    placeholder="e.g. creator-worth"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Original Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    required
                    inputMode="numeric"
                    onFocus={() => setActiveField('original_price')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.original_price}
                    onChange={(e) => {
                      setActiveField('original_price');
                      setNewPackage({ ...newPackage, original_price: Number(e.target.value) });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Offer / Coupon Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    inputMode="numeric"
                    onFocus={() => setActiveField('offer_price')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.offer_price}
                    onChange={(e) => {
                      setActiveField('offer_price');
                      setNewPackage({
                        ...newPackage,
                        offer_price: Number(e.target.value),
                        price: Number(e.target.value)
                      });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Discount Label (e.g. 70% OFF)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('discount_label')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.discount_label}
                    onChange={(e) => {
                      setActiveField('discount_label');
                      setNewPackage({ ...newPackage, discount_label: e.target.value });
                    }}
                    placeholder="70% OFF"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Duration Text (e.g. 20+ Hours)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('duration_text')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.duration_text}
                    onChange={(e) => {
                      setActiveField('duration_text');
                      setNewPackage({ ...newPackage, duration_text: e.target.value });
                    }}
                    placeholder="Auto-calculated or e.g. 20+ Hours"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Button Text
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('button_text')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.button_text}
                    onChange={(e) => {
                      setActiveField('button_text');
                      setNewPackage({ ...newPackage, button_text: e.target.value });
                    }}
                    placeholder="Buy Now"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('badge_text')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.badge_text}
                    onChange={(e) => {
                      setActiveField('badge_text');
                      setNewPackage({ ...newPackage, badge_text: e.target.value });
                    }}
                    placeholder="Leave empty to hide, or e.g. ELITE"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Certificate Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('certificate_text')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={(newPackage as any).certificate_text || ''}
                    onChange={(e) => {
                      setActiveField('certificate_text');
                      setNewPackage({ ...newPackage, certificate_text: e.target.value } as any);
                    }}
                    placeholder="Leave empty to hide, or e.g. Certificate"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Short Summary (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={(newPackage as any).short_description || ''}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, short_description: e.target.value } as any)
                    }
                    placeholder="1-sentence summary for cards & SEO fallback"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Package Description
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {newPackage.description?.length || 0} characters
                    </span>
                  </div>
                  <textarea
                    onFocus={() => setActiveField('description')}
                    rows={isDescExpanded ? Math.max(14, (newPackage.description || '').split('\n').length + 4) : 4}
                    className={cn(
                      'w-full px-3.5 py-2.5 bg-white border rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800 leading-relaxed transition-all',
                      isDescExpanded
                        ? 'min-h-[360px] sm:min-h-[440px] border-indigo-600 shadow-md resize-y'
                        : 'h-28 border-slate-300 resize-none'
                    )}
                    value={newPackage.description}
                    onChange={(e) => {
                      setActiveField('description');
                      setNewPackage({ ...newPackage, description: e.target.value });
                    }}
                    placeholder="Brief description of the package..."
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rating (0 = Hidden, or 1-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    inputMode="decimal"
                    onFocus={() => setActiveField('rating')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.rating}
                    onChange={(e) => {
                      setActiveField('rating');
                      setNewPackage({ ...newPackage, rating: Number(e.target.value) });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Status (Publish / Unpublish)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.status}
                    onChange={(e) => setNewPackage({ ...newPackage, status: e.target.value })}
                  >
                    <option value="active">Active (Published)</option>
                    <option value="inactive">Inactive (Unpublished)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Extra Package Includes / Features (Comma separated)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('features')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.features}
                    onChange={(e) => {
                      setActiveField('features');
                      setNewPackage({ ...newPackage, features: e.target.value });
                    }}
                    placeholder="e.g. Live Q&A Support, Community Access"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Perfect For Checklist (Comma separated)
                  </label>
                  <input
                    type="text"
                    onFocus={() => setActiveField('perfect_for')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={newPackage.perfect_for}
                    onChange={(e) => {
                      setActiveField('perfect_for');
                      setNewPackage({ ...newPackage, perfect_for: e.target.value });
                    }}
                    placeholder="Students, Freelancers, Content Creators, Working Professionals, Aspiring Entrepreneurs"
                  />
                </div>

                <div
                  onClick={() => setActiveField('courses')}
                  className="md:col-span-2 space-y-1.5"
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Courses Included in This Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-md border border-slate-300">
                    {Array.isArray(allCourses) &&
                      allCourses.map((course) => (
                        <label
                          key={course.id}
                          className="flex items-center space-x-3 p-2 bg-white hover:bg-slate-50 rounded-md cursor-pointer transition-colors border border-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={newPackage.courses.includes(course.id)}
                            onChange={(e) => {
                              setActiveField('courses');
                              const updatedCourses = e.target.checked
                                ? [...newPackage.courses, course.id]
                                : newPackage.courses.filter((id) => id !== course.id);
                              setNewPackage({ ...newPackage, courses: updatedCourses });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {course.title}
                          </span>
                        </label>
                      ))}
                    {allCourses.length === 0 && (
                      <p className="text-xs text-slate-400 p-2 italic">No courses created yet.</p>
                    )}
                  </div>
                </div>

                {/* E-Books Included in This Package */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    E-Books Included in This Package
                  </label>
                  {allEbooks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-md border border-slate-300 mb-2">
                      {allEbooks.map((eb) => {
                        const checked = Array.isArray((newPackage as any).ebook_ids)
                          ? (newPackage as any).ebook_ids.includes(eb.id)
                          : false;
                        return (
                          <label
                            key={eb.id}
                            className="flex items-center space-x-3 p-2 bg-white hover:bg-slate-50 rounded-md cursor-pointer transition-colors border border-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = Array.isArray((newPackage as any).ebook_ids)
                                  ? (newPackage as any).ebook_ids
                                  : [];
                                const updated = e.target.checked
                                  ? [...current, eb.id]
                                  : current.filter((id: string) => id !== eb.id);
                                setNewPackage({ ...newPackage, ebook_ids: updated } as any);
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {eb.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors font-medium text-sm text-slate-800"
                    value={
                      Array.isArray(newPackage.books)
                        ? newPackage.books.join(', ')
                        : (newPackage.books as string) || ''
                    }
                    onChange={(e) => setNewPackage({ ...newPackage, books: e.target.value })}
                    placeholder="Additional E-Book Titles (comma separated, optional)"
                  />
                </div>

                {/* Collapsible SEO & Google Structured Data Configuration */}
                <div className="md:col-span-2 border border-slate-200 rounded-xl bg-slate-50/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsSeoExpanded((prev) => !prev)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-white hover:bg-slate-50 border-b border-slate-200 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        SEO, Open Graph &amp; Google Search Settings (Auto-generated if left blank)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Customize SEO Title, Meta Description, Canonical URL, OpenGraph &amp; Indexing
                      </p>
                    </div>
                    {isSeoExpanded ? (
                      <ChevronUp size={16} className="text-slate-600 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-600 shrink-0" />
                    )}
                  </button>

                  {isSeoExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          SEO Title (Optional Override)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).seo_title || ''}
                          onChange={(e) =>
                            setNewPackage({ ...newPackage, seo_title: e.target.value } as any)
                          }
                          placeholder={`${newPackage.name || 'Package Name'} | The Smart Worth`}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          SEO Meta Description (Optional Override)
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).seo_description || ''}
                          onChange={(e) =>
                            setNewPackage({ ...newPackage, seo_description: e.target.value } as any)
                          }
                          placeholder="Automatically uses Package Description if left empty"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          SEO Keywords / Tags (Comma separated)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).seo_keywords || ''}
                          onChange={(e) =>
                            setNewPackage({ ...newPackage, seo_keywords: e.target.value } as any)
                          }
                          placeholder="e.g. creator worth, content creation, digital skills"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Canonical URL (Optional Override)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).canonical_url || ''}
                          onChange={(e) =>
                            setNewPackage({ ...newPackage, canonical_url: e.target.value } as any)
                          }
                          placeholder={`https://thesmartworth.site/${(newPackage as any).slug || 'creator-worth'}/`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Open Graph Image URL (Optional Override)
                        </label>
                        <input
                          type="url"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).og_image || ''}
                          onChange={(e) =>
                            setNewPackage({ ...newPackage, og_image: e.target.value } as any)
                          }
                          placeholder="Defaults to Package Thumbnail URL"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Google Indexing Control
                        </label>
                        <select
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-medium text-sm text-slate-800"
                          value={(newPackage as any).is_indexed !== false ? 'index' : 'noindex'}
                          onChange={(e) =>
                            setNewPackage({
                              ...newPackage,
                              is_indexed: e.target.value === 'index'
                            } as any)
                          }
                        >
                          <option value="index">Index, Follow (Include in Google &amp; Sitemap)</option>
                          <option value="noindex">NoIndex (Hide from Google &amp; Sitemap)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 flex space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-md hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 border border-indigo-700 text-white font-semibold text-sm rounded-md hover:bg-indigo-700 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingPackageId ? (
                    'Save Changes'
                  ) : (
                    'Create Package'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 rounded-2xl bg-[#615DFA]/10 text-[#615DFA] w-fit mb-4">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Packages</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{packages.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Now</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {packages.filter((p) => p.status === 'active' || p.is_active !== false).length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 rounded-2xl bg-[#615DFA]/5 text-[#615DFA] w-fit mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Subscribers</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {packages.reduce((acc, p) => acc + (p.users || 0), 0)}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {formatCurrency(packages.reduce((acc, p) => acc + (p.revenue || 0), 0))}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search packages..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#615DFA]/20 outline-none w-full shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Package &amp; Thumbnails
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Pricing
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Rating
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Performance
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20">
                    <LoadingScreen fullScreen={false} />
                  </td>
                </tr>
              ) : !Array.isArray(filteredPackages) || filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Package size={32} />
                    </div>
                    <p className="text-slate-500 font-bold">No packages found.</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3.5">
                          {/* Outer Card Thumbnail */}
                          <div
                            className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs bg-white flex items-center justify-center"
                            title="Outer Card Thumbnail"
                          >
                            <CleanPackageImage
                              src={pkg.thumbnail_url}
                              mode="box"
                              alt={pkg.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Inside Package Thumbnail Preview */}
                          <div
                            className="w-20 h-12 rounded-lg overflow-hidden border border-[#615DFA]/30 shrink-0 shadow-2xs bg-white flex items-center justify-center relative"
                            title="Inside Package Thumbnail (Details Page)"
                          >
                            <CleanPackageImage
                              src={
                                pkg.detail_thumbnail_url ||
                                pkg.banner_url ||
                                pkg.thumbnail_url
                              }
                              mode="banner"
                              alt={`${pkg.name} Inside`}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div>
                            <p className="font-black text-slate-900 leading-tight">{pkg.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              ID: {String(pkg.id).slice(0, 12)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-[#615DFA]">
                            {formatCurrency(pkg.offer_price || pkg.price)}
                          </p>
                          {pkg.original_price > 0 && (
                            <p className="text-[10px] font-bold text-slate-400 line-through">
                              {formatCurrency(pkg.original_price)}
                            </p>
                          )}
                          {pkg.discount_label && (
                            <p className="text-[10px] font-black text-red-500 uppercase">
                              {pkg.discount_label}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-1">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'text-sm',
                                  i < Math.floor(pkg.rating || 0) ? 'fill-current' : 'text-slate-200'
                                )}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-black text-slate-900 ml-1">
                            {pkg.rating || '4.8'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Users className="w-3 h-3 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600">
                              {pkg.enrolled_count_text || pkg.users || 0} Users
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <p className="text-xs font-black text-emerald-600">
                              {formatCurrency(pkg.revenue || 0)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
                            pkg.status === 'active' || pkg.is_active !== false
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {pkg.status === 'active' || pkg.is_active !== false ? (
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1.5" />
                          )}
                          {pkg.status || (pkg.is_active === false ? 'inactive' : 'active')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(pkg)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                            title="Edit Package"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(pkg.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-300 rounded-md hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                            title="Delete Package"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

