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
  Check,
  Search,
  QrCode,
  ShieldCheck,
  Clock,
  Ban,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Calendar,
  User,
  Building2,
  Share2,
  ShieldAlert,
  Database,
  Code
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { invokeAdminFunction } from '../../lib/supabase';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import LoadingScreen from '../../components/LoadingScreen';
import CertificateVisualDesigner from '../../components/admin/CertificateVisualDesigner';
import { CertificateTemplate, CertificateUserData, CertificateRecord } from '../../types/certificate';
import {
  DEFAULT_MASTER_TEMPLATE,
  ALTERNATE_CLASSIC_LIGHT_TEMPLATE,
  SAMPLE_CERTIFICATE_USER_DATA
} from '../../lib/certificateDefaults';
import {
  renderCertificateToCanvas,
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
  formatCertificateDate,
  getVerificationUrl,
  getActiveVerificationUrl
} from '../../lib/certificateEngine';

interface SiteSettings {
  certificate_template: string;
  certificate_designs: string;
  certificate_positions?: string;
  certificate_custom_template?: string; // Active template JSON
  certificate_templates_list?: string; // Array of all templates JSON
}

const CERTIFICATE_MIGRATION_SQL = `-- ==============================================================================
-- THE SMART WORTH - CERTIFICATE VERIFICATION SYSTEM SQL MIGRATION
-- Run this script in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create or alter the certificates table with all required fields
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_id TEXT,
    candidate_name TEXT,
    user_name TEXT,
    course_name TEXT,
    package_name TEXT,
    certificate_type TEXT DEFAULT 'Certificate of Completion',
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'verified',
    issued_by TEXT DEFAULT 'The Smart Worth',
    verification_url TEXT,
    certificate_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add any missing columns if the table already existed previously
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'certificate_id') THEN
        ALTER TABLE public.certificates ADD COLUMN certificate_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'candidate_name') THEN
        ALTER TABLE public.certificates ADD COLUMN candidate_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'course_name') THEN
        ALTER TABLE public.certificates ADD COLUMN course_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'certificate_type') THEN
        ALTER TABLE public.certificates ADD COLUMN certificate_type TEXT DEFAULT 'Certificate of Completion';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'issue_date') THEN
        ALTER TABLE public.certificates ADD COLUMN issue_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'completion_date') THEN
        ALTER TABLE public.certificates ADD COLUMN completion_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'status') THEN
        ALTER TABLE public.certificates ADD COLUMN status TEXT DEFAULT 'verified';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'issued_by') THEN
        ALTER TABLE public.certificates ADD COLUMN issued_by TEXT DEFAULT 'The Smart Worth';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'verification_url') THEN
        ALTER TABLE public.certificates ADD COLUMN verification_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'email') THEN
        ALTER TABLE public.certificates ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.certificates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Relax non-null constraints on legacy columns to allow admin issuing without friction
ALTER TABLE public.certificates ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN certificate_url DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN package_name DROP NOT NULL;

-- 4. Sync legacy columns if candidate_name or course_name are missing
UPDATE public.certificates
SET candidate_name = user_name
WHERE candidate_name IS NULL AND user_name IS NOT NULL;

UPDATE public.certificates
SET course_name = package_name
WHERE course_name IS NULL AND package_name IS NOT NULL;

UPDATE public.certificates
SET certificate_id = CONCAT('TSW-', EXTRACT(YEAR FROM created_at)::TEXT, '-', LPAD(SUBSTRING(id::TEXT, 1, 6), 6, '0'))
WHERE certificate_id IS NULL;

UPDATE public.certificates
SET status = 'verified'
WHERE status IS NULL;

UPDATE public.certificates
SET issued_by = 'The Smart Worth'
WHERE issued_by IS NULL;

UPDATE public.certificates
SET verification_url = CONCAT('https://verify.thesmartworth.site/certificate/', certificate_id)
WHERE verification_url IS NULL AND certificate_id IS NOT NULL;

-- 5. Create Fast Unique Index on certificate_id (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_cert_id_unique 
ON public.certificates (LOWER(certificate_id));

CREATE INDEX IF NOT EXISTS idx_certificates_user_id 
ON public.certificates (user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_status 
ON public.certificates (status);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at 
ON public.certificates (created_at DESC);

-- 6. Setup Row Level Security (RLS)
ALTER TABLE public.certificates OWNER TO postgres;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 6.1 Public Verification Access: Anyone (including QR scan) can verify
DROP POLICY IF EXISTS "Public can view certificates for verification" ON public.certificates;
CREATE POLICY "Public can view certificates for verification" 
ON public.certificates 
FOR SELECT 
USING (true);

-- 6.2 Authenticated users can view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" 
ON public.certificates 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 6.3 Authenticated users can create their own certificate upon course completion
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;
CREATE POLICY "Users can insert own certificates" 
ON public.certificates 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 6.4 Admins have full access to manage all certificates
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
CREATE POLICY "Admins can manage all certificates" 
ON public.certificates 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'ADMIN' OR role = 'superadmin')
  )
);

-- 7. Grant schema permissions for Anon, Authenticated, and Service Role
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT ALL ON public.certificates TO authenticated;

-- 8. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certificates_updated_at ON public.certificates;
CREATE TRIGGER trg_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_certificates_updated_at();`;

