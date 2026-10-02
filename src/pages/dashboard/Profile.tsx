import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Zap, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail, 
  ExternalLink,
  Shield,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../App';
import { cn } from '../../lib/utils';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';
import LoadingScreen from '../../components/LoadingScreen';
import { fetchApi } from '../../lib/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [packageName, setPackageName] = useState<string>('Loading...');
  const [stats, setStats] = useState<any>({
    courses: 0,
    certs: 0,
    referrals: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Profile
        const response = await fetchApi(`/profile/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        const profile = await response.json();
        
        if (profile) {
          setUserData(profile);
          
          // 2. Package
          if (profile.package_id) {
            const pkgRes = await fetchApi(`/packages/${profile.package_id}`);
            if (pkgRes.ok) {
              const pkg = await pkgRes.json();
              setPackageName(pkg.name || 'No Package');
            }
          }

          // 3. Stats - Using new user-stats endpoint
          const statsRes = await fetchApi(`/user-stats/${user.id}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats({
              courses: statsData.enrollments_count || 0,
              certs: 0, // Need to implement certificates count endpoint
              referrals: statsData.referrals_count || 0
            });
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <LoadingScreen fullScreen={false} />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Hero / Cover Section */}
      <div className="relative h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 opacity-95" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        </div>
        
        {/* Profile Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row md:items-end md:justify-between space-y-6 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-8">
            {/* Avatar */}
            <div className="relative group/avatar shrink-0">
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-[2.5rem] bg-white p-1.5 shadow-2xl relative z-10 transition-transform group-hover/avatar:scale-[1.02]">
                <div className="w-full h-full rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                  {userData?.profile_pic ? (
                    <img 
                      src={optimizeCloudinaryUrl(userData.profile_pic, 400, 400)} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-4xl md:text-5xl font-black text-indigo-600">
                      {userData?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pb-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-white text-3xl md:text-5xl font-display font-black tracking-tight">{userData?.full_name || 'Anonymous User'}</h1>
                {userData?.is_verified && (
                  <div className="bg-white/20 backdrop-blur-md p-1 rounded-full text-white" title="Verified Creator">
                    <CheckCircle2 size={24} fill="#4F46E5" className="text-white" />
                  </div>
                )}
              </div>
              {userData?.tsw_id && (
                <p className="text-indigo-200/80 font-mono text-sm font-black tracking-widest uppercase">ID: {userData.tsw_id}</p>
              )}
              <div className="flex flex-wrap gap-2 md:gap-4">
                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {packageName}
                </span>
                <span className="flex items-center text-white/60 text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Calendar size={14} className="mr-2" />
                  Joined {new Date(userData?.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/dashboard/settings" className="flex-1 md:flex-none px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl shadow-black/10 text-center">
              Edit Settings
            </Link>
            <button 
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({
                    title: `${userData?.full_name}'s Profile`,
                    text: `Check out ${userData?.full_name}'s profile on The Smart Worth!`,
                    url: url
                  });
                } else {
                  navigator.clipboard.writeText(url);
                  // Using a more subtle notification would be better, but keeping it simple
                }
              }}
              className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"
            >
              <ExternalLink size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Info & Stats */}
        <div className="lg:col-span-8 space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Award size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Awards</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.certs}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Impact</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.referrals}</p>
            </div>
          </div>

          {/* Bio & Skills */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <Star size={20} fill="white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Biography</h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                {userData?.bio || "No biography provided yet. This creator is currently busy revolutionizing their worth and building a future of financial independence with The Smart Worth."}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Core Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {(userData?.skills?.length > 0 ? userData.skills : ['Financial Strategy', 'Digital Marketing', 'Wealth Management', 'Leadership', 'Analytics']).map((skill: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-100 hover:border-[#615DFA]/20 hover:bg-white transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          {stats.certs > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <Award className="mr-3 text-amber-500" size={28} />
                Recent Achievements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* We'd fetch actual cert thumbnails here. Using placeholders for now. */}
                {[1, 2].slice(0, stats.certs).map((_, i) => (
                  <div key={i} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Shield size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Badge</p>
                      <h4 className="text-sm font-black text-slate-900">Certificate of Excellence</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Contact */}
        <div className="lg:col-span-4 space-y-8">
          {/* Social Links */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Connect</h3>
            <div className="space-y-3">
              <a href={userData?.instagram_url || "#"} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-transparent hover:border-rose-100 group transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                    <Instagram size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700">Instagram</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-200 group-hover:text-rose-600 transition-all shadow-sm">
                  <ExternalLink size={14} />
                </div>
              </a>
              <a href={userData?.twitter_url || "#"} className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-transparent hover:border-sky-100 group transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sky-500 shadow-sm">
                    <Twitter size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700">Twitter</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sky-200 group-hover:text-sky-500 transition-all shadow-sm">
                  <ExternalLink size={14} />
                </div>
              </a>
              <a href={userData?.linkedin_url || "#"} className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 group transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 shadow-sm">
                    <Linkedin size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700">LinkedIn</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-200 group-hover:text-indigo-700 transition-all shadow-sm">
                  <ExternalLink size={14} />
                </div>
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all group">
                <div className="flex items-center space-x-4 font-bold text-sm">
                  <Mail size={18} />
                  <span>Email Securely</span>
                </div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all group">
                <div className="flex items-center space-x-4 font-bold text-sm">
                  <MessageSquare size={18} />
                  <span>Live Support</span>
                </div>
                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-600 group-hover:bg-white/20 group-hover:text-white text-[8px] font-black rounded-md">LIVE</div>
              </button>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

const ChevronRight = ({ className, size }: { className?: string, size: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
