import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  Home,
  Package,
  Info,
  Shield,
} from 'lucide-react';

interface TopMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}) => {
  const { isAdmin } = useAuth();

  // Handle ESC key & scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onClose();
  };

  const navItems = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
    },
    {
      id: 'orders',
      label: 'طلباتي',
      icon: Package,
    },
    {
      id: 'about',
      label: 'عن المنصة',
      icon: Info,
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'لوحة التحكم الإدارية',
      icon: Shield,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 overflow-hidden pointer-events-none" dir="rtl">
          {/* 1. Backdrop Overlay (Below the Header at top-16) */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={onClose}
            className="fixed inset-0 top-16 bg-black/70 backdrop-blur-sm cursor-pointer pointer-events-auto"
            aria-hidden="true"
          />

          {/* 2. Side Drawer (Slides from Right to Left for RTL, Under the Header) */}
          <motion.aside
            key="drawer-panel"
            id="mobile-side-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الجانبية"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 350,
              mass: 0.7,
            }}
            className="fixed top-16 right-0 bottom-0 z-40 h-[calc(100dvh-4rem)] w-72 sm:w-80 max-w-[85vw] bg-[#080b11] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-right select-none pointer-events-auto"
          >
            {/* Drawer Top: Logo on the right of site name */}
            <div className="p-5 border-b border-white/[0.07] bg-[#0c1018] flex items-center shrink-0">
              <Logo
                iconPosition="right"
                onClick={() => {
                  onNavigate('home');
                  onClose();
                }}
              />
            </div>

            {/* Navigation Links: Borderless, Large & Bold Arabic font, Green on Hover/Active */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`drawer-nav-item-${item.id}`}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-right transition-all duration-150 group cursor-pointer select-none active:scale-[0.98] ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                        : 'bg-transparent text-slate-100 hover:bg-emerald-500 hover:text-slate-950 active:bg-emerald-500 active:text-slate-950 font-bold'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                        isActive
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-white/[0.05] text-emerald-400 group-hover:bg-slate-950/15 group-hover:text-slate-950 group-active:bg-slate-950/15 group-active:text-slate-950'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-base sm:text-lg font-bold font-cairo block truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
