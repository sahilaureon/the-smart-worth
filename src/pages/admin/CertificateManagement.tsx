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
  Copy,
  ToggleLeft,
  ToggleRight,
  Eye,
  Sliders,
  Sparkles,
  Download,
  Layers,
  Palette,
  Check
} from 'lucide-react';
import { invokeAdminFunction } from '../../lib/supabase';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import LoadingScreen from '../../components/LoadingScreen';
import CertificateVisualDesigner from '../../components/admin/CertificateVisualDesigner';
import { CertificateTemplate, CertificateUserData } from '../../types/certificate';
import {
  DEFAULT_MASTER_TEMPLATE,
  ALTERNATE_CLASSIC_LIGHT_TEMPLATE,
  SAMPLE_CERTIFICATE_USER_DATA
} from '../../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  downloadCertificateAsPng,
  downloadCertificateAsPdf
} from '../../lib/certificateEngine';

interface SiteSettings {
  certificate_template: string;
  certificate_designs: string;
  certificate_positions?: string;
  certificate_custom_template?: string; // Active template JSON
  certificate_templates_list?: string; // Array of all templates JSON
}

export default function CertificateManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    certificate_template: '',
    certificate_designs: '[]',
    certificate_positions: '{}',
    certificate_custom_template: '',
    certificate_templates_list: '[]'
  });

  // Designer modal state
  const [designingTemplate, setDesigningTemplate] = useState<CertificateTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusToast({ type, message });
    setTimeout(() => {
      setStatusToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Parse template list
  const templatesList: CertificateTemplate[] = React.useMemo(() => {
    try {
      const parsed = JSON.parse(siteSettings.certificate_templates_list || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}

    // Fallback to built-in templates
    return [DEFAULT_MASTER_TEMPLATE, ALTERNATE_CLASSIC_LIGHT_TEMPLATE];
  }, [siteSettings.certificate_templates_list]);

  // Determine active default template
  const activeTemplateId = React.useMemo(() => {
    try {
      if (siteSettings.certificate_custom_template) {
        const parsed = JSON.parse(siteSettings.certificate_custom_template);
        if (parsed?.id) return parsed.id;
      }
    } catch {}

    const foundDefault = templatesList.find((t) => t.is_default);
    return foundDefault ? foundDefault.id : DEFAULT_MASTER_TEMPLATE.id;
  }, [siteSettings.certificate_custom_template, templatesList]);

  useEffect(() => {
    fetchSettings();
    const onFastReload = () => fetchSettings();
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  // Live render preview canvas when previewTemplate changes
  useEffect(() => {
    if (!previewTemplate || !previewCanvasRef.current) return;
    renderCertificateToCanvas(previewCanvasRef.current, previewTemplate, SAMPLE_CERTIFICATE_USER_DATA, { scale: 1 }).catch(
      (err) => console.error('Canvas preview render error:', err)
    );
  }, [previewTemplate]);

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

        // Initialize default templates if not yet stored
        let tList = settings.certificate_templates_list;
        let cTemplate = settings.certificate_custom_template;

        if (!tList) {
          tList = JSON.stringify([DEFAULT_MASTER_TEMPLATE, ALTERNATE_CLASSIC_LIGHT_TEMPLATE]);
        }
        if (!cTemplate) {
          cTemplate = JSON.stringify(DEFAULT_MASTER_TEMPLATE);
        }

        setSiteSettings({
          certificate_template: settings.certificate_template || '',
          certificate_designs: settings.certificate_designs || '[]',
          certificate_positions: settings.certificate_positions || '{}',
          certificate_custom_template: cTemplate,
          certificate_templates_list: tList
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllSettings = async (updatedSettings: SiteSettings, customSuccessMsg?: string) => {
    setSiteSettings(updatedSettings);
    try {
      setSaving(true);
      const settingsToUpdate = [
        {
          key: 'certificate_template',
          value: updatedSettings.certificate_template || '',
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_designs',
          value: updatedSettings.certificate_designs || '[]',
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_positions',
          value: updatedSettings.certificate_positions || '{}',
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_custom_template',
          value: updatedSettings.certificate_custom_template || JSON.stringify(DEFAULT_MASTER_TEMPLATE),
          updated_at: new Date().toISOString()
        },
        {
          key: 'certificate_templates_list',
          value: updatedSettings.certificate_templates_list || '[]',
          updated_at: new Date().toISOString()
        }
      ];

      await invokeAdminFunction('admin-action', {
        action: 'upsert',
        table: 'site_settings',
        payload: settingsToUpdate,
        onConflict: 'key'
      });

      showToast(customSuccessMsg || 'Certificate settings saved successfully!', 'success');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save template from visual designer
  const handleSaveFromDesigner = async (updatedTemplate: CertificateTemplate) => {
    // 1. Update in templates list
    let updatedList = [...templatesList];
    const existingIndex = updatedList.findIndex((t) => t.id === updatedTemplate.id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = updatedTemplate;
    } else {
      updatedList.push(updatedTemplate);
    }

    // 2. If it is active or default, update active template
    const isNowActive = updatedTemplate.is_default || updatedTemplate.id === activeTemplateId;

    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList),
      certificate_custom_template: isNowActive ? JSON.stringify(updatedTemplate) : siteSettings.certificate_custom_template
    };

    await handleSaveAllSettings(newSettings, `Template "${updatedTemplate.name}" saved!`);
    setDesigningTemplate(null);
  };

  const handleSetActiveTemplate = async (templateToActivate: CertificateTemplate) => {
    const updatedList = templatesList.map((t) => ({
      ...t,
      is_default: t.id === templateToActivate.id
    }));

    const activated = { ...templateToActivate, is_default: true, is_enabled: true };

    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_custom_template: JSON.stringify(activated),
      certificate_templates_list: JSON.stringify(updatedList)
    };

    await handleSaveAllSettings(newSettings, `"${templateToActivate.name}" set as active default!`);
  };

  const handleDuplicateTemplate = async (sourceTemplate: CertificateTemplate) => {
    const newId = `custom-tpl-${Date.now()}`;
    const duplicated: CertificateTemplate = {
      ...JSON.parse(JSON.stringify(sourceTemplate)),
      id: newId,
      name: `${sourceTemplate.name} (Copy)`,
      is_default: false,
      is_enabled: true
    };

    const updatedList = [...templatesList, duplicated];
    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList)
    };

    await handleSaveAllSettings(newSettings, `Template "${duplicated.name}" duplicated!`);
  };

  const handleToggleTemplateEnabled = async (tplId: string) => {
    const updatedList = templatesList.map((t) =>
      t.id === tplId ? { ...t, is_enabled: !t.is_enabled } : t
    );

    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList)
    };

    await handleSaveAllSettings(newSettings, 'Template status updated');
  };

  const handleDeleteTemplate = async (tplId: string) => {
    if (tplId === DEFAULT_MASTER_TEMPLATE.id) {
      alert('The core default master template cannot be deleted.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this template?')) return;

    const updatedList = templatesList.filter((t) => t.id !== tplId);
    let nextActive = siteSettings.certificate_custom_template;

    if (activeTemplateId === tplId) {
      nextActive = JSON.stringify(updatedList[0] || DEFAULT_MASTER_TEMPLATE);
    }

    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList),
      certificate_custom_template: nextActive
    };

    await handleSaveAllSettings(newSettings, 'Template deleted');
  };

  const handleCreateNewTemplate = () => {
    const newTpl: CertificateTemplate = {
      ...JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE)),
      id: `custom-cert-${Date.now()}`,
      name: `New Custom Certificate ${templatesList.length + 1}`,
      is_default: false,
      is_enabled: true
    };
    setDesigningTemplate(newTpl);
  };

  // Upload custom background image template
  const handleUploadBgTemplate = (url: string) => {
    const newTpl: CertificateTemplate = {
      ...JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE)),
      id: `uploaded-bg-${Date.now()}`,
      name: `Custom Uploaded Design ${templatesList.length + 1}`,
      is_default: false,
      is_enabled: true,
      theme: {
        ...DEFAULT_MASTER_TEMPLATE.theme,
        background_type: 'image',
        background_image: url,
        show_outer_border: false,
        show_inner_border: false,
        show_corner_decorations: false
      }
    };

    const updatedList = [...templatesList, newTpl];
    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList)
    };

    handleSaveAllSettings(newSettings, 'New custom certificate uploaded!');
    setDesigningTemplate(newTpl);
  };

  if (loading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {statusToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            statusToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusToast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{statusToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Visual System 2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">1200×850 Dynamic Canvas</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <span>Certificate Designer &amp; Templates</span>
            <Sparkles size={20} className="text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Visually customize every element of the completion certificate — typography, positions, student DP avatar, gold seal, QR verification code, and custom data fields without editing code.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 shadow-sm transition-colors cursor-pointer shrink-0"
            title="Reload Settings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Templates List & Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Available Certificate Templates
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Students will receive the active default template upon course completion.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {templatesList.length} Templates
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {templatesList.map((tpl) => {
                  const isActive = tpl.id === activeTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      className={`relative group rounded-2xl overflow-hidden border-2 transition-all bg-slate-950 flex flex-col ${
                        isActive
                          ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Visual Header Thumbnail */}
                      <div className="relative w-full aspect-[1200/850] overflow-hidden bg-slate-950 flex items-center justify-center p-3 border-b border-slate-800">
                        {/* Gradient Representation */}
                        <div
                          className="w-full h-full rounded-lg border border-slate-800 flex flex-col items-center justify-center p-4 relative text-center overflow-hidden"
                          style={{
                            background:
                              tpl.theme.background_type === 'classic_light'
                                ? 'linear-gradient(135deg, #FBFBFC, #F1F5F9)'
                                : tpl.theme.background_type === 'royal_purple'
                                ? 'linear-gradient(135deg, #1E1B4B, #311042)'
                                : 'linear-gradient(135deg, #070B1E, #0E1738)'
                          }}
                        >
                          {/* Inner mini borders */}
                          {tpl.theme.show_outer_border && (
                            <div
                              className="absolute inset-1.5 border"
                              style={{ borderColor: tpl.theme.outer_border_color }}
                            />
                          )}

                          <span
                            className="text-[9px] font-extrabold uppercase tracking-widest"
                            style={{
                              color: tpl.theme.background_type === 'classic_light' ? '#0F172A' : '#FDE68A'
                            }}
                          >
                            THE SMART WORTH
                          </span>
                          <span
                            className="text-[13px] font-black uppercase tracking-wider mt-0.5"
                            style={{
                              color: tpl.theme.background_type === 'classic_light' ? '#1E3A8A' : '#F1C40F'
                            }}
                          >
                            CERTIFICATE
                          </span>
                          <span
                            className="text-[10px] italic font-serif"
                            style={{
                              color: tpl.theme.background_type === 'classic_light' ? '#475569' : '#CBD5E1'
                            }}
                          >
                            of completion
                          </span>

                          {/* Mini QR and Seal hints */}
                          <div className="absolute bottom-2 left-2 w-5 h-5 bg-white/90 rounded border border-amber-400 text-[6px] text-slate-900 font-bold flex items-center justify-center">
                            QR
                          </div>
                          <div className="absolute bottom-2 right-2 w-5 h-5 bg-amber-500 rounded-full text-[6px] text-white font-black flex items-center justify-center">
                            TSW
                          </div>
                        </div>

                        {/* Top-Right Badges */}
                        <div className="absolute top-2.5 right-2.5 z-20 flex items-center space-x-1.5">
                          {isActive && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Info & Details */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate">{tpl.name}</h4>
                            <span className="text-[10px] font-mono text-slate-500">
                              {tpl.elements?.length || 0} fields
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {tpl.description || 'Custom certificate design with dynamic student placeholders.'}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setDesigningTemplate(tpl)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Visual Designer</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => handleSetActiveTemplate(tpl)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                                title="Set as default active certificate"
                              >
                                Set Active
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleDuplicateTemplate(tpl)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Duplicate template"
                            >
                              <Copy size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewTemplate(tpl)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Full live preview"
                            >
                              <Eye size={13} />
                            </button>

                            {tpl.id !== DEFAULT_MASTER_TEMPLATE.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/80 transition-colors cursor-pointer"
                                title="Delete template"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Custom Design & Quick Guide */}
        <div className="space-y-6">
          {/* Upload Custom Design */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <ImageIcon size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Upload Background Design
                </h3>
                <p className="text-[10px] text-slate-400">Add an external certificate layout image</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a blank certificate template (PNG/JPG).
                <br />
                <strong className="text-slate-200">Recommended Size: 1200×850 pixels.</strong>
              </p>

              <CloudinaryUpload
                onUploadSuccess={(url) => handleUploadBgTemplate(url)}
                folder="certificates"
              />
            </div>
          </div>

          {/* Quick Architecture Guide */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-xl text-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-amber-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                Dynamic Placeholders Supported
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a user generates their completion certificate, the following tags automatically bind to their authenticated account data:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{full_name}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{course_name}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{package_name}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{email}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{completion_date}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{tsw_id}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{profile_image}}'}
              </span>
              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                {'{{cert_id}}'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Designer Modal */}
      {designingTemplate && (
        <CertificateVisualDesigner
          initialTemplate={designingTemplate}
          onSave={handleSaveFromDesigner}
          onClose={() => setDesigningTemplate(null)}
        />
      )}

      {/* Full Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye size={18} className="text-indigo-400" />
                  <span>Preview: {previewTemplate.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Rendered with sample student profile data and dynamic QR verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full aspect-[1200/850] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
              <canvas ref={previewCanvasRef} className="w-full h-full object-contain" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Resolution: 1200×850 (Rendered at 100% vector fidelity)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => downloadCertificateAsPng(previewTemplate, SAMPLE_CERTIFICATE_USER_DATA)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Sample PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadCertificateAsPdf(previewTemplate, SAMPLE_CERTIFICATE_USER_DATA)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Sample PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