export default function CertificateManagement() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'templates' | 'sql'>('certificates');
  const [copiedSql, setCopiedSql] = useState(false);

  // --- CERTIFICATES STATE ---
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certSearch, setCertSearch] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'verified' | 'pending' | 'revoked'>('all');
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalCert, setQrModalCert] = useState<CertificateRecord | null>(null);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  // New certificate form state
  const [newCert, setNewCert] = useState({
    candidate_name: '',
    course_name: '',
    certificate_id: '',
    certificate_type: 'Certificate of Completion',
    issue_date: new Date().toISOString().split('T')[0],
    completion_date: new Date().toISOString().split('T')[0],
    status: 'verified' as 'verified' | 'pending' | 'revoked',
    email: '',
    issued_by: 'The Smart Worth'
  });

  // --- TEMPLATES / DESIGNER STATE ---
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
    fetchCertificates();
    fetchSettings();
    fetchPackagesList();

    const onFastReload = () => {
      fetchCertificates();
      fetchSettings();
    };
    window.addEventListener('admin-fast-reload', onFastReload);
    return () => window.removeEventListener('admin-fast-reload', onFastReload);
  }, []);

  // Fetch all certificates
  const fetchCertificates = async () => {
    try {
      setCertsLoading(true);
      const res = await fetch('/api/admin/certificates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(Array.isArray(data) ? data : []);
      } else {
        // Fallback query via admin-action
        const fallbackData = await invokeAdminFunction('admin-action', {
          action: 'query',
          table: 'certificates'
        });
        if (Array.isArray(fallbackData)) {
          setCertificates(fallbackData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
    } finally {
      setCertsLoading(false);
    }
  };

  // Fetch package list for dropdown
  const fetchPackagesList = async () => {
    try {
      const data = await invokeAdminFunction('admin-action', {
        action: 'query',
        table: 'packages'
      });
      if (Array.isArray(data) && data.length > 0) {
        setAvailablePackages(data);
        if (!newCert.course_name) {
          setNewCert((prev) => ({ ...prev, course_name: data[0].name || '' }));
        }
      }
    } catch (e) {
      console.warn('Error fetching packages list:', e);
    }
  };

  // Fetch next certificate ID from server
  const fetchNextCertId = async () => {
    try {
      const res = await fetch('/api/admin/certificates/next-id', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nextId) {
          setNewCert((prev) => ({ ...prev, certificate_id: data.nextId }));
        }
      }
    } catch (e) {
      const currentYear = new Date().getFullYear();
      const fallbackId = `TSW-${currentYear}-${String(certificates.length + 1).padStart(6, '0')}`;
      setNewCert((prev) => ({ ...prev, certificate_id: fallbackId }));
    }
  };

  // Open Create Certificate Modal
  const handleOpenCreateModal = async () => {
    await fetchNextCertId();
    setIsCreateModalOpen(true);
  };

  // Submit New Certificate
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.candidate_name.trim()) {
      showToast('Please enter candidate name.', 'error');
      return;
    }
    if (!newCert.course_name.trim()) {
      showToast('Please select or enter course/program name.', 'error');
      return;
    }
    if (!newCert.certificate_id.trim()) {
      showToast('Please provide a unique Certificate ID.', 'error');
      return;
    }

    try {
      setIsSubmittingCert(true);
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newCert)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create certificate');
      }

      showToast(`Certificate "${newCert.certificate_id}" issued successfully!`, 'success');
      setIsCreateModalOpen(false);
      setNewCert({
        candidate_name: '',
        course_name: availablePackages[0]?.name || '',
        certificate_id: '',
        certificate_type: 'Certificate of Completion',
        issue_date: new Date().toISOString().split('T')[0],
        completion_date: new Date().toISOString().split('T')[0],
        status: 'verified',
        email: '',
        issued_by: 'The Smart Worth'
      });
      await fetchCertificates();
    } catch (err: any) {
      console.error('Error creating certificate:', err);
      showToast(err.message || 'Failed to create certificate', 'error');
    } finally {
      setIsSubmittingCert(false);
    }
  };

  // 1-Click Status Change (VERIFIED <-> PENDING <-> REVOKED)
  const handleStatusChange = async (cert: CertificateRecord, newStatus: 'verified' | 'pending' | 'revoked') => {
    try {
      const res = await fetch(`/api/admin/certificates/${cert.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      // Optimistic update
      setCertificates((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, status: newStatus } : c))
      );

      const statusLabels = {
        verified: 'VERIFIED (Active)',
        pending: 'PENDING',
        revoked: 'REVOKED (Invalidated)'
      };
      showToast(`Status of ${cert.certificate_id} changed to ${statusLabels[newStatus]}!`, 'success');
    } catch (err: any) {
      console.error('Status update error:', err);
      showToast(err.message || 'Failed to update certificate status', 'error');
      fetchCertificates();
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (cert: CertificateRecord) => {
    if (!confirm(`Are you sure you want to permanently delete certificate "${cert.certificate_id}" for ${cert.candidate_name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/certificates/${cert.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete certificate');
      }

      setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
      showToast(`Certificate ${cert.certificate_id} deleted.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete certificate', 'error');
    }
  };

  // Copy Verification URL
  const handleCopyUrl = (cert: CertificateRecord) => {
    const canonicalUrl = cert.verification_url || getVerificationUrl(cert.certificate_id);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(canonicalUrl);
      showToast(`Verification URL copied: ${canonicalUrl}`, 'success');
    }
  };

  // Copy Supabase SQL Migration Script
  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(CERTIFICATE_MIGRATION_SQL);
      setCopiedSql(true);
      showToast('Supabase SQL migration code copied to clipboard!', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  // Download QR Code PNG
  const handleDownloadQr = (cert: CertificateRecord) => {
    const svgEl = document.getElementById(`admin-qr-svg-${cert.id}`);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 20, 20, 560, 560);
        const a = document.createElement('a');
        a.download = `QR_${cert.certificate_id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

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

  const handleSaveFromDesigner = async (updatedTemplate: CertificateTemplate) => {
    let updatedList = [...templatesList];
    const existingIndex = updatedList.findIndex((t) => t.id === updatedTemplate.id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = updatedTemplate;
    } else {
      updatedList.push(updatedTemplate);
    }

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
      is_default: false
    };

    const updatedList = [...templatesList, duplicated];
    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList)
    };

    await handleSaveAllSettings(newSettings, `Duplicated as "${duplicated.name}"`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (templatesList.length <= 1) {
      showToast('Cannot delete the only remaining template.', 'error');
      return;
    }

    const tplToDelete = templatesList.find((t) => t.id === templateId);
    if (!confirm(`Delete template "${tplToDelete?.name || templateId}"?`)) return;

    let updatedList = templatesList.filter((t) => t.id !== templateId);
    let newActiveJson = siteSettings.certificate_custom_template;

    if (templateId === activeTemplateId) {
      updatedList[0].is_default = true;
      newActiveJson = JSON.stringify(updatedList[0]);
    }

    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList),
      certificate_custom_template: newActiveJson
    };

    await handleSaveAllSettings(newSettings, 'Template deleted.');
  };

  const handleCreateNewTemplate = () => {
    const newId = `custom-tpl-${Date.now()}`;
    const newTemplate: CertificateTemplate = {
      ...JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE)),
      id: newId,
      name: `Custom Template #${templatesList.length + 1}`,
      is_default: false
    };
    setDesigningTemplate(newTemplate);
  };

  const handleUploadBgTemplate = async (url: string) => {
    const newId = `bg-tpl-${Date.now()}`;
    const customWithBg: CertificateTemplate = {
      ...JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE)),
      id: newId,
      name: `Uploaded Background #${templatesList.length + 1}`,
      is_default: false,
      theme: {
        ...DEFAULT_MASTER_TEMPLATE.theme,
        background_type: 'image',
        background_image: url,
        show_outer_border: false,
        show_inner_border: false,
        show_corner_decorations: false
      }
    };

    const updatedList = [...templatesList, customWithBg];
    const newSettings: SiteSettings = {
      ...siteSettings,
      certificate_templates_list: JSON.stringify(updatedList)
    };

    await handleSaveAllSettings(newSettings, 'Background template uploaded & saved!');
  };

  // Filtered Certificates
  const filteredCertificates = React.useMemo(() => {
    return certificates.filter((c) => {
      const matchesSearch =
        !certSearch ||
        String(c.candidate_name || '').toLowerCase().includes(certSearch.toLowerCase()) ||
        String(c.certificate_id || '').toLowerCase().includes(certSearch.toLowerCase()) ||
        String(c.course_name || '').toLowerCase().includes(certSearch.toLowerCase()) ||
        String(c.email || '').toLowerCase().includes(certSearch.toLowerCase());

      const matchesStatus =
        certStatusFilter === 'all' ||
        String(c.status || 'verified').toLowerCase() === certStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [certificates, certSearch, certStatusFilter]);

  // Status Metrics
  const metrics = React.useMemo(() => {
    const total = certificates.length;
    const verified = certificates.filter((c) => String(c.status || 'verified').toLowerCase() === 'verified').length;
    const pending = certificates.filter((c) => String(c.status || '').toLowerCase() === 'pending').length;
    const revoked = certificates.filter((c) => String(c.status || '').toLowerCase() === 'revoked').length;
    return { total, verified, pending, revoked };
  }, [certificates]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusToast && (
        <div
          className={`fixed bottom-5 right-5 z-70 px-4 py-3 rounded-xl border shadow-2xl flex items-center justify-between gap-4 transition-all duration-300 ${
            statusToast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-red-500/50 text-red-300'
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
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              The Smart Worth Authority
            </span>
            <span className="text-xs text-slate-400 font-mono">verify.thesmartworth.site</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <span>Certificate Management &amp; Verification</span>
            <Sparkles size={20} className="text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Issue unique verifiable certificates with auto-generated IDs, dynamic QR codes, and instant status control (Verified, Pending, Revoked).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              fetchCertificates();
              fetchSettings();
            }}
            disabled={certsLoading || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 shadow-sm transition-colors cursor-pointer shrink-0"
            title="Reload Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${certsLoading || loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCheck size={16} />
          <span>Issued Certificates ({certificates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Palette size={16} />
          <span>Template Visual Designer ({templatesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'sql'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-emerald-400 hover:text-white border border-emerald-500/30'
          }`}
        >
          <Database size={16} />
          <span>Supabase SQL Setup</span>
          <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-400/30">
            Real Data
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ISSUED CERTIFICATES & VERIFICATION SYSTEM
          ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">

          {/* Quick Notice when no certificates are in database */}
          {certificates.length === 0 && !certsLoading && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Connect Real Supabase Database</h4>
                  <p className="text-[11px] text-slate-400">
                    Aapke database me abhi 0 certificates hain. Agar aapne SQL migration run nahi kiya hai to <button type="button" onClick={() => setActiveTab('sql')} className="text-emerald-400 font-bold underline hover:text-emerald-300">Supabase SQL Setup</button> tab se 1-click me SQL copy karke run karein.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('sql')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Code size={13} />
                  <span>Copy SQL Code</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus size={13} />
                  <span>Issue Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-indigo-400" /> Total Certificates
              </span>
              <p className="text-2xl font-black text-white">{metrics.total}</p>
              <p className="text-[11px] text-slate-400">Issued records</p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Verified &amp; Active
              </span>
              <p className="text-2xl font-black text-emerald-400">{metrics.verified}</p>
              <p className="text-[11px] text-emerald-300/80">Publicly verified</p>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" /> Pending Review
              </span>
              <p className="text-2xl font-black text-amber-400">{metrics.pending}</p>
              <p className="text-[11px] text-amber-300/80">Awaiting activation</p>
            </div>

            <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ban size={14} className="text-red-400" /> Revoked
              </span>
              <p className="text-2xl font-black text-red-400">{metrics.revoked}</p>
              <p className="text-[11px] text-red-300/80">Cancelled credentials</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                placeholder="Search candidate, ID, course..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Filter:</span>
                <select
                  value={certStatusFilter}
                  onChange={(e) => setCertStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses ({certificates.length})</option>
                  <option value="verified">Verified Only ({metrics.verified})</option>
                  <option value="pending">Pending Only ({metrics.pending})</option>
                  <option value="revoked">Revoked Only ({metrics.revoked})</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>New Certificate</span>
              </button>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Certificate ID</th>
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Program / Course</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Status &amp; Actions</th>
                    <th className="py-3.5 px-4 text-right">Verification &amp; Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {certsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        <span>Loading certificates ledger...</span>
                      </td>
                    </tr>
                  ) : filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                        <Award size={32} className="mx-auto text-slate-600" />
                        <p className="font-semibold">No certificates match your query.</p>
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>Issue First Certificate</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((cert) => {
                      const status = String(cert.status || 'verified').toLowerCase();
                      return (
                        <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                          
                          {/* Certificate ID */}
                          <td className="py-4 px-4 font-mono font-bold text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300">
                                {cert.certificate_id}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(cert)}
                                title="Copy verification URL"
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </td>

                          {/* Candidate */}
                          <td className="py-4 px-4 font-medium text-white">
                            <div>
                              <p className="font-bold text-white text-sm">{cert.candidate_name}</p>
                              {cert.email && (
                                <p className="text-[11px] text-slate-400">{cert.email}</p>
                              )}
                            </div>
                          </td>

                          {/* Course / Program */}
                          <td className="py-4 px-4">
                            <span className="text-white font-semibold">{cert.course_name}</span>
                            <span className="block text-[10px] text-slate-400">{cert.certificate_type || 'Certificate of Completion'}</span>
                          </td>

                          {/* Issue Date */}
                          <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                            {formatCertificateDate(cert.issue_date || cert.created_at)}
                          </td>

                          {/* Status Badge + 1-Click Status Dropdown */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={status}
                                onChange={(e) => handleStatusChange(cert, e.target.value as any)}
                                className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all ${
                                  status === 'verified'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                                    : status === 'pending'
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                                    : 'bg-red-500/15 text-red-400 border-red-500/40'
                                }`}
                              >
                                <option value="verified" className="bg-slate-900 text-emerald-400">
                                  ✓ VERIFIED
                                </option>
                                <option value="pending" className="bg-slate-900 text-amber-400">
                                  ⏳ PENDING
                                </option>
                                <option value="revoked" className="bg-slate-900 text-red-400">
                                  ✕ REVOKED
                                </option>
                              </select>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View QR Code */}
                              <button
                                type="button"
                                onClick={() => setQrModalCert(cert)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="View & Download QR Code"
                              >
                                <QrCode size={15} />
                              </button>

                              {/* Preview Public Verification Page */}
                              <a
                                href={`/certificate/${encodeURIComponent(cert.certificate_id)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                                title="Preview Verification Page"
                              >
                                <ExternalLink size={15} />
                              </a>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCertificate(cert)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete Certificate"
                              >
                                <Trash2 size={15} />
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
      )}

      {/* =========================================================================
          TAB 2: TEMPLATE VISUAL DESIGNER
          ========================================================================= */}
      {activeTab === 'templates' && (
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
                      Students receive the active default template upon course completion.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewTemplate}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Template</span>
                </button>
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
                          <div
                            className="w-full h-full rounded-lg border flex flex-col items-center justify-center text-center p-4 relative"
                            style={{
                              background:
                                tpl.theme.background_type === 'classic_light'
                                  ? 'linear-gradient(135deg, #FFFDF8, #FBF8EE)'
                                  : tpl.theme.background_type === 'royal_purple'
                                  ? 'linear-gradient(135deg, #1A0B2E, #070B1E)'
                                  : 'linear-gradient(135deg, #070B1E, #0F172A)',
                              borderColor: tpl.theme.outer_border_color || '#D4AF37'
                            }}
                          >
                            <span
                              className="text-[10px] uppercase tracking-widest font-extrabold"
                              style={{ color: tpl.theme.accent_color || '#D4AF37' }}
                            >
                              THE SMART WORTH
                            </span>
                            <span
                              className="text-xs font-black tracking-wider uppercase mt-1"
                              style={{ color: tpl.theme.background_type === 'classic_light' ? '#0F172A' : '#FFFFFF' }}
                            >
                              {tpl.name}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1">
                              {tpl.elements?.length || 0} Dynamic Elements
                            </span>

                            {isActive && (
                              <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                                Active Default
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Template Details & Action Toolbar */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white tracking-tight">{tpl.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Theme: <span className="text-slate-300 capitalize">{tpl.theme.background_type.replace('_', ' ')}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewTemplate(tpl)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Full Resolution Canvas Preview"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            <div className="flex items-center space-x-1.5">
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleSetActiveTemplate(tpl)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                                  title="Set as Default for Students"
                                >
                                  <span>Set Active</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setDesigningTemplate(tpl)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              >
                                <Sliders size={13} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateTemplate(tpl)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Duplicate"
                              >
                                <Copy size={13} />
                              </button>

                              {templatesList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplate(tpl.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete"
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

          {/* Right Column: Custom Background Upload & Placeholders Reference */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
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
                When a user generates their completion certificate, the following tags automatically bind to their verified record:
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
      )}

      {/* =========================================================================
          TAB 3: SUPABASE SQL DATABASE SETUP (REAL DATA CONNECTION)
          ========================================================================= */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Supabase PostgreSQL Migration
                </span>
                <span className="text-xs text-slate-400 font-mono">public.certificates</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Database size={22} className="text-emerald-400" />
                <span>One-Time Supabase Database Setup for Real Data</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Neeche diya gaya SQL script aapke Supabase database me <strong className="text-emerald-300">certificates</strong> table ko create / update karega, sabhi zaroori columns add karega, unique index banayega, aur <strong className="text-emerald-300">Public RLS</strong> enable karega taaki QR code scan karne par koi bhi bina login kiye certificate verify kar sake.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopySql}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  copiedSql
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20'
                }`}
              >
                {copiedSql ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedSql ? 'SQL Code Copied!' : 'Copy SQL Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchCertificates();
                  showToast('Reloading certificates from Supabase...', 'success');
                }}
                disabled={certsLoading}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
              >
                <RefreshCw size={14} className={certsLoading ? 'animate-spin' : ''} />
                <span>Reload Data</span>
              </button>
            </div>
          </div>

          {/* Quick 4-Step Guide */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">1</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Supabase Kholein</h4>
              <p className="text-[11px] text-slate-400">
                Apne Supabase Dashboard me jaakar apna project select karein.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">2</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">SQL Editor</h4>
              <p className="text-[11px] text-slate-400">
                Left navigation bar me <strong>SQL Editor</strong> par click karein.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">3</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paste &amp; Run</h4>
              <p className="text-[11px] text-slate-400">
                <strong>New Query</strong> par click karke neeche ka SQL paste karein aur <strong>Run</strong> dabaen.
              </p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">4</div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Real Data Live!</h4>
              <p className="text-[11px] text-emerald-300/80">
                SQL run hote hi <strong>Reload Data</strong> dabaen. Ab real certificates direct Supabase se load honge.
              </p>
            </div>
          </div>

          {/* SQL Code Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code size={16} className="text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300">supabase_certificates_setup.sql</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">PostgreSQL</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedSql ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-5 max-h-[500px] overflow-y-auto bg-slate-950/70 font-mono text-[11px] leading-relaxed text-emerald-200/90 selection:bg-emerald-900">
              <pre className="whitespace-pre-wrap">{CERTIFICATE_MIGRATION_SQL}</pre>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ISSUE NEW CERTIFICATE MODAL
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-indigo-400" />
                  <span>Issue Official Certificate</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Generate a verified credential with unique verification URL and QR code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Candidate Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCert.candidate_name}
                  onChange={(e) => setNewCert({ ...newCert, candidate_name: e.target.value })}
                  placeholder="e.g. Mr Sahil Ahmed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Course / Program Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Program / Course Name *
                </label>
                <div className="flex gap-2">
                  {availablePackages.length > 0 && (
                    <select
                      value={newCert.course_name}
                      onChange={(e) => setNewCert({ ...newCert, course_name: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Existing Package --</option>
                      {availablePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.name}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    required
                    value={newCert.course_name}
                    onChange={(e) => setNewCert({ ...newCert, course_name: e.target.value })}
                    placeholder="Or enter custom course name"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Certificate ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Certificate ID (Unique) *
                  </label>
                  <button
                    type="button"
                    onClick={fetchNextCertId}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Auto-Generate Next ID</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newCert.certificate_id}
                  onChange={(e) => setNewCert({ ...newCert, certificate_id: e.target.value.toUpperCase() })}
                  placeholder="e.g. TSW-2026-000004"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Verification URL: https://verify.thesmartworth.site/certificate/{newCert.certificate_id || 'TSW-XXXX'}
                </p>
              </div>

              {/* Certificate Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Certificate Type
                  </label>
                  <select
                    value={newCert.certificate_type}
                    onChange={(e) => setNewCert({ ...newCert, certificate_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Certificate of Completion">Certificate of Completion</option>
                    <option value="Professional Specialization">Professional Specialization</option>
                    <option value="Excellence Mastery Award">Excellence Mastery Award</option>
                    <option value="Honorary Certification">Honorary Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newCert.status}
                    onChange={(e) => setNewCert({ ...newCert, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="verified">Verified (Active / Genuine)</option>
                    <option value="pending">Pending (Review Mode)</option>
                    <option value="revoked">Revoked (Invalidated)</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={newCert.issue_date}
                    onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={newCert.completion_date}
                    onChange={(e) => setNewCert({ ...newCert, completion_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Issued By & Candidate Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issued By
                  </label>
                  <input
                    type="text"
                    value={newCert.issued_by}
                    onChange={(e) => setNewCert({ ...newCert, issued_by: e.target.value })}
                    placeholder="The Smart Worth"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Candidate Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newCert.email}
                    onChange={(e) => setNewCert({ ...newCert, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingCert ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Issue Certificate</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          QR CODE MODAL
          ========================================================================= */}
      {qrModalCert && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-left">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode size={16} className="text-indigo-400" />
                  <span>Official QR Code</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {qrModalCert.certificate_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrModalCert(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border border-slate-200">
              <QRCodeSVG
                id={`admin-qr-svg-${qrModalCert.id}`}
                value={qrModalCert.verification_url || getVerificationUrl(qrModalCert.certificate_id)}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-white">{qrModalCert.candidate_name}</p>
              <p className="text-xs text-indigo-400 font-medium">{qrModalCert.course_name}</p>
              <p className="text-[11px] text-slate-500 font-mono break-all pt-1">
                {qrModalCert.verification_url || getVerificationUrl(qrModalCert.certificate_id)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadQr(qrModalCert)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyUrl(qrModalCert)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Copy size={14} />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
