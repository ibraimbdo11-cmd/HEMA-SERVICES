import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { NotificationsPanel } from './NotificationsPanel';
import { UserAccountMenu } from './UserAccountMenu';
import { TopMenu } from './TopMenu';
import { Package, Bell } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSupport: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenSupport,
  onSelectOrder,
}) => {
  const { currentUser, profile } = useAuth();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Poll notifications periodically
  useEffect(() => {
    let isMounted = true;
    const checkNotifs = async () => {
      try {
        const notifs = await api.getNotifications();
        if (isMounted) {
          const unread = notifs.filter((n) => !n.isRead).length;
          setUnreadNotifCount(unread);
        }
      } catch {
        // silent fail
      }
    };

    checkNotifs();
    const interval = setInterval(checkNotifs, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = (profile?.name || currentUser?.displayName || currentUser?.email || 'H')
    .trim()[0]
    .toUpperCase();

  return (
    <>
      <header
        id="global-header"
        className="sticky top-0 w-full bg-[#080b11]/95 backdrop-blur-md border-b border-slate-800/80 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          {/* Right Side in RTL: Menu Button on the far right, followed by actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 1. Menu Icon with Framer Motion Morph Animation (3 lines <-> X) */}
            <button
              id="header-top-menu-btn"
              type="button"
              onClick={() => {
                setIsTopMenuOpen(!isTopMenuOpen);
                setIsAccountOpen(false);
                setIsNotifOpen(false);
              }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                isTopMenuOpen
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-200 border-white/[0.08] hover:border-emerald-500/40 hover:text-white hover:bg-slate-800/80'
              }`}
              aria-label={isTopMenuOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'}
            >
              <div className="w-5 h-4 relative flex flex-col justify-between items-center pointer-events-none">
                {/* Top line */}
                <motion.span
                  animate={
                    isTopMenuOpen
                      ? { rotate: 45, y: 7, backgroundColor: '#34d399' }
                      : { rotate: 0, y: 0, backgroundColor: 'currentColor' }
                  }
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="block h-[2.5px] w-5 rounded-full origin-center"
                />
                {/* Middle line */}
                <motion.span
                  animate={
                    isTopMenuOpen
                      ? { opacity: 0, scaleX: 0 }
                      : { opacity: 1, scaleX: 1 }
                  }
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="block h-[2.5px] w-5 rounded-full bg-current origin-center"
                />
                {/* Bottom line */}
                <motion.span
                  animate={
                    isTopMenuOpen
                      ? { rotate: -45, y: -7, backgroundColor: '#34d399' }
                      : { rotate: 0, y: 0, backgroundColor: 'currentColor' }
                  }
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="block h-[2.5px] w-5 rounded-full origin-center"
                />
              </div>
            </button>

            {/* 2. User Account Icon */}
            <div className="relative" ref={accountRef}>
              <button
                id="header-user-account-btn"
                onClick={() => {
                  setIsAccountOpen(!isAccountOpen);
                  setIsNotifOpen(false);
                  setIsTopMenuOpen(false);
                }}
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                  isAccountOpen
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : currentUser
                    ? 'bg-gradient-to-br from-emerald-500/20 to-slate-900 text-emerald-400 border-white/[0.08] hover:border-emerald-500/40'
                    : 'bg-slate-900/90 text-slate-300 border-white/[0.08] hover:border-emerald-500/40 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-label="حساب المستخدم"
              >
                {currentUser ? (
                  profile?.photo ? (
                    <img
                      src={profile.photo}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )
                ) : (
                  <span>حساب</span>
                )}
              </button>

              <UserAccountMenu
                isOpen={isAccountOpen}
                onClose={() => setIsAccountOpen(false)}
                onNavigate={onNavigate}
                onOpenAuth={onOpenAuth}
                onOpenSupport={onOpenSupport}
                onOpenNotifications={() => {
                  setIsNotifOpen(true);
                }}
              />
            </div>

            {/* 3. Notifications Icon */}
            <div className="relative" ref={notifRef}>
              <button
                id="header-notifications-btn"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsAccountOpen(false);
                  setIsTopMenuOpen(false);
                }}
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isNotifOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-white/[0.08] hover:border-emerald-500/40 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-label="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span
                    id="unread-notifications-indicator"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-[#080b11]"
                  >
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              <NotificationsPanel
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onSelectOrder={onSelectOrder}
                onOpenSupport={onOpenSupport}
              />
            </div>

            {/* 4. Orders Button */}
            <button
              id="header-orders-btn"
              onClick={() => {
                onNavigate('orders');
                setIsTopMenuOpen(false);
              }}
              className={`h-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                currentView === 'orders'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/90 text-slate-200 border-white/[0.08] hover:border-emerald-500/40 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">الطلبات</span>
            </button>
          </div>

          {/* Left Side in RTL: Logo & Name */}
          <div className="flex items-center">
            <Logo iconPosition="left" onClick={() => onNavigate('home')} />
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <TopMenu
        isOpen={isTopMenuOpen}
        onClose={() => setIsTopMenuOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
      />
    </>
  );
};
