import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Move,
  Type,
  Palette,
  Layout,
  Maximize2,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sliders,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  QrCode,
  Award,
  ShieldCheck,
  X
} from 'lucide-react';
import { CertificateTemplate, CertificateElement, CertificateUserData } from '../../types/certificate';
import { SAMPLE_CERTIFICATE_USER_DATA, DEFAULT_MASTER_TEMPLATE } from '../../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  downloadCertificateAsPng,
  downloadCertificateAsPdf
} from '../../lib/certificateEngine';

interface CertificateVisualDesignerProps {
  initialTemplate: CertificateTemplate;
  onSave: (updatedTemplate: CertificateTemplate) => Promise<void>;
  onClose?: () => void;
}

export default function CertificateVisualDesigner({
  initialTemplate,
  onSave,
  onClose
}: CertificateVisualDesignerProps) {
  const [template, setTemplate] = useState<CertificateTemplate>(() => {
    return JSON.parse(JSON.stringify(initialTemplate || DEFAULT_MASTER_TEMPLATE));
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>('user-full-name');
  const [previewMode, setPreviewMode] = useState<boolean>(true);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75); // Scaled view for editor
  const [activeTab, setActiveTab] = useState<'element' | 'theme' | 'fields'>('element');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number } | null>(null);

  // New Custom Field Modal state
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldText, setNewFieldText] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'shape'>('text');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize initialTemplate
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(JSON.parse(JSON.stringify(initialTemplate)));
    }
  }, [initialTemplate]);

  // Re-render canvas whenever template or preview mode changes
  useEffect(() => {
    if (!canvasRef.current) return;
    renderCertificateToCanvas(canvasRef.current, template, SAMPLE_CERTIFICATE_USER_DATA, { scale: 1 }).catch(
      (err) => console.error('Canvas render error in designer:', err)
    );
  }, [template, previewMode]);

  const selectedElement = template.elements.find((el) => el.id === selectedElementId) || null;

  const updateSelectedElement = (partial: Partial<CertificateElement>) => {
    if (!selectedElementId) return;
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...partial } : el
      )
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 850 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked element (prioritize visible elements)
    let foundId: string | null = null;
    for (let i = template.elements.length - 1; i >= 0; i--) {
      const el = template.elements[i];
      if (!el.visible) continue;

      const w = el.width || (el.font_size ? el.font_size * 5 : 80);
      const h = el.height || (el.font_size ? el.font_size * 1.5 : 30);
      const minX = el.x - w / 2;
      const maxX = el.x + w / 2;
      const minY = el.y - h / 2;
      const maxY = el.y + h / 2;

      if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
        foundId = el.id;
        break;
      }
    }

    if (foundId) {
      setSelectedElementId(foundId);
      setActiveTab('element');
    }
  };

  // Mouse Drag handler for direct visual movement on canvas
  const handleMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedElementId(elId);
    setActiveTab('element');
    const el = template.elements.find((item) => item.id === elId);
    if (!el) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elX: el.x,
      elY: el.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !selectedElementId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / 1200;

    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;

    // Boundary constraints: keep within 20px to 1180px
    const newX = Math.round(Math.max(30, Math.min(1170, dragStart.elX + dx)));
    const newY = Math.round(Math.max(30, Math.min(820, dragStart.elY + dy)));

    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((item) =>
        item.id === selectedElementId ? { ...item, x: newX, y: newY } : item
      )
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleSaveDesign = async () => {
    try {
      setIsSaving(true);
      await onSave(template);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this certificate design to The Smart Worth default masterpiece layout?')) {
      setTemplate(JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE)));
      setSelectedElementId('user-full-name');
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const id = `custom-${Date.now()}`;
    const fieldKey = newFieldKey.trim() || newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const defaultVal = newFieldText.trim() || `{{${fieldKey}}}`;

    const newElement: CertificateElement = {
      id,
      type: newFieldType,
      field_key: fieldKey,
      label: newFieldLabel.trim(),
      default_text: defaultVal,
      x: 600,
      y: 660,
      font_family: 'Montserrat',
      font_size: 14,
      font_weight: '600',
      font_style: 'normal',
      color: '#FFFFFF',
      text_align: 'center',
      visible: true,
      is_custom: true
    };

    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));

    setSelectedElementId(id);
    setActiveTab('element');
    setShowCustomFieldModal(false);
    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldText('');
  };

  const handleDeleteElement = (id: string) => {
    if (window.confirm('Delete this element from the certificate?')) {
      setTemplate((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== id)
      }));
      setSelectedElementId(null);
    }
  };

  const insertPlaceholder = (tag: string) => {
    if (!selectedElement) return;
    const current = selectedElement.default_text || '';
    updateSelectedElement({ default_text: `${current} ${tag}`.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header & Actions Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            TSW
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Certificate Designer</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                {template.name}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Drag elements on canvas or adjust properties in the right inspector.
            </p>
          </div>
        </div>

        {/* Center Canvas Zoom Controls */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
            className="p-1 hover:text-white text-slate-400 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.2, z + 0.1))}
            className="p-1 hover:text-white text-slate-400 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <div className="w-px h-3 bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              showGuidelines ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Grid
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
            title="Restore Masterpiece Template"
          >
            <RotateCcw size={13} />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={() => downloadCertificateAsPng(template, SAMPLE_CERTIFICATE_USER_DATA)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
            title="Download Preview PNG"
          >
            <Download size={13} />
            <span>Test PNG</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDesign}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Sliders size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? 'Saving...' : 'Save Design'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Designer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Body: Canvas on Left/Center, Inspector on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Workspace */}
        <div className="flex-1 overflow-auto bg-slate-950 p-6 flex items-center justify-center relative">
          {saveSuccess && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <CheckCircle2 size={15} />
              <span>Certificate Design Saved Successfully!</span>
            </div>
          )}

          {/* Canvas Wrapper with exact 1200 x 850 aspect ratio */}
          <div
            ref={containerRef}
            style={{
              width: `${1200 * zoomLevel}px`,
              height: `${850 * zoomLevel}px`
            }}
            onClick={handleCanvasClick}
            className="relative shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 transition-all cursor-crosshair shrink-0"
          >
            {/* The Actual HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-full pointer-events-none block"
            />

            {/* Interactive Visual Overlay Markers for Drag and Click */}
            {showGuidelines &&
              template.elements.map((el) => {
                if (!el.visible) return null;
                const isSelected = el.id === selectedElementId;
                const scale = zoomLevel;

                const w = (el.width || (el.font_size ? el.font_size * 5 : 80)) * scale;
                const h = (el.height || (el.font_size ? el.font_size * 1.5 : 30)) * scale;
                const left = el.x * scale - w / 2;
                const top = el.y * scale - h / 2;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${w}px`,
                      height: `${h}px`
                    }}
                    className={`absolute flex items-center justify-center transition-all cursor-move ${
                      isSelected
                        ? 'border-2 border-blue-400 bg-blue-500/15 ring-2 ring-blue-500/30 rounded z-30'
                        : 'border border-dashed border-slate-500/40 hover:border-slate-300/80 hover:bg-white/5 rounded z-20'
                    }`}
                    title={`${el.label} (Drag to move)`}
                  >
                    {isSelected && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm pointer-events-none">
                        {el.label} • X:{el.x} Y:{el.y}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Sidebar: Inspector & Customizer */}
        <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('element')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'element'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={13} />
              <span>Inspector</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'theme'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette size={13} />
              <span>Theme &amp; Borders</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'fields'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={13} />
              <span>Elements ({template.elements.length})</span>
            </button>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TAB 1: ELEMENT INSPECTOR */}
            {activeTab === 'element' && (
              <>
                {selectedElement ? (
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono">
                          Selected Element
                        </span>
                        <h3 className="text-sm font-bold text-white">{selectedElement.label}</h3>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ visible: !selectedElement.visible })}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            selectedElement.visible
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              : 'bg-red-950/40 border-red-800 text-red-400'
                          }`}
                          title={selectedElement.visible ? 'Hide Element' : 'Show Element'}
                        >
                          {selectedElement.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        {selectedElement.is_custom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteElement(selectedElement.id)}
                            className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 border border-red-800/80 text-red-400 transition-colors"
                            title="Delete Custom Field"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Text (if text or shape) */}
                    {selectedElement.type !== 'image' && selectedElement.type !== 'qr' && selectedElement.type !== 'seal' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Content / Template Text</label>
                        <textarea
                          rows={2}
                          value={selectedElement.default_text || ''}
                          onChange={(e) => updateSelectedElement({ default_text: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                        />
                        {/* Dynamic Field Shortcuts */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-[10px] text-slate-500 self-center">Insert:</span>
                          {[
                            '{{full_name}}',
                            '{{course_name}}',
                            '{{package_name}}',
                            '{{email}}',
                            '{{completion_date}}',
                            '{{tsw_id}}'
                          ].map((ph) => (
                            <button
                              key={ph}
                              type="button"
                              onClick={() => insertPlaceholder(ph)}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded transition-colors"
                            >
                              {ph}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coordinates X and Y */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">X Position (0-1200)</label>
                        <input
                          type="number"
                          min={0}
                          max={1200}
                          value={selectedElement.x}
                          onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Y Position (0-850)</label>
                        <input
                          type="number"
                          min={0}
                          max={850}
                          value={selectedElement.y}
                          onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none mt-1"
                        />
                      </div>
                    </div>

                    {/* Typography controls (for text elements) */}
                    {selectedElement.type === 'text' && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Typography
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400">Font Family</label>
                            <select
                              value={selectedElement.font_family || 'Montserrat'}
                              onChange={(e) => updateSelectedElement({ font_family: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 outline-none"
                            >
                              <option value="Cinzel">Cinzel (Classic Roman)</option>
                              <option value="Playfair Display">Playfair Display (Serif)</option>
                              <option value="Alex Brush">Alex Brush (Cursive Script)</option>
                              <option value="Great Vibes">Great Vibes (Calligraphy)</option>
                              <option value="Montserrat">Montserrat (Clean Sans)</option>
                              <option value="Inter">Inter (Modern Sans)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-slate-400">Font Style</label>
                            <select
                              value={selectedElement.font_style || 'normal'}
                              onChange={(e) => updateSelectedElement({ font_style: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 outline-none"
                            >
                              <option value="normal">Normal</option>
                              <option value="italic">Italic (Cursive Style)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400">
                              Font Size ({selectedElement.font_size || 16}px)
                            </label>
                            <input
                              type="range"
                              min={10}
                              max={80}
                              value={selectedElement.font_size || 16}
                              onChange={(e) => updateSelectedElement({ font_size: Number(e.target.value) })}
                              className="w-full mt-2 accent-indigo-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-400">Font Weight</label>
                            <select
                              value={selectedElement.font_weight || 'normal'}
                              onChange={(e) => updateSelectedElement({ font_weight: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 outline-none"
                            >
                              <option value="normal">Normal (400)</option>
                              <option value="500">Medium (500)</option>
                              <option value="600">Semibold (600)</option>
                              <option value="700">Bold (700)</option>
                              <option value="800">Extrabold (800)</option>
                              <option value="900">Black (900)</option>
                            </select>
                          </div>
                        </div>

                        {/* Text Color & Alignment */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400">Text Color</label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={selectedElement.color || '#FFFFFF'}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={selectedElement.color || '#FFFFFF'}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-slate-400">Alignment</label>
                            <select
                              value={selectedElement.text_align || 'center'}
                              onChange={(e) => updateSelectedElement({ text_align: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 outline-none"
                            >
                              <option value="center">Center</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sizing & Shape (for images / avatars / seal) */}
                    {(selectedElement.type === 'image' || selectedElement.type === 'qr' || selectedElement.type === 'seal' || selectedElement.type === 'shape') && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Dimensions &amp; Shape
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400">Width ({selectedElement.width || 80}px)</label>
                            <input
                              type="number"
                              min={10}
                              max={600}
                              value={selectedElement.width || 80}
                              onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-1"
                            />
                          </div>

                          {selectedElement.type === 'shape' ? (
                            <div>
                              <label className="text-xs text-slate-400">Height ({selectedElement.height || 2}px)</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={selectedElement.height || 2}
                                onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-1"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs text-slate-400">Shape</label>
                              <select
                                value={selectedElement.shape || 'circle'}
                                onChange={(e) => updateSelectedElement({ shape: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1 outline-none"
                              >
                                <option value="circle">Circle (Round 1:1)</option>
                                <option value="square">Square Rounded</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {selectedElement.type === 'image' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-400">Border Color</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={selectedElement.border_color || '#D4AF37'}
                                  onChange={(e) => updateSelectedElement({ border_color: e.target.value })}
                                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                                />
                                <input
                                  type="text"
                                  value={selectedElement.border_color || '#D4AF37'}
                                  onChange={(e) => updateSelectedElement({ border_color: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400">Border Width (px)</label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={selectedElement.border_width || 3}
                                onChange={(e) => updateSelectedElement({ border_width: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <Move size={36} className="mx-auto text-slate-600" />
                    <p className="text-xs font-semibold">Select an element on canvas to inspect and edit</p>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: THEME & BORDERS */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Certificate Theme &amp; Styling
                </span>

                {/* Background Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Background Surface</label>
                  <select
                    value={template.theme.background_type}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, background_type: e.target.value as any }
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none"
                  >
                    <option value="navy_gradient">Midnight Navy &amp; Royal Blue Gradient (Official TSW)</option>
                    <option value="classic_light">Ivory &amp; Parchment Light Theme</option>
                    <option value="royal_purple">Deep Royal Purple Gradient</option>
                  </select>
                </div>

                {/* Outer Border Settings */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Outer Border (Gold Frame)</label>
                    <input
                      type="checkbox"
                      checked={template.theme.show_outer_border}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, show_outer_border: e.target.checked }
                        }))
                      }
                      className="accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>
                  {template.theme.show_outer_border && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400">Color</span>
                        <input
                          type="color"
                          value={template.theme.outer_border_color}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, outer_border_color: e.target.value }
                            }))
                          }
                          className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Width (px)</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={template.theme.outer_border_width}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, outer_border_width: Number(e.target.value) }
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Inner Border Settings */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Inner Border (Royal Accent)</label>
                    <input
                      type="checkbox"
                      checked={template.theme.show_inner_border}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, show_inner_border: e.target.checked }
                        }))
                      }
                      className="accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>
                  {template.theme.show_inner_border && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400">Color</span>
                        <input
                          type="color"
                          value={template.theme.inner_border_color}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, inner_border_color: e.target.value }
                            }))
                          }
                          className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Width (px)</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={template.theme.inner_border_width}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, inner_border_width: Number(e.target.value) }
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Corner Ornaments */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Decorative Corner Flourishes</label>
                    <input
                      type="checkbox"
                      checked={template.theme.show_corner_decorations}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, show_corner_decorations: e.target.checked }
                        }))
                      }
                      className="accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>
                  {template.theme.show_corner_decorations && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400">Corner Accent Color</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={template.theme.corner_color}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, corner_color: e.target.value }
                            }))
                          }
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={template.theme.corner_color}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              theme: { ...prev.theme, corner_color: e.target.value }
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ALL ELEMENTS LIST & ADD CUSTOM FIELD */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Layers &amp; Elements
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomFieldModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {template.elements.map((el) => {
                    const isSelected = el.id === selectedElementId;
                    return (
                      <div
                        key={el.id}
                        onClick={() => {
                          setSelectedElementId(el.id);
                          setActiveTab('element');
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {el.type === 'qr' && <QrCode size={14} className="text-amber-400 shrink-0" />}
                          {el.type === 'seal' && <Award size={14} className="text-amber-400 shrink-0" />}
                          {el.type === 'image' && <ImageIcon size={14} className="text-blue-400 shrink-0" />}
                          {el.type === 'text' && <Type size={14} className="text-indigo-400 shrink-0" />}
                          {el.type === 'shape' && <Layout size={14} className="text-slate-400 shrink-0" />}
                          <span className="truncate">{el.label}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplate((prev) => ({
                                ...prev,
                                elements: prev.elements.map((item) =>
                                  item.id === el.id ? { ...item, visible: !item.visible } : item
                                )
                              }));
                            }}
                            className={`p-1 rounded ${
                              el.visible ? 'text-slate-400 hover:text-white' : 'text-red-400 hover:text-red-300'
                            }`}
                          >
                            {el.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Field Modal */}
      {showCustomFieldModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                <span>Add Custom Certificate Field</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomFieldModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Field Label</label>
                <input
                  type="text"
                  placeholder="e.g. Instructor Name, Grade, Batch Name"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 self-center">Presets:</span>
                {[
                  { label: 'Instructor Name', key: 'instructor_name', text: 'Instructor: {{instructor_name}}' },
                  { label: 'Grade / Score', key: 'grade', text: 'Grade: {{grade}}' },
                  { label: 'Completion Hours', key: 'completion_hours', text: 'Credit: {{completion_hours}}' },
                  { label: 'Batch Name', key: 'batch_name', text: 'Batch: {{batch_name}}' },
                  { label: 'Issue Date', key: 'issue_date', text: 'Issued on: {{issue_date}}' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setNewFieldLabel(item.label);
                      setNewFieldKey(item.key);
                      setNewFieldText(item.text);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Placeholder Key</label>
                <input
                  type="text"
                  placeholder="e.g. instructor_name, grade, batch"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono mt-1 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Default Display Text</label>
                <input
                  type="text"
                  placeholder="e.g. Instructor: {{instructor_name}}"
                  value={newFieldText}
                  onChange={(e) => setNewFieldText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomFieldModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomField}
                disabled={!newFieldLabel.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Add Field to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
