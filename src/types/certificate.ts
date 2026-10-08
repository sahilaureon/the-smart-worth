export interface CertificateElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'seal' | 'signature' | 'badge' | 'custom' | 'shape';
  field_key?: string; // e.g. 'full_name' | 'course_name' | 'package_name' | 'email' | 'completion_date' | 'tsw_id' | 'profile_image' | 'cert_id' | string
  label: string;
  default_text?: string;
  x: number; // 0 to 1200
  y: number; // 0 to 850
  width?: number;
  height?: number;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  font_style?: 'normal' | 'italic';
  color?: string;
  text_align?: 'left' | 'center' | 'right';
  letter_spacing?: number;
  max_width?: number;
  visible: boolean;
  shape?: 'circle' | 'square' | 'rounded';
  border_color?: string;
  border_width?: number;
  background_color?: string;
  shadow?: boolean;
  z_index?: number;
  is_custom?: boolean;
  data_source?: string;
  placeholder?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_enabled: boolean;
  canvas_width: number;
  canvas_height: number;
  theme: {
    background_type: 'navy_gradient' | 'classic_light' | 'image' | 'royal_purple';
    background_color: string;
    background_image?: string;
    show_outer_border: boolean;
    outer_border_color: string;
    outer_border_width: number;
    show_inner_border: boolean;
    inner_border_color: string;
    inner_border_width: number;
    show_corner_decorations: boolean;
    corner_color: string;
    accent_color: string;
  };
  elements: CertificateElement[];
  created_at?: string;
  updated_at?: string;
}

export interface CertificateUserData {
  id?: string;
  full_name: string;
  course_name: string;
  package_name: string;
  email: string;
  completion_date: string;
  tsw_id: string;
  profile_image?: string;
  cert_id?: string;
  instructor_name?: string;
  grade?: string;
  score?: string;
  completion_hours?: string;
  batch_name?: string;
  issue_date?: string;
  valid_until?: string;
  achievement?: string;
  verification_status?: string;
  [key: string]: any;
}

export interface CertificateRecord {
  id: string;
  certificate_id: string;
  candidate_name: string;
  course_name: string;
  certificate_type?: string;
  issue_date?: string;
  completion_date?: string;
  status: 'verified' | 'pending' | 'revoked';
  issued_by?: string;
  verification_url?: string;
  certificate_url?: string;
  user_id?: string;
  email?: string;
  user_name?: string;
  package_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
