import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Edit3,
  X,
  RefreshCw,
  UserSquare2
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import LoadingScreen from '../../components/LoadingScreen';

interface DpPosition {
  x: number;
  y: number;
  size?: number;
  shape?: 'circle' | 'square';
}

interface TemplatePositions {
  name: { x: number; y: number };
  course: { x: number; y: number };
  dp: DpPosition;
}

interface SiteSettings {
  certificate_template: string;
  certificate_designs: string;
  certificate_positions?: string; // JSON.stringify({ [url]: { name: {x,y}, course: {x,y}, dp: {x,y,size,shape} } })
}

const DEFAULT_POSITIONS: TemplatePositions = {
  name: { x: 600, y: 440 },
  course: { x: 600, y: 595 },
  dp: { x: 138, y: 182, size: 120, shape: 'circle' }
};

export default function CertificateManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    certificate_template: '',
    certificate_designs: '[]',
    certificate_positions: '{}'
  });
  const [editingTemplate, setEditingTemplate] = useState<{
    url: string;
    name: { x: number; y: number };
    course: { x: number; y: number };
    dp: DpPosition;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusToast({ type, message });
    setTimeout(() => {
      setStatusToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const certificatePositions = React.useMemo(() => {
    try {
      return JSON.parse(siteSettings.certificate_positions || '{}');
    } catch (e) {
      return {};
    }
  }, [siteSettings.certificate_positions]);

  const certificateDesigns: string[] = React.useMemo(() => {
    try {
      const parsed = JSON.parse(siteSettings.certificate_designs || '[]');
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }, [siteSettings.certificate_designs]);

  useEffect(() => {
    fetchSettings();
    const onFastReload = () => fetchSettings();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'site_settings',
        query: {}
      });

      if (data && Array.isArray(data)) {
        const settings: any = {};
        data.forEach((item) => {
          if (item && item.key) {
            settings[item.key] = item.value;
          }
        });

        setSiteSettings({
          certificate_template: settings.certificate_template || '',
          certificate_designs: settings.certificate_designs || '[]',
          certificate_positions: settings.certificate_positions || '{}'
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedSettings: SiteSettings, customSuccessMsg?: string) => {
    setSiteSettings(updatedSettings);
    try {
      setSaving(true);
      const settingsToUpdate = [
        {
          key: 'certificate_template',
          value: updatedSettings.certificate_template,
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_designs',
          value: updatedSettings.certificate_designs,
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_positions',
          value: updatedSettings.certificate_positions || '{}',
          updated_at: new Date().toISOString()
        }
      ];

      await invokeAdminFunction('admin-action', {
        action: 'upsert',
        table: 'site_settings',
        payload: settingsToUpdate,
        onConflict: 'key'
      });

      showToast(customSuccessMsg || 'Certificate settings updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const addCertificateDesign = (url: string) => {
    const updatedDesigns = [...certificateDesigns, url];
    const nextPrimary = siteSettings.certificate_template || url;
    const newSettings = {
      ...siteSettings,
      certificate_template: nextPrimary,
      certificate_designs: JSON.stringify(updatedDesigns)
    };
    handleSave(newSettings, 'New certificate template added!');
  };

  const removeCertificateDesign = async (url: string, indexToRemove: number) => {
    setDeletingIndex(indexToRemove);
    try {
      const updatedDesigns = certificateDesigns.filter((_, idx) => idx !== indexToRemove);
      const updatedPositions = { ...certificatePositions };
      if (!updatedDesigns.includes(url)) {
        delete updatedPositions[url];
      }

      const nextPrimary =
        siteSettings.certificate_template === url
          ? updatedDesigns[0] || ''
          : siteSettings.certificate_template;

      const newSettings: SiteSettings = {
        ...siteSettings,
        certificate_designs: JSON.stringify(updatedDesigns),
        certificate_template: nextPrimary,
        certificate_positions: JSON.stringify(updatedPositions)
      };
      await handleSave(newSettings, 'Certificate template deleted successfully!');
    } finally {
      setDeletingIndex(null);
    }
  };

  const setPrimaryTemplate = (url: string) => {
    const newSettings = { ...siteSettings, certificate_template: url };
    handleSave(newSettings, 'Active certificate template updated!');
  };

  const openEditor = (url: string) => {
    const existing = certificatePositions[url] || {};
    setEditingTemplate({
      url,
      name: existing.name || DEFAULT_POSITIONS.name,
      course: existing.course || DEFAULT_POSITIONS.course,
      dp: {
        x: existing.dp?.x ?? DEFAULT_POSITIONS.dp.x,
        y: existing.dp?.y ?? DEFAULT_POSITIONS.dp.y,
        size: existing.dp?.size ?? DEFAULT_POSITIONS.dp.size ?? 120,
        shape: existing.dp?.shape ?? 'circle'
      }
    });
  };

  const savePositions = (
    namePos: { x: number; y: number },
    coursePos: { x: number; y: number },
    dpPos: DpPosition
  ) => {
    if (!editingTemplate) return;

    const updatedPositions = {
      ...certificatePositions,
      [editingTemplate.url]: {
        name: namePos,
        course: coursePos,
        dp: dpPos
      }
    };

    const newSettings = {
      ...siteSettings,
      certificate_positions: JSON.stringify(updatedPositions)
    };

    handleSave(newSettings, 'Name, Course & User DP (1:1) positions saved!');
    setEditingTemplate(null);
  };

  if (loading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {statusToast && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between shadow-sm transition-all ${
            statusToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusToast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{statusToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Certificate Templates</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage designs and set coordinates for Full Name, Course Name, and User DP (1:1).
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Reload Certificate Templates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-md border border-slate-200">
            <Award size={14} />
            <span>Canvas 1200×850 • 1:1 DP Enabled</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-slate-100 text-slate-700 border border-slate-200 rounded-md flex items-center justify-center">
                  <ImageIcon size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Design Gallery
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {certificateDesigns.length} Templates
              </span>
            </div>

            <div className="p-5">
              {certificateDesigns.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
                  <Award size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    No templates uploaded yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {certificateDesigns.map((design, idx) => {
                    const isActive = siteSettings.certificate_template === design;
                    const isDeleting = deletingIndex === idx;
                    return (
                      <div
                        key={`${design}-${idx}`}
                        className={`relative group rounded-lg overflow-hidden border transition-all bg-slate-50 flex flex-col ${
                          isActive
                            ? 'border-slate-900 ring-2 ring-slate-900/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative w-full aspect-[1.414/1] overflow-hidden bg-slate-100">
                          <img
                            src={design}
                            alt={`Design ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Desktop Hover Quick Actions */}
                          <div className="hidden sm:flex absolute inset-0 z-10 bg-black/50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex-col items-center justify-center space-y-2.5 p-4">
                            <button
                              type="button"
                              onClick={() => openEditor(design)}
                              className="bg-white text-slate-900 border border-slate-300 px-4 py-2 rounded-md font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                            >
                              Set Name, Course & DP (1:1)
                            </button>

                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => setPrimaryTemplate(design)}
                                className="bg-slate-900 text-white border border-slate-950 px-4 py-2 rounded-md font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                              >
                                Set as Active Template
                              </button>
                            ) : (
                              <div className="bg-emerald-600 text-white border border-emerald-700 px-4 py-2 rounded-md font-semibold text-xs flex items-center space-x-1.5 shadow-sm">
                                <CheckCircle2 size={14} />
                                <span>Active Design</span>
                              </div>
                            )}
                          </div>

                          {/* Top-Right Badges & Delete Button */}
                          <div className="absolute top-2.5 right-2.5 z-30 flex items-center space-x-1.5">
                            {isActive && (
                              <div
                                className="bg-emerald-600 text-white p-1.5 rounded-md shadow-sm border border-emerald-700"
                                title="Active Template"
                              >
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={isDeleting || saving}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeCertificateDesign(design, idx);
                              }}
                              className="bg-red-600 text-white p-1.5 rounded-md shadow-sm hover:bg-red-700 transition-colors border border-red-700 disabled:opacity-60 cursor-pointer"
                              title="Delete Template"
                            >
                              {isDeleting ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action Strip */}
                        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => setPrimaryTemplate(design)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-300 hover:border-slate-900 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Set Active
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditor(design)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 size={12} /> Positions & DP
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isDeleting || saving}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeCertificateDesign(design, idx);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Plus size={16} className="text-slate-700" />
              <span>Add Template</span>
            </h3>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload a blank certificate design (PNG/JPG).
                <br />
                <strong className="text-slate-800">Recommended Size: 1200×850 pixels.</strong>
              </p>

              <CloudinaryUpload
                onUploadSuccess={(url) => addCertificateDesign(url)}
                folder="certificates"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm text-white space-y-2.5">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Positioning Guide</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click <strong>Positions &amp; DP</strong> on any template to place the{' '}
              <strong>Full Name</strong>, <strong>Course Name</strong>, and{' '}
              <strong>User DP (1:1)</strong> anywhere on the certificate.
            </p>
          </div>
        </div>
      </div>

      {editingTemplate && (
        <TemplateCoordinateEditor
          imageUrl={editingTemplate.url}
          initialNamePos={editingTemplate.name}
          initialCoursePos={editingTemplate.course}
          initialDpPos={editingTemplate.dp}
          onSave={savePositions}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

interface EditorProps {
  imageUrl: string;
  initialNamePos: { x: number; y: number };
  initialCoursePos: { x: number; y: number };
  initialDpPos: DpPosition;
  onSave: (
    name: { x: number; y: number },
    course: { x: number; y: number },
    dp: DpPosition
  ) => void;
  onCancel: () => void;
}

function TemplateCoordinateEditor({
  imageUrl,
  initialNamePos,
  initialCoursePos,
  initialDpPos,
  onSave,
  onCancel
}: EditorProps) {
  const [namePos, setNamePos] = useState(initialNamePos);
  const [coursePos, setCoursePos] = useState(initialCoursePos);
  const [dpPos, setDpPos] = useState<DpPosition>({
    x: initialDpPos?.x ?? 138,
    y: initialDpPos?.y ?? 182,
    size: initialDpPos?.size ?? 120,
    shape: initialDpPos?.shape ?? 'circle'
  });
  const [activeMode, setActiveMode] = useState<'name' | 'course' | 'dp'>('dp');
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();

    // Calculate coordinates relative to canonical 1200x850 canvas
    const xRatio = 1200 / rect.width;
    const yRatio = 850 / rect.height;

    const clickX = Math.max(0, Math.min(1200, Math.round((e.clientX - rect.left) * xRatio)));
    const clickY = Math.max(0, Math.min(850, Math.round((e.clientY - rect.top) * yRatio)));

    if (activeMode === 'name') {
      setNamePos({ x: clickX, y: clickY });
    } else if (activeMode === 'course') {
      setCoursePos({ x: clickX, y: clickY });
    } else {
      setDpPos((prev) => ({ ...prev, x: clickX, y: clickY }));
    }
  };

  const dpSize = dpPos.size ?? 120;
  const dpShape = dpPos.shape ?? 'circle';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xl flex flex-col max-h-[94vh]">
        {/* Header & Mode Selector */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
                Positioning Editor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an element below and tap on the certificate to set its exact location.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3-Tab Switcher: Name | Course | User DP (1:1) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('name')}
              className={`px-3 py-2 rounded font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'name'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span>Set Name Position</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('course')}
              className={`px-3 py-2 rounded font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'course'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Set Course Position</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('dp')}
              className={`px-3 py-2 rounded font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'dp'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Set User DP (1:1)</span>
            </button>
          </div>

          {/* Extra 1:1 DP Controls when User DP mode is active */}
          {activeMode === 'dp' && (
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <UserSquare2 size={15} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  User DP (1:1 Ratio) Settings:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* 1:1 Size Slider */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Size (1:1): <strong className="text-slate-900">{dpSize}px</strong>
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={240}
                    step={4}
                    value={dpSize}
                    onChange={(e) =>
                      setDpPos((prev) => ({ ...prev, size: Number(e.target.value) }))
                    }
                    className="w-24 sm:w-32 accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Shape Toggle: 1:1 Circle vs 1:1 Square */}
                <div className="inline-flex bg-white rounded border border-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDpPos((prev) => ({ ...prev, shape: 'circle' }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      dpShape === 'circle'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1:1 Circle
                  </button>
                  <button
                    type="button"
                    onClick={() => setDpPos((prev) => ({ ...prev, shape: 'square' }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      dpShape === 'square'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1:1 Square
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Certificate Canvas Preview */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
          <div
            className="relative cursor-crosshair group shadow-lg rounded-md overflow-hidden border-2 border-white select-none"
            onClick={handleClick}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Template"
              className="max-w-full h-auto block select-none pointer-events-none"
            />

            {/* 1:1 User DP Visual Box/Circle Marker */}
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-400 bg-emerald-500/25 shadow-lg pointer-events-none transition-all duration-150 flex flex-col items-center justify-center aspect-square ${
                dpShape === 'circle' ? 'rounded-full' : 'rounded-md'
              } ${activeMode === 'dp' ? 'ring-2 ring-white' : 'opacity-90'}`}
              style={{
                left: `${(dpPos.x / 1200) * 100}%`,
                top: `${(dpPos.y / 850) * 100}%`,
                width: `${(dpSize / 1200) * 100}%`
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow" />
              <div className="absolute -bottom-6 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap uppercase tracking-wider">
                USER DP (1:1)
              </div>
            </div>

            {/* Full Name Marker */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-150 flex items-center justify-center"
              style={{
                left: `${(namePos.x / 1200) * 100}%`,
                top: `${(namePos.y / 850) * 100}%`
              }}
            >
              <div className="absolute top-6 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-wider">
                Full Name
              </div>
            </div>

            {/* Course Name Marker */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-amber-500 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-150 flex items-center justify-center"
              style={{
                left: `${(coursePos.x / 1200) * 100}%`,
                top: `${(coursePos.y / 850) * 100}%`
              }}
            >
              <div className="absolute top-6 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-wider">
                Course Name
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="text-[11px] font-mono text-slate-500">
            DP (1:1): {dpPos.x},{dpPos.y} ({dpSize}px) • NAME: {namePos.x},{namePos.y} • COURSE:{' '}
            {coursePos.x},{coursePos.y}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-xs rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel Changes
            </button>
            <button
              type="button"
              onClick={() => onSave(namePos, coursePos, dpPos)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer"
            >
              Save Positions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
