import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../App';

const Contact = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'helplinesmartworth@gmail.com',
      link: 'mailto:helplinesmartworth@gmail.com',
      description: 'Send us an email anytime. Our support desk replies within 24 hours.'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Helpline',
      value: '+225 0748301420',
      link: 'https://wa.me/2250748301420',
      description: 'Connect with our support team on WhatsApp for quick assistance.'
    },
    {
      icon: Send,
      title: 'Telegram Channel',
      value: '@TheSmartWorth',
      link: '#',
      description: 'Join our official community channel for platform updates and announcements.'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'The Smart Worth',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'helplinesmartworth@gmail.com',
        telephone: '+225 0748301420',
        contactType: 'customer service'
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Please fill in all required fields before submitting.' });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const response = await fetchApi('/contact', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user?.id || null,
          user_name: fullName.trim(),
          user_email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubject('');
      setMessage('');
      setFeedback({
        type: 'success',
        text: 'Your message has been submitted successfully. Our support team will get back to you shortly.'
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Could not submit your message right now. Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEO
        title="Contact Us | The Smart Worth - Get Support & Inquiries"
        description="Have questions about our courses or platform? Contact The Smart Worth team today. We're here to help you on your digital learning journey."
        structuredData={structuredData}
      />

      <Navbar />
      <PageHeader title="Contact Us" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Classic Top Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <info.icon size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {info.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Official Support Channel</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">{info.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 font-mono truncate">
                  {info.value}
                </span>
                {info.link !== '#' && (
                  <a
                    href={info.link}
                    target={info.link.startsWith('http') ? '_blank' : undefined}
                    rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-semibold uppercase tracking-wider transition-colors shrink-0"
                  >
                    <span>Connect</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Classic Main Form & Contact Information Container */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Classic Support Form */}
            <div className="lg:col-span-7 p-6 sm:p-8">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Support &amp; Inquiry Desk
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Send Us a Message
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Have a specific question, account issue, or need detailed assistance? Complete the form below and we will get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {feedback && (
                  <div
                    className={`p-3.5 rounded-md border flex items-start gap-2.5 text-xs font-semibold ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Account support, course inquiry, or general help"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your query or message in detail..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider border border-slate-900 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Classic Contact Information Directory */}
            <div className="lg:col-span-5 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Official Directory
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Contact Information
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    We are here to help you on your journey to financial and personal growth. Reach out to us through any of the official details below.
                  </p>
                </div>

                {/* Classic Data Table for Contact Info */}
                <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-200 text-xs">
                  <div className="p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Mail size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Email Address
                      </p>
                      <a
                        href="mailto:helplinesmartworth@gmail.com"
                        className="font-bold text-slate-900 hover:underline break-all block mt-0.5"
                      >
                        helplinesmartworth@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Phone size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        WhatsApp Support
                      </p>
                      <a
                        href="https://wa.me/2250748301420"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-slate-900 font-mono hover:underline block mt-0.5"
                      >
                        +225 0748301420
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Working Hours
                      </p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        Mon - Sat: 9:00 AM - 6:00 PM IST
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Location
                      </p>
                      <p className="font-bold text-slate-900 mt-0.5">India</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-white border border-slate-200 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-slate-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  All support tickets and inquiries are logged directly with our administration team for priority resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
