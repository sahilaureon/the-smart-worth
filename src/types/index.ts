export interface User {
  uid: string;
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  country: string;
  state: string;
  referralCode: string;
  referredBy?: string;
  packageId?: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  gst: number;
  description: string;
  features: string[];
  courses: string[];
  books: string[];
  rating?: number;
  enrolledCount?: string;
  discountLabel?: string;
  enrolledCountText?: string;
}

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  videoSource: 'youtube' | 'vimeo';
  videoId: string;
  duration: string;
}

export interface Book {
  id: string;
  title: string;
  cover: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Wallet {
  uid: string;
  pendingBalance: number;
  approvedBalance: number;
  withdrawableBalance: number;
  history: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'referral' | 'withdrawal';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}
