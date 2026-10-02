import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, UserPlus, LayoutDashboard, Package, BookOpen, Award, Wallet, Settings, Shield, Info, Phone, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../App';
import { usePackages } from '../hooks/usePackages';
import { useSettings } from '../contexts/SettingsContext';
import BrutalistButton from './BrutalistButton';

const Navbar = () => {
  const { user, role } = useAuth();
  const { settings } = useSettings();
  const { packages } = usePackages();
  const [userData, setUserData] = useState<any>(null);
  const [packageName, setPackageName] = useState<string>('Loading...');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(() => {
    return localStorage.getItem('sidebar_expanded_item');
  });
  const location = useLocation();

  useEffect(() => {
    if (expandedItem) {
      localStorage.setItem('sidebar_expanded_item', expandedItem);
    } else {
      localStorage.removeItem('sidebar_expanded_item');
    }
  }, [expandedItem]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = role === 'admin' || user?.email === 'helplinesmartworth@gmail.com';

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    
    const fetchUserData = async () => {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserData(data);
        if (data.package_id) {
          const { data: pkgData } = await supabase
            .from('packages')
            .select('name')
            .eq('id', data.package_id)
            .maybeSingle();
          if (pkgData) {
            setPackageName(pkgData.name);
          } else {
            setPackageName('No Package');
          }
        } else {
          setPackageName('No Package');
        }
      }
    };

    fetchUserData();
  }, [user]);

  const navLinks = user ? [
    { name: 'Dashboard', path: '/dashboard' },
  ] : [
    { name: 'Home', path: '/' },
    { name: 'Packages', path: '/packages' },
    { name: 'Courses', path: '/courses' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const sidebarLinks = user ? [
    { name: 'Dashboard', path: '/dashboard' },
  ] : [
    { name: 'Home', path: '/' },
    { name: 'Packages', path: '/packages', hasSubmenu: true },
    { name: 'Courses', path: '/courses' },
    { name: 'Blog', path: '/blog' },
    { name: 'About Us', path: '/about' },
    { name: 'Contacts', path: '/contact' },
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-[#0A0E27]/95 backdrop-blur-md shadow-lg py-3" : "bg-[#0A0E27] py-4 border-b border-white/5 shadow-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo - Column 1 */}
            <div className="flex-1 lg:flex-none">
              <Link to={user ? "/dashboard" : "/"} className="flex items-center">
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-display font-black tracking-tighter leading-none">
                    <span className="text-white">{settings.site_title?.split(' ')[0] || 'The'}</span>
                    <span className="text-white ml-1">{settings.site_title?.split(' ').slice(1).join(' ') || 'Smart Worth'}</span>
                  </span>
                  <div className="h-[2px] w-full bg-[#00A3FF] mt-0.5 rounded-full" />
                </div>
              </Link>
            </div>

            {/* Desktop Links - Column 2 (Centered) */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "text-[15px] font-bold transition-all relative group py-2",
                      location.pathname === link.path ? "text-white" : "text-white/60 hover:text-white"
                    )}
                  >
                    {link.name}
                    {location.pathname === link.path && (
                      <motion.div 
                        layoutId="navUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00A3FF] rounded-full"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side Actions - Column 3 */}
            <div className="hidden md:flex flex-1 lg:flex-none justify-end">
              {!user ? (
                <Link
                  to="/register"
                  className="px-8 py-2.5 rounded-full bg-[#615DFA] text-white text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-[#615DFA]/30 active:scale-95 whitespace-nowrap"
                >
                  Login/Register
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-8 py-2.5 rounded-full bg-[#615DFA] text-white text-sm font-black hover:bg-[#4F46E5] transition-all shadow-xl shadow-[#615DFA]/30 active:scale-95 whitespace-nowrap"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button - Column 3 for Mobile */}
            <div className="md:hidden">
              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-[#615DFA] rounded-xl text-white shadow-[0_4px_12px_rgba(97,93,250,0.3)] transition-all active:scale-95"
                >
                  <Menu size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Sidebar - Moved outside nav tag to prevent layout issues */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-[70] md:hidden flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              {/* Sidebar Header - White with border as requested */}
              <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
                <Link to={user ? "/dashboard" : "/"} onClick={() => setIsOpen(false)} className="flex items-center">
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-display font-black tracking-tighter leading-none">
                      <span className="text-[#0A0E27]">{settings.site_title?.split(' ')[0] || 'The'}</span>
                      <span className="text-[#615DFA] ml-1">{settings.site_title?.split(' ').slice(1).join(' ') || 'Smart Worth'}</span>
                    </span>
                    <div className="h-[2px] w-full bg-[#615DFA] mt-0.5 rounded-full" />
                  </div>
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-secondary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

                {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {/* User Profile Section (If logged in) */}
                {user && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        {userData?.profile_pic ? (
                          <img 
                            src={userData.profile_pic} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white font-black text-xl border-2 border-white shadow-sm">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {packageName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="pt-2 pb-0">
                  {sidebarLinks.map((link) => (
                    <div key={link.name} className="border-b border-gray-50 last:border-0">
                      {link.hasSubmenu ? (
                        <>
                          <div
                            className={cn(
                              "w-full flex items-center justify-between px-6 py-4 transition-all border-b border-gray-100 relative overflow-hidden",
                              location.pathname === link.path
                                ? "bg-secondary/10 text-[#615DFA]"
                                : "bg-white text-[#0A0E27] hover:bg-gray-50"
                            )}
                          >
                            {location.pathname === link.path && (
                              <motion.div
                                layoutId="activeLightMobile"
                                className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#615DFA] shadow-[0_0_20px_rgba(97,93,250,0.8)]"
                              />
                            )}
                            <Link
                              to={link.path}
                              onClick={() => setIsOpen(false)}
                              className="flex-1 flex items-center py-1 pr-4"
                            >
                              <span
                                className={cn(
                                  "text-lg font-bold tracking-tight transition-colors",
                                  location.pathname === link.path ? "text-[#615DFA]" : "text-[#0A0E27]"
                                )}
                              >
                                {link.name}
                              </span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedItem(expandedItem === link.name ? null : link.name);
                              }}
                              aria-label={`Toggle ${link.name} list`}
                              className="w-8 h-8 flex items-center justify-center rounded-md transition-all bg-[#615DFA] hover:bg-[#4F46E5] active:scale-95 shrink-0 cursor-pointer"
                            >
                              <span className="text-xl font-bold text-white leading-none mb-1">
                                {expandedItem === link.name ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {expandedItem === link.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-white"
                              >
                                {packages.map((pkg) => {
                                  const encodedPkgId = encodeURIComponent(String(pkg.id));
                                  const pkgDetailsPath = `/packages/${encodedPkgId}`;
                                  const isActive =
                                    location.pathname === pkgDetailsPath ||
                                    location.pathname === `/packages/${pkg.id}` ||
                                    location.pathname === `/package/${encodedPkgId}` ||
                                    location.pathname === `/package/${pkg.id}`;
                                  
                                  return (
                                    <Link
                                      key={pkg.id}
                                      to={pkgDetailsPath}
                                      state={{ pkg }}
                                      onClick={() => setIsOpen(false)}
                                      className={cn(
                                        "flex items-center justify-start px-10 py-3 text-lg font-bold transition-colors border-b border-gray-100 relative overflow-hidden",
                                        isActive ? "bg-secondary/10 text-[#615DFA]" : "text-[#0A0E27] hover:bg-gray-50"
                                      )}
                                    >
                                      {isActive && (
                                        <motion.div 
                                          layoutId="activePackageLight"
                                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#615DFA] shadow-[0_0_15px_rgba(97,93,250,0.6)]"
                                        />
                                      )}
                                      <div className={cn(
                                        "w-2.5 h-2.5 rounded-full mr-5 shrink-0 shadow-sm transition-colors",
                                        isActive ? "bg-[#615DFA] shadow-[0_0_8px_rgba(97,93,250,0.4)]" : "bg-[#0A0E27]"
                                      )} />
                                      <span className="truncate">{pkg.name}</span>
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center px-6 py-5 transition-all relative overflow-hidden border-b border-gray-100",
                            location.pathname === link.path 
                              ? "bg-secondary/10 text-[#615DFA]" 
                              : "text-[#0A0E27] hover:bg-gray-50"
                          )}
                        >
                          {location.pathname === link.path && (
                            <motion.div 
                              layoutId="activeLightMobile"
                              className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#615DFA] shadow-[0_0_20px_rgba(97,93,250,0.8)]"
                            />
                          )}
                          <div className="flex items-center">
                            <span className="text-lg font-bold tracking-tight">{link.name}</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                  
                  {isAdmin && (
                    <div className="border-b border-gray-50">
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center px-6 py-4 transition-all relative overflow-hidden",
                          location.pathname.startsWith('/admin')
                            ? "bg-red-50 text-red-600" 
                            : "text-[#0A0E27] hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        {location.pathname.startsWith('/admin') && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
                        )}
                        <span className="text-lg font-bold">Admin Panel</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 mt-auto border-t border-gray-100 bg-white">
                {!user ? (
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 rounded-full bg-secondary text-white font-bold text-center shadow-lg shadow-secondary/20 transition-transform active:scale-95 block"
                  >
                    Login/Register
                  </Link>
                ) : (
                  <button
                    onClick={async () => {
                      const { supabase } = await import('../lib/supabase');
                      await supabase.auth.signOut();
                      setIsOpen(false);
                      window.location.href = '/login';
                    }}
                    className="w-full py-4 rounded-full bg-red-50 text-red-600 font-bold text-center transition-transform active:scale-95 block"
                  >
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
