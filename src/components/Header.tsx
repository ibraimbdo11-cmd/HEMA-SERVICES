import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationsPanel } from './NotificationsPanel';
import { UserAccountMenu } from './UserAccountMenu';
import { TopMenu } from './TopMenu';
import { Package, Bell, Headset } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSupport: (conversationId?: string, orderId?: string, orderNumber?: string) => void;
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
  const { unreadCount } = useNotifications();
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile refs
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  // Desktop refs
  const desktopAccountRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);

  // Single active trigger ref for portaled floating UI (ensures exactly one instance is rendered)
  const activeNotifTriggerRef = useRef<HTMLElement | null>(null);
  const activeAccountTriggerRef = useRef<HTMLElement | null>(null);

  // Toggle handlers that bind the clicked button as the active trigger
  const toggleNotif = (triggerEl: HTMLElement | null) => {
    activeNotifTriggerRef.current = triggerEl;
    setIsNotifOpen((prev) => !prev);
    setIsAccountOpen(false);
    setIsTopMenuOpen(false);
  };

  const toggleAccount = (triggerEl: HTMLElement | null) => {
    activeAccountTriggerRef.current = triggerEl;
    setIsAccountOpen((prev) => !prev);
    setIsNotifOpen(false);
    setIsTopMenuOpen(false);
  };

  // Track page scroll for subtle header border/shadow transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userInitial = (profile?.name || currentUser?.displayName || currentUser?.email || 'H')
    .trim()[0]
    .toUpperCase();

  return (
    <>
      <header
        id="global-header"
        className={`sticky top-0 w-full transition-all duration-250 z-50 select-none ${
          isScrolled
            ? 'bg-[#06080C]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/70'
            : 'bg-[#06080C]/85 backdrop-blur-lg border-b border-white/[0.06]'
        }`}
      >
        {/* Subtle glowing top hairline accent */}
        <div
          className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ========================================================================= */}
          {/* 1. MOBILE HEADER — STRUCTURE & BEHAVIOR 100% UNCHANGED (md:hidden)        */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center justify-between h-16 relative">
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
                className={`w-10 h-10 rounded-[12px] border flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isTopMenuOpen
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/20'
                    : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-emerald-500/35 hover:text-white hover:bg-white/[0.07]'
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
                    className="block h-[2px] w-5 rounded-full origin-center"
                  />
                  {/* Middle line */}
                  <motion.span
                    animate={
                      isTopMenuOpen
                        ? { opacity: 0, scaleX: 0 }
                        : { opacity: 1, scaleX: 1 }
                    }
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="block h-[2px] w-5 rounded-full bg-current origin-center"
                  />
                  {/* Bottom line */}
                  <motion.span
                    animate={
                      isTopMenuOpen
                        ? { rotate: -45, y: -7, backgroundColor: '#34d399' }
                        : { rotate: 0, y: 0, backgroundColor: 'currentColor' }
                    }
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="block h-[2px] w-5 rounded-full origin-center"
                  />
                </div>
              </button>

              {/* 2. User Account Icon */}
              <div className="relative" ref={mobileAccountRef}>
                <button
                  id="header-user-account-btn"
                  onClick={(e) => toggleAccount(e.currentTarget)}
                  className={`relative w-10 h-10 rounded-[12px] border flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer active:scale-95 ${
                    isAccountOpen
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : currentUser
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-500/15'
                      : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-emerald-500/35 hover:text-white hover:bg-white/[0.07]'
                  }`}
                  aria-label="حساب المستخدم"
                >
                  {currentUser ? (
                    profile?.photo ? (
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-[11px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )
                  ) : (
                    <span>حساب</span>
                  )}
                </button>
              </div>

              {/* 3. Notifications Icon */}
              <div className="relative" ref={mobileNotifRef}>
                <button
                  id="header-notifications-btn"
                  onClick={(e) => toggleNotif(e.currentTarget)}
                  className={`relative w-10 h-10 rounded-[12px] border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                    isNotifOpen
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-sm shadow-emerald-500/20'
                      : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-emerald-500/35 hover:text-white hover:bg-white/[0.07]'
                  }`}
                  aria-label="الإشعارات"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      id="unread-notifications-indicator"
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#00FF9D] text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#06080C] shadow-[0_0_6px_rgba(0,255,157,0.8)]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* 4. Orders Button */}
              <button
                id="header-orders-btn"
                onClick={() => {
                  onNavigate('orders');
                  setIsTopMenuOpen(false);
                }}
                className={`h-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 rounded-[12px] text-xs font-bold transition-all duration-200 border cursor-pointer active:scale-95 ${
                  currentView === 'orders'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-sm shadow-emerald-500/15'
                    : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-emerald-500/35 hover:text-white hover:bg-white/[0.07]'
                }`}
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">الطلبات</span>
              </button>
            </div>

            {/* Left Side in RTL: New HEMA Brand Wordmark */}
            <div className="flex items-center">
              <Logo onClick={() => onNavigate('home')} size="md" layout="stacked" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DESKTOP HEADER — REDESIGNED FUTURISTIC AGENCY HEADER (hidden md:flex)  */}
          {/* ========================================================================= */}
          <div className="hidden md:flex items-center justify-between h-18 relative">
            {/* Right Zone in RTL: HEMA Wordmark */}
            <div className="flex items-center gap-4 lg:gap-5">
              <Logo
                onClick={() => {
                  onNavigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                size="md"
                layout="stacked"
                className="hover:opacity-95"
              />
            </div>

            {/* Center Zone: Futuristic Floating Navigation Dock */}
            <nav
              className="flex items-center gap-1 p-1 rounded-full bg-[#0A0E17]/80 backdrop-blur-md border border-white/[0.08] shadow-lg shadow-black/50"
              aria-label="التنقل الرئيسي"
            >
              {/* 1. الرئيسية (Home) */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-cairo transition-all duration-200 cursor-pointer ${
                  currentView === 'home'
                    ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 shadow-[0_0_12px_rgba(0,255,157,0.14)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                الرئيسية
              </button>

              {/* 2. الخدمات (Services) */}
              <button
                type="button"
                onClick={() => {
                  if (currentView !== 'home') {
                    onNavigate('home');
                    setTimeout(() => {
                      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  } else {
                    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold font-cairo text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent transition-all duration-200 cursor-pointer"
              >
                الخدمات
              </button>

              {/* 3. عن المنصة (About) */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-cairo transition-all duration-200 cursor-pointer ${
                  currentView === 'about'
                    ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 shadow-[0_0_12px_rgba(0,255,157,0.14)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                عن المنصة
              </button>

              {/* 4. الطلبات (Orders) */}
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold font-cairo transition-all duration-200 cursor-pointer ${
                  currentView === 'orders'
                    ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 shadow-[0_0_12px_rgba(0,255,157,0.14)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>الطلبات</span>
              </button>
            </nav>

            {/* Left Zone in RTL: Agency Action Controls & User Account */}
            <div className="flex items-center gap-2.5">
              {/* Direct Support Launcher */}
              <button
                type="button"
                onClick={() => onOpenSupport()}
                title="الدعم الفني المباشر"
                className="h-10 px-3.5 rounded-xl bg-[#0A0E17]/80 hover:bg-[#111726] border border-white/[0.08] hover:border-emerald-500/35 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-2 text-xs font-bold font-cairo cursor-pointer active:scale-95 shadow-sm"
              >
                <Headset className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">الدعم الفني</span>
              </button>

              {/* Desktop Notifications Trigger */}
              <div className="relative" ref={desktopNotifRef}>
                <button
                  id="header-desktop-notifications-btn"
                  onClick={(e) => toggleNotif(e.currentTarget)}
                  className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                    isNotifOpen
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(0,255,157,0.15)]'
                      : 'bg-[#0A0E17]/80 text-slate-300 border-white/[0.08] hover:border-emerald-500/35 hover:text-white hover:bg-[#111726]'
                  }`}
                  aria-label="الإشعارات"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      id="desktop-unread-notifications-indicator"
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#00FF9D] text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#06080C] shadow-[0_0_8px_rgba(0,255,157,0.8)]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Desktop User Account Pill */}
              <div className="relative" ref={desktopAccountRef}>
                {currentUser ? (
                  <button
                    id="header-desktop-user-account-btn"
                    onClick={(e) => toggleAccount(e.currentTarget)}
                    className={`h-10 px-3.5 rounded-xl border flex items-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                      isAccountOpen
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(0,255,157,0.15)]'
                        : 'bg-[#0A0E17]/80 text-slate-200 border-white/[0.08] hover:border-emerald-500/35 hover:bg-[#111726] hover:text-white'
                    }`}
                    aria-label="حساب المستخدم"
                  >
                    {profile?.photo ? (
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="w-5.5 h-5.5 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 flex items-center justify-center text-[11px] font-bold font-mono">
                        {userInitial}
                      </div>
                    )}
                    <span className="text-xs font-bold font-cairo max-w-[100px] truncate">
                      {profile?.name || 'حسابي'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_6px_rgba(0,255,157,0.8)]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-emerald-500/25 hover:from-emerald-500/30 hover:to-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-sm shadow-emerald-950/40 transition-all duration-200 flex items-center gap-2 text-xs font-bold font-cairo cursor-pointer active:scale-95"
                  >
                    <span>تسجيل الدخول</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Header Floating Panels (Single source of truth, rendered via Portal without duplication) */}
      <NotificationsPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onSelectOrder={onSelectOrder}
        onOpenSupport={onOpenSupport}
        triggerRef={activeNotifTriggerRef}
      />

      <UserAccountMenu
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        onOpenSupport={onOpenSupport}
        onOpenNotifications={() => {
          activeNotifTriggerRef.current =
            typeof window !== 'undefined' && window.innerWidth >= 768
              ? desktopNotifRef.current
              : mobileNotifRef.current;
          setIsNotifOpen(true);
          setIsAccountOpen(false);
        }}
        triggerRef={activeAccountTriggerRef}
      />

      {/* Side Menu Drawer for Mobile (Structure, behavior and routes 100% preserved) */}
      <TopMenu
        isOpen={isTopMenuOpen}
        onClose={() => setIsTopMenuOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
      />
    </>
  );
};
