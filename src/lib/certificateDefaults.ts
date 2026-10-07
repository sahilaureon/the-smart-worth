import { CertificateTemplate, CertificateUserData } from '../types/certificate';

export const SAMPLE_CERTIFICATE_USER_DATA: CertificateUserData = {
  id: 'TSW-CERT-DEMO01',
  full_name: 'Aditya Vardhan Sharma',
  course_name: 'Digital Marketing Mastery',
  package_name: 'Success Worth Platinum',
  email: 'aditya.sharma@thesmartworth.site',
  completion_date: '05-10-2026',
  tsw_id: 'TSW-884920',
  profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  cert_id: 'TSW-CERT-884920',
  instructor_name: 'Er. Sahil Baisla',
  grade: 'A+ (Distinction)',
  score: '96%',
  completion_hours: '36 Hours',
  batch_name: 'Batch TSW-2026-Alpha',
  issue_date: '05-10-2026',
  valid_until: 'Lifetime Verified',
  achievement: 'Top 1% Class Honors',
  verification_status: 'VERIFIED & AUTHENTIC'
};

export const DEFAULT_MASTER_TEMPLATE: CertificateTemplate = {
  id: 'tsw-royal-gold',
  name: 'The Smart Worth Official Masterpiece',
  description: 'Royal navy, gold & purple corporate certificate with verified seal and QR verification',
  is_default: true,
  is_enabled: true,
  canvas_width: 1200,
  canvas_height: 850,
  theme: {
    background_type: 'navy_gradient',
    background_color: '#070B1E',
    show_outer_border: true,
    outer_border_color: '#D4AF37', // Gold
    outer_border_width: 8,
    show_inner_border: true,
    inner_border_color: '#1E40AF', // Royal Blue
    inner_border_width: 2,
    show_corner_decorations: true,
    corner_color: '#E5C158',
    accent_color: '#6366F1' // Purple
  },
  elements: [
    // 1. Header Brand Line
    {
      id: 'brand-title',
      type: 'text',
      label: 'Institution Title',
      default_text: 'THE SMART WORTH',
      x: 600,
      y: 115,
      font_family: 'Cinzel',
      font_size: 26,
      font_weight: '800',
      font_style: 'normal',
      color: '#E2E8F0',
      text_align: 'center',
      letter_spacing: 6,
      visible: true
    },
    {
      id: 'brand-tagline',
      type: 'text',
      label: 'Institution Subtitle',
      default_text: 'ACADEMY OF PROFESSIONAL SKILL EXCELLENCE',
      x: 600,
      y: 142,
      font_family: 'Montserrat',
      font_size: 11,
      font_weight: '600',
      font_style: 'normal',
      color: '#94A3B8',
      text_align: 'center',
      letter_spacing: 4,
      visible: true
    },

    // 2. Certificate Heading
    {
      id: 'cert-heading',
      type: 'text',
      label: 'Main Heading',
      default_text: 'CERTIFICATE',
      x: 600,
      y: 220,
      font_family: 'Cinzel',
      font_size: 58,
      font_weight: '900',
      font_style: 'normal',
      color: '#F1C40F',
      text_align: 'center',
      letter_spacing: 8,
      visible: true
    },
    {
      id: 'cert-subheading',
      type: 'text',
      label: 'Certificate Subheading',
      default_text: 'OF COMPLETION',
      x: 600,
      y: 262,
      font_family: 'Alex Brush',
      font_size: 38,
      font_weight: 'normal',
      font_style: 'normal',
      color: '#FFFFFF',
      text_align: 'center',
      letter_spacing: 2,
      visible: true
    },

    // 3. Presentation text
    {
      id: 'cert-presentation',
      type: 'text',
      label: 'Presentation Intro',
      default_text: 'This certificate is proudly awarded to',
      x: 600,
      y: 310,
      font_family: 'Playfair Display',
      font_size: 17,
      font_weight: '500',
      font_style: 'italic',
      color: '#CBD5E1',
      text_align: 'center',
      letter_spacing: 1,
      visible: true
    },

    // 4. Student Profile Image (Avatar)
    {
      id: 'user-profile-image',
      type: 'image',
      field_key: 'profile_image',
      label: 'Student Profile Picture',
      x: 600,
      y: 385,
      width: 104,
      height: 104,
      shape: 'circle',
      border_color: '#F1C40F',
      border_width: 3,
      visible: true
    },

    // 5. Recipient Name
    {
      id: 'user-full-name',
      type: 'text',
      field_key: 'full_name',
      label: 'Student Full Name',
      default_text: '{{full_name}}',
      x: 600,
      y: 472,
      font_family: 'Montserrat',
      font_size: 34,
      font_weight: '800',
      font_style: 'normal',
      color: '#FFFFFF',
      text_align: 'center',
      letter_spacing: 1,
      visible: true
    },

    // 6. Name underline accent
    {
      id: 'name-divider',
      type: 'shape',
      label: 'Gold Divider Line',
      x: 600,
      y: 490,
      width: 320,
      height: 2,
      color: '#D4AF37',
      visible: true
    },

    // 7. Achievement statement
    {
      id: 'cert-statement',
      type: 'text',
      label: 'Statement Text',
      default_text: 'for successfully completing all practical requirements, assessments & masterclasses for',
      x: 600,
      y: 524,
      font_family: 'Inter',
      font_size: 14,
      font_weight: '400',
      font_style: 'normal',
      color: '#94A3B8',
      text_align: 'center',
      letter_spacing: 0.5,
      visible: true
    },

    // 8. Course Name
    {
      id: 'user-course-name',
      type: 'text',
      field_key: 'course_name',
      label: 'Course Name',
      default_text: '{{course_name}}',
      x: 600,
      y: 562,
      font_family: 'Cinzel',
      font_size: 26,
      font_weight: '700',
      font_style: 'normal',
      color: '#38BDF8', // Cyan/Sky highlight on navy
      text_align: 'center',
      letter_spacing: 2,
      visible: true
    },

    // 9. Package & Meta Information Badge
    {
      id: 'user-package-name',
      type: 'text',
      field_key: 'package_name',
      label: 'Package Name',
      default_text: 'Under: {{package_name}}',
      x: 600,
      y: 595,
      font_family: 'Montserrat',
      font_size: 13,
      font_weight: '600',
      font_style: 'normal',
      color: '#A78BFA', // Purple accent
      text_align: 'center',
      letter_spacing: 1,
      visible: true
    },

    // 10. Student Email & TSW ID Info Row
    {
      id: 'user-tsw-id',
      type: 'text',
      field_key: 'tsw_id',
      label: 'Student TSW ID',
      default_text: 'TSW ID: {{tsw_id}}',
      x: 480,
      y: 628,
      font_family: 'Inter',
      font_size: 12,
      font_weight: '600',
      font_style: 'normal',
      color: '#CBD5E1',
      text_align: 'center',
      letter_spacing: 0.5,
      visible: true
    },
    {
      id: 'user-email',
      type: 'text',
      field_key: 'email',
      label: 'Student Email',
      default_text: 'Email: {{email}}',
      x: 720,
      y: 628,
      font_family: 'Inter',
      font_size: 12,
      font_weight: '500',
      font_style: 'normal',
      color: '#94A3B8',
      text_align: 'center',
      letter_spacing: 0.5,
      visible: true
    },

    // 11. Left Section: Date of Completion
    {
      id: 'user-completion-date',
      type: 'text',
      field_key: 'completion_date',
      label: 'Date of Completion',
      default_text: '{{completion_date}}',
      x: 230,
      y: 730,
      font_family: 'Montserrat',
      font_size: 16,
      font_weight: '700',
      font_style: 'normal',
      color: '#F8FAFC',
      text_align: 'center',
      visible: true
    },
    {
      id: 'date-label',
      type: 'text',
      label: 'Date Label',
      default_text: 'DATE OF COMPLETION',
      x: 230,
      y: 755,
      font_family: 'Inter',
      font_size: 11,
      font_weight: '600',
      font_style: 'normal',
      color: '#64748B',
      text_align: 'center',
      letter_spacing: 1.5,
      visible: true
    },
    {
      id: 'date-line',
      type: 'shape',
      label: 'Date Divider',
      x: 230,
      y: 712,
      width: 170,
      height: 1.5,
      color: '#475569',
      visible: true
    },

    // 12. Center Section: Official Gold Seal / Badge
    {
      id: 'official-seal',
      type: 'seal',
      label: 'Official Seal Badge',
      x: 600,
      y: 725,
      width: 96,
      height: 96,
      color: '#F59E0B',
      visible: true
    },

    // 13. Right Section: Signature
    {
      id: 'signature-script',
      type: 'text',
      label: 'Authorized Signature Script',
      default_text: 'Sahil Baisla',
      x: 970,
      y: 728,
      font_family: 'Great Vibes',
      font_size: 38,
      font_weight: 'normal',
      font_style: 'normal',
      color: '#F8FAFC',
      text_align: 'center',
      visible: true
    },
    {
      id: 'signature-title',
      type: 'text',
      label: 'Authorized Signatory Label',
      default_text: 'AUTHORIZED SIGNATORY',
      x: 970,
      y: 755,
      font_family: 'Inter',
      font_size: 11,
      font_weight: '600',
      font_style: 'normal',
      color: '#64748B',
      text_align: 'center',
      letter_spacing: 1.5,
      visible: true
    },
    {
      id: 'signature-line',
      type: 'shape',
      label: 'Signature Line',
      x: 970,
      y: 742,
      width: 180,
      height: 1.5,
      color: '#475569',
      visible: true
    },

    // 14. QR Code Verification Area with STRICT "Renew" ONLY underneath
    {
      id: 'verification-qr',
      type: 'qr',
      label: 'Verification QR Code',
      x: 130,
      y: 145,
      width: 82,
      height: 82,
      visible: true
    },
    {
      id: 'qr-renew-label',
      type: 'text',
      label: 'QR Under-Label (Strictly Renew)',
      default_text: 'Renew',
      x: 130,
      y: 202,
      font_family: 'Montserrat',
      font_size: 11,
      font_weight: '700',
      font_style: 'normal',
      color: '#E2E8F0',
      text_align: 'center',
      letter_spacing: 1,
      visible: true
    },

    // 15. Certificate ID in top-right
    {
      id: 'cert-id-tag',
      type: 'text',
      field_key: 'cert_id',
      label: 'Certificate ID Tag',
      default_text: 'ID: {{cert_id}}',
      x: 1070,
      y: 135,
      font_family: 'Inter',
      font_size: 11,
      font_weight: '600',
      font_style: 'normal',
      color: '#64748B',
      text_align: 'right',
      letter_spacing: 1,
      visible: true
    }
  ]
};

