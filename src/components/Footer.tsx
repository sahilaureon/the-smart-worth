import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronRight,
  Headphones,
  Ticket,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { usePackages } from '../hooks/usePackages';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../App';

const SOCIAL_ITEMS = [
  {
    name: 'Instagram',
    logo: 'https://i.postimg.cc/QN0fHmXW/IMG-c68d376e-7c68-4297-b4b6-a1459e55ded5.jpg',
    link: '#',
    hoverClass:
      'hover:border-pink-400 hover:bg-gradient-to-tr hover:from-amber-500/35 hover:via-pink-500/35 hover:to-purple-600/35 hover:shadow-[0_0_24px_rgba(236,72,153,0.85)]'
  },
  {
    name: 'Telegram',
    logo: 'https://i.postimg.cc/8z0dhkc5/IMG-8b22611e-c9d1-4408-bec1-9d35345a97c3.png',
    link: '#',
    hoverClass:
      'hover:border-[#38BDF8] hover:bg-[#0088cc]/35 hover:shadow-[0_0_24px_rgba(0,136,204,0.85)]'
  },
  {
    name: 'Email',
    logo: 'https://i.postimg.cc/tgPbh5yD/IMG-c309f663-1e7f-4141-8a24-7ab8148d5c38.png',
    link: 'mailto:helplinesmartworth@gmail.com',
    hoverClass:
      'hover:border-[#F87171] hover:bg-[#EA4335]/35 hover:shadow-[0_0_24px_rgba(234,67,53,0.85)]'
  },
  {
    name: 'WhatsApp',
    logo: 'https://i.postimg.cc/sVHHcyq5/IMG-7c64e7aa-954f-4075-806a-846665d05b98.png',
    link: 'https://wa.me/2250748301420',
    hoverClass:
      'hover:border-[#4ADE80] hover:bg-[#25D366]/35 hover:shadow-[0_0_24px_rgba(37,211,102,0.85)]'
  }
];

const DEFAULT_PACKAGES = [
  { id: 'finance-worth', name: 'Finance Worth' },
  { id: 'creator-worth', name: 'Creator Worth' },
  { id: 'design-worth', name: 'Design Worth' },
  { id: 'video-worth', name: 'Video Worth' }
];

const LEGAL_LINKS = [
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms of Success', path: '/terms-conditions' },
  { name: 'Refund Policy', path: '/refund-policy' },
  { name: 'Disclaimer', path: '/terms-conditions' }
];

