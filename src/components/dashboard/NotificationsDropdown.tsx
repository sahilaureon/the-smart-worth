import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, XCircle, Info, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { fetchApi } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../App';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

const NotificationsDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetchApi(`/notifications/${user.id}`);
      if (!response.ok) {
        setNotifications([]);
        return;
      }
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications via Supabase Realtime (allowed for non-REST ops)
    const channel = supabase
      .channel(`user-notifications-${user?.id}`)
      .on('postgres_changes', { 
        event: '*', 
        table: 'notifications', 
        schema: 'public',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetchApi(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // In a real app we'd have a bulk update endpoint, but for now we iterate or implement it in worker
      // Let's assume we can do it via a special patch or we just handle current list
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetchApi(`/notifications/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'error': return <XCircle className="text-rose-500" size={16} />;
      case 'warning': return <Clock className="text-amber-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-inherit hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-card">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-[#615DFA] uppercase hover:text-[#615DFA]/80 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#615DFA] mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Bell size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-bold">No notifications yet</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">We'll notify you here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "p-4 transition-colors group relative",
                        !notification.is_read ? "bg-[#615DFA]/5" : "hover:bg-slate-50"
                      )}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-bold truncate",
                              !notification.is_read ? "text-slate-900" : "text-slate-600"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