export const ALTERNATE_CLASSIC_LIGHT_TEMPLATE: CertificateTemplate = {
  id: 'tsw-ivory-classic',
  name: 'The Smart Worth Ivory Elegance',
  description: 'Classic crisp parchment ivory background with navy blue typography, gold trim & seal',
  is_default: false,
  is_enabled: true,
  canvas_width: 1200,
  canvas_height: 850,
  theme: {
    background_type: 'classic_light',
    background_color: '#FBFBFD',
    show_outer_border: true,
    outer_border_color: '#B45309', // Classic burnished gold
    outer_border_width: 6,
    show_inner_border: true,
    inner_border_color: '#1E3A8A', // Deep navy
    inner_border_width: 2,
    show_corner_decorations: true,
    corner_color: '#B45309',
    accent_color: '#4F46E5'
  },
  elements: [
    ...DEFAULT_MASTER_TEMPLATE.elements.map((el) => {
      // Adjust text colors for light background
      if (el.id === 'brand-title') return { ...el, color: '#0F172A' };
      if (el.id === 'brand-tagline') return { ...el, color: '#64748B' };
      if (el.id === 'cert-heading') return { ...el, color: '#1E3A8A' };
      if (el.id === 'cert-subheading') return { ...el, color: '#B45309' };
      if (el.id === 'cert-presentation') return { ...el, color: '#475569' };
      if (el.id === 'user-full-name') return { ...el, color: '#0F172A' };
      if (el.id === 'cert-statement') return { ...el, color: '#475569' };
      if (el.id === 'user-course-name') return { ...el, color: '#1E40AF' };
      if (el.id === 'user-package-name') return { ...el, color: '#6D28D9' };
      if (el.id === 'user-tsw-id') return { ...el, color: '#334155' };
      if (el.id === 'user-email') return { ...el, color: '#64748B' };
      if (el.id === 'user-completion-date') return { ...el, color: '#0F172A' };
      if (el.id === 'signature-script') return { ...el, color: '#0F172A' };
      if (el.id === 'qr-renew-label') return { ...el, color: '#1E293B' };
      return el;
    })
  ]
};