const Footer = () => {
  const { packages } = usePackages();
  const { settings } = useSettings();
  const { user } = useAuth();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  const quickLinks = [
    { name: 'Home', path: user ? '/dashboard' : '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' }
  ];

  const displayPackages = packages && packages.length > 0 ? packages : DEFAULT_PACKAGES;
  const ticketPath = user ? '/dashboard/support' : '/contact';
  const brandFirst = settings.site_title?.split(' ')[0] || 'The';
  const brandRest = settings.site_title?.split(' ').slice(1).join(' ') || 'Smart Worth';
  const brandDescription =
    'Discover skills that build your career with The Smart Worth. Learn, grow and create a better future with practical, industry-focused courses and resources.';

  const renderSectionHeading = (title: string) => (
    <h4 className="text-[17px] font-display font-bold text-white tracking-tight flex items-center mb-4">
      <span>{title}</span>
      <span className="ml-2.5 w-2 h-2 rounded-full bg-[#4F6BFF] shadow-[0_0_10px_#4F6BFF] inline-block shrink-0" />
    </h4>
  );

  const renderNavItem = (label: string, to: string, key: string | number) => (
    <li key={key}>
      <Link
        to={to}
        className="group flex items-center justify-between py-1.5 px-3 -mx-3 rounded-lg text-slate-300/90 text-sm font-medium border border-transparent hover:bg-[#101C4E]/85 hover:border-[#3B5BDB]/80 hover:text-[#748FFC] hover:shadow-[0_0_14px_rgba(59,91,219,0.28)] transition-all duration-200"
      >
        <span className="truncate pr-2">{label}</span>
        <ChevronRight
          size={14}
          className="text-slate-400/80 group-hover:text-[#748FFC] group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </Link>
    </li>
  );

  const renderSocialIcons = (centered = false) => (
    <div className={`flex items-center gap-3.5 ${centered ? 'justify-center' : ''}`}>
      {SOCIAL_ITEMS.map((item) => (
        <a
          key={item.name}
          href={item.link}
          target={item.link.startsWith('http') ? '_blank' : undefined}
          rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
          title={item.name}
          className={`group w-12 h-12 rounded-full bg-[#0B1336] border border-[#223372] p-1.5 flex items-center justify-center transition-all duration-300 shadow-[inset_0_0_12px_rgba(79,107,255,0.22)] hover:scale-105 ${item.hoverClass}`}
        >
          <img
            src={item.logo}
            alt={item.name}
            className="w-full h-full rounded-full object-cover shadow-xs"
            referrerPolicy="no-referrer"
          />
        </a>
      ))}
    </div>
  );

  const renderContactItems = (compact = false) => (
    <ul className={compact ? 'space-y-3' : 'space-y-4'}>
      <li className="flex items-start gap-3.5">
        <a
          href="mailto:helplinesmartworth@gmail.com"
          className="w-10 h-10 rounded-xl bg-[#0C153B] border border-[#23367A] flex items-center justify-center text-[#5B7CFA] shadow-[inset_0_0_12px_rgba(91,124,250,0.2)] shrink-0 overflow-hidden p-1.5 hover:border-[#5B7CFA] transition-colors"
        >
          <img
            src="https://i.postimg.cc/tgPbh5yD/IMG-c309f663-1e7f-4141-8a24-7ab8148d5c38.png"
            alt="Email"
            className="w-full h-full object-contain rounded-md"
            referrerPolicy="no-referrer"
          />
        </a>
        <div className="min-w-0">
          <a
            href="mailto:helplinesmartworth@gmail.com"
            className="text-white hover:text-[#748FFC] text-sm font-medium transition-colors block truncate"
          >
            helplinesmartworth@gmail.com
          </a>
          {!compact && (
            <p className="text-xs text-slate-400 mt-0.5">We reply within 24 hours</p>
          )}
        </div>
      </li>

      <li className="flex items-start gap-3.5">
        <a
          href="https://wa.me/2250748301420"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-[#0C153B] border border-[#23367A] flex items-center justify-center text-[#5B7CFA] shadow-[inset_0_0_12px_rgba(91,124,250,0.2)] shrink-0 hover:border-[#5B7CFA] transition-colors"
        >
          <Phone size={17} />
        </a>
        <div className="min-w-0">
          <a
            href="https://wa.me/2250748301420"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#748FFC] text-sm font-medium transition-colors block"
          >
            +225 0748301420
          </a>
          {!compact && (
            <p className="text-xs text-slate-400 mt-0.5">Mon - Sat, 9AM - 6PM</p>
          )}
        </div>
      </li>

      <li className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#0C153B] border border-[#23367A] flex items-center justify-center text-[#5B7CFA] shadow-[inset_0_0_12px_rgba(91,124,250,0.2)] shrink-0">
          <MapPin size={17} />
        </div>
        <div className="min-w-0">
          <span className="text-white text-sm font-medium block">India</span>
          {!compact && (
            <p className="text-xs text-slate-400 mt-0.5">Our global learning community</p>
          )}
        </div>
      </li>
    </ul>
  );

  return (
    <footer className="bg-[#060A22] border-t border-[#1C2A60] pt-8 pb-0 w-full mt-auto flex-1 flex flex-col justify-between relative z-10 overflow-hidden">
      {/* Subtle Ambient Glow inside Footer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(79, 107, 255, 0.14) 0%, transparent 45%), radial-gradient(circle at 82% 68%, rgba(97, 93, 250, 0.12) 0%, transparent 45%)'
        }}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-start">
        {/* =========================================================
            1. DESKTOP LAYOUT (>= 768px) - Renders ONLY ONCE at top
           ========================================================= */}
        <div className="hidden md:block pb-8">
          <div className="grid grid-cols-12 gap-5 xl:gap-6 pb-8">
            {/* Brand Column */}
            <div className="col-span-4 pr-5 border-r border-[#172352] flex flex-col justify-between">
              <div>
                <Link to={user ? '/dashboard' : '/'} className="inline-block">
                  <span className="text-2xl xl:text-3xl font-display font-black tracking-tight leading-none">
                    <span className="text-white">{brandFirst}</span>
                    <span className="bg-gradient-to-r from-[#5B7CFA] to-[#845EF7] bg-clip-text text-transparent ml-1.5">
                      {brandRest}
                    </span>
                  </span>
                  <div className="h-[3px] w-44 bg-gradient-to-r from-[#3B82F6] via-[#615DFA] to-transparent mt-2 rounded-full" />
                </Link>

                <p className="text-slate-300/90 text-xs xl:text-sm leading-relaxed mt-5 pr-2">
                  {brandDescription}
                </p>

                <div className="mt-6">{renderSocialIcons(false)}</div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Follow us for latest updates, offers and learning tips.
              </p>
            </div>

            {/* Quick Links */}
            <div className="col-span-2 px-2.5 border-r border-[#172352]">
              {renderSectionHeading('Quick Links')}
              <ul className="space-y-1.5">
                {quickLinks.map((link) => renderNavItem(link.name, link.path, link.name))}
              </ul>
            </div>

            {/* Packages */}
            <div className="col-span-2 px-2.5 border-r border-[#172352]">
              {renderSectionHeading('Packages')}
              <ul className="space-y-1.5">
                {displayPackages.map((pkg: any) =>
                  renderNavItem(
                    pkg.name,
                    `/packages/${encodeURIComponent(String(pkg.id))}`,
                    pkg.id
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div className="col-span-2 px-2.5 border-r border-[#172352]">
              {renderSectionHeading('Legal')}
              <ul className="space-y-1.5">
                {LEGAL_LINKS.map((link) => renderNavItem(link.name, link.path, link.name))}
              </ul>
            </div>

            {/* Contact Us */}
            <div className="col-span-2 pl-1.5 flex flex-col justify-between">
              <div>
                {renderSectionHeading('Contact Us')}
                {renderContactItems(false)}
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#23367A] via-[#3B5BDB]/50 to-transparent mt-6" />
            </div>
          </div>

          {/* Desktop Bottom 2 Action Cards: Stay Updated & Need Help? */}
          <div className="grid grid-cols-12 gap-5 xl:gap-6 pt-2">
            {/* Stay Updated Card */}
            <div className="col-span-6 bg-[#091132]/90 border border-[#1E2E6B] rounded-2xl p-5 xl:p-6 shadow-[inset_0_0_28px_rgba(59,91,219,0.12)]">
              <div className="flex items-start gap-3.5 xl:gap-4 mb-5">
                <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-[#0D1844] border border-[#263B8A] flex items-center justify-center text-[#5B7CFA] shadow-[0_0_16px_rgba(91,124,250,0.22)] shrink-0 relative">
                  <Mail size={20} />
                  <Sparkles size={10} className="absolute top-2 right-2 text-[#748FFC]" />
                </div>
                <div>
                  <h4 className="text-base xl:text-lg font-display font-bold text-white flex items-center">
                    <span>Stay Updated</span>
                    <span className="ml-2.5 w-2 h-2 rounded-full bg-[#4F6BFF] shadow-[0_0_10px_#4F6BFF]" />
                  </h4>
                  <p className="text-xs xl:text-sm text-slate-300/85 mt-0.5">
                    Get latest courses, offers and updates directly in your inbox.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2.5 bg-[#060B24] border border-[#223477] focus-within:border-[#5B7CFA] rounded-xl px-3.5 py-2.5 xl:px-4 xl:py-3 transition-colors">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-xs xl:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 xl:px-7 xl:py-3 rounded-xl bg-gradient-to-r from-[#4361EE] to-[#5B7CFA] hover:from-[#5271FF] hover:to-[#6B8AFF] text-white font-semibold text-xs xl:text-sm border border-[#748FFC]/60 hover:border-white/80 shadow-[0_0_22px_rgba(67,97,238,0.5)] hover:shadow-[0_0_30px_rgba(91,124,250,0.85)] transition-all cursor-pointer shrink-0"
                >
                  <Send size={14} />
                  <span>{subscribed ? 'Subscribed!' : 'Subscribe'}</span>
                </button>
              </form>
              {subscribed && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2.5 font-medium">
                  <CheckCircle2 size={13} />
                  <span>Thank you for subscribing to The Smart Worth updates!</span>
                </p>
              )}
            </div>

            {/* Need Help? Card */}
            <div className="col-span-6 bg-[#091132]/90 border border-[#1E2E6B] rounded-2xl p-5 xl:p-6 shadow-[inset_0_0_28px_rgba(59,91,219,0.12)] flex flex-col justify-between">
              <div className="flex items-start gap-3.5 xl:gap-4">
                <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-[#0D1844] border border-[#263B8A] flex items-center justify-center text-[#5B7CFA] shadow-[0_0_16px_rgba(91,124,250,0.22)] shrink-0">
                  <Headphones size={21} />
                </div>
                <div>
                  <h4 className="text-base xl:text-lg font-display font-bold text-white flex items-center">
                    <span>Need Help?</span>
                    <span className="ml-2.5 w-2 h-2 rounded-full bg-[#4F6BFF] shadow-[0_0_10px_#4F6BFF]" />
                  </h4>
                  <p className="text-xs xl:text-sm text-slate-300/85 mt-0.5">
                    Facing any issue? Raise a support ticket and our team will help you.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <Link
                  to={ticketPath}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 xl:px-6 xl:py-3 rounded-xl bg-[#081032] hover:bg-[#12205A] text-white font-semibold text-xs xl:text-sm border border-[#3B5BDB] hover:border-[#748FFC] shadow-[0_0_18px_rgba(59,91,219,0.35)] hover:shadow-[0_0_28px_rgba(91,124,250,0.75)] transition-all"
                >
                  <Ticket size={15} className="text-[#5B7CFA]" />
                  <span>Raise a Ticket</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. MOBILE LAYOUT (< 768px) - Matches "Mobile (320px - 480px)"
           ========================================================= */}
        <div className="md:hidden pb-7">
          {/* Centered Brand & Description */}
          <div className="text-center flex flex-col items-center">
            <Link to={user ? '/dashboard' : '/'} className="inline-flex flex-col items-center">
              <span className="text-2xl font-display font-black tracking-tight leading-none">
                <span className="text-white">{brandFirst}</span>
                <span className="bg-gradient-to-r from-[#5B7CFA] to-[#845EF7] bg-clip-text text-transparent ml-1.5">
                  {brandRest}
                </span>
              </span>
              <div className="h-[3px] w-36 bg-gradient-to-r from-transparent via-[#5B7CFA] to-transparent mt-2 rounded-full" />
            </Link>

            <p className="text-slate-300/90 text-xs leading-relaxed mt-4 max-w-sm">
              {brandDescription}
            </p>

            <div className="mt-5">{renderSocialIcons(true)}</div>
          </div>

          {/* Mobile Accordion Sections */}
          <div className="mt-6 border-t border-[#1A2758] divide-y divide-[#1A2758]">
            {/* Quick Links Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('quickLinks')}
                className="w-full py-3.5 flex items-center justify-between text-left text-white font-display font-bold text-base cursor-pointer"
              >
                <span>Quick Links</span>
                {openAccordion === 'quickLinks' ? (
                  <Minus size={18} className="text-[#748FFC]" />
                ) : (
                  <Plus size={18} className="text-slate-300" />
                )}
              </button>
              {openAccordion === 'quickLinks' && (
                <ul className="pb-3 space-y-1">
                  {quickLinks.map((link) => renderNavItem(link.name, link.path, link.name))}
                </ul>
              )}
            </div>

            {/* Packages Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('packages')}
                className="w-full py-3.5 flex items-center justify-between text-left text-white font-display font-bold text-base cursor-pointer"
              >
                <span>Packages</span>
                {openAccordion === 'packages' ? (
                  <Minus size={18} className="text-[#748FFC]" />
                ) : (
                  <Plus size={18} className="text-slate-300" />
                )}
              </button>
              {openAccordion === 'packages' && (
                <ul className="pb-3 space-y-1">
                  {displayPackages.map((pkg: any) =>
                    renderNavItem(
                      pkg.name,
                      `/packages/${encodeURIComponent(String(pkg.id))}`,
                      pkg.id
                    )
                  )}
                </ul>
              )}
            </div>

            {/* Legal Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('legal')}
                className="w-full py-3.5 flex items-center justify-between text-left text-white font-display font-bold text-base cursor-pointer"
              >
                <span>Legal</span>
                {openAccordion === 'legal' ? (
                  <Minus size={18} className="text-[#748FFC]" />
                ) : (
                  <Plus size={18} className="text-slate-300" />
                )}
              </button>
              {openAccordion === 'legal' && (
                <ul className="pb-3 space-y-1">
                  {LEGAL_LINKS.map((link) => renderNavItem(link.name, link.path, link.name))}
                </ul>
              )}
            </div>

            {/* Contact Us Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('contact')}
                className="w-full py-3.5 flex items-center justify-between text-left text-white font-display font-bold text-base cursor-pointer"
              >
                <span>Contact Us</span>
                {openAccordion === 'contact' ? (
                  <Minus size={18} className="text-[#748FFC]" />
                ) : (
                  <Plus size={18} className="text-slate-300" />
                )}
              </button>
              {openAccordion === 'contact' && (
                <div className="pb-4 pt-1">{renderContactItems(false)}</div>
              )}
            </div>
          </div>

          {/* Mobile Newsletter & Raise a Ticket Stack */}
          <form onSubmit={handleSubscribe} className="mt-5 space-y-3">
            <div className="flex items-center gap-2.5 bg-[#060B24] border border-[#223477] focus-within:border-[#5B7CFA] rounded-xl px-3.5 py-3">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#4361EE] to-[#5B7CFA] hover:from-[#5271FF] hover:to-[#6B8AFF] text-white font-semibold text-sm border border-[#748FFC]/60 shadow-[0_0_20px_rgba(67,97,238,0.5)] transition-all cursor-pointer"
            >
              <Send size={15} />
              <span>{subscribed ? 'Subscribed!' : 'Subscribe'}</span>
            </button>

            <Link
              to={ticketPath}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#081032] hover:bg-[#12205A] text-white font-semibold text-sm border border-[#3B5BDB] shadow-[0_0_15px_rgba(59,91,219,0.3)] transition-all"
            >
              <Ticket size={15} className="text-[#5B7CFA]" />
              <span>Raise a Ticket</span>
            </Link>
          </form>
        </div>
      </div>

      {/* =========================================================
          SLIM BLACK & GOLD METALLIC COPYRIGHT BAR
         ========================================================= */}
      <div className="w-full mt-auto px-2 sm:px-4 pb-2 pt-1">
        <div className="max-w-7xl mx-auto">
          {/* Outer 3D Metallic Gold Border Frame */}
          <div className="relative rounded-lg p-[1.5px] bg-gradient-to-r from-[#FDE68A] via-[#C99E32] to-[#FDE68A] shadow-[0_0_20px_rgba(212,175,55,0.25)] overflow-hidden">
            {/* Inner Glossy Obsidian Black Bar */}
            <div className="relative rounded-[6.5px] bg-[#070604] py-2.5 sm:py-3 px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-5 overflow-hidden">
              {/* Left & Right Golden Edge Light Flares */}
              <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 opacity-75"
                style={{
                  background:
                    'radial-gradient(circle at 0% 50%, rgba(253, 224, 110, 0.45) 0%, rgba(212, 175, 55, 0.15) 45%, transparent 75%)'
                }}
              />
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 opacity-75"
                style={{
                  background:
                    'radial-gradient(circle at 100% 50%, rgba(253, 224, 110, 0.45) 0%, rgba(212, 175, 55, 0.15) 45%, transparent 75%)'
                }}
              />

              {/* Left Horizontal Gold Line */}
              <div className="flex-1 h-[1.5px] min-w-[18px] bg-gradient-to-r from-[#FFF3B0] via-[#D4AF37] to-[#8B6B23]/60 shadow-[0_0_6px_rgba(253,230,138,0.65)] rounded-full" />

              {/* Center Crown + Copyright Text */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* 3D Metallic Gold Crown SVG */}
                <svg
                  viewBox="0 0 32 26"
                  className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 drop-shadow-[0_1px_4px_rgba(212,175,55,0.55)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="footerCrownGold" x1="0" y1="0" x2="0" y2="26" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FFF5B8" />
                      <stop offset="45%" stopColor="#E5C158" />
                      <stop offset="80%" stopColor="#B38728" />
                      <stop offset="100%" stopColor="#7A5813" />
                    </linearGradient>
                  </defs>
                  <circle cx="3.5" cy="6.5" r="2" fill="url(#footerCrownGold)" />
                  <circle cx="16" cy="3" r="2.2" fill="url(#footerCrownGold)" />
                  <circle cx="28.5" cy="6.5" r="2" fill="url(#footerCrownGold)" />
                  <path
                    d="M4 8.5L10.5 15L16 5.5L21.5 15L28 8.5L25.5 20H6.5L4 8.5Z"
                    fill="url(#footerCrownGold)"
                  />
                  <rect x="6.5" y="21" width="19" height="2.8" rx="1.2" fill="url(#footerCrownGold)" />
                </svg>

                <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-medium tracking-wide whitespace-nowrap leading-none">
                  <span className="bg-gradient-to-b from-[#FFF3B0] via-[#E5C158] to-[#B38728] bg-clip-text text-transparent font-semibold">
                    © 2024{' '}
                  </span>
                  <span className="text-white font-semibold">The Smart Worth.</span>{' '}
                  <span className="bg-gradient-to-b from-[#FFF3B0] via-[#E5C158] to-[#B38728] bg-clip-text text-transparent font-medium">
                    All rights reserved.
                  </span>
                </p>
              </div>

              {/* Right Horizontal Gold Line */}
              <div className="flex-1 h-[1.5px] min-w-[18px] bg-gradient-to-l from-[#FFF3B0] via-[#D4AF37] to-[#8B6B23]/60 shadow-[0_0_6px_rgba(253,230,138,0.65)] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
