import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ServiceDetailsPage } from './pages/ServiceDetailsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { AboutPage } from './pages/AboutPage';
import { AuthModal } from './components/AuthModal';
import { AuthGatePage } from './pages/AuthGatePage';
import { ChatModal } from './components/ChatModal';
import { ServiceOrderModal } from './components/ServiceOrderModal';
import { CustomerSupportFloatingButton } from './components/CustomerSupportFloatingButton';
import { ServiceItem } from './types';
import { api } from './lib/api';

// Code-splitting for heavy admin dashboard
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function MainApp() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<
    'home' | 'service-details' | 'checkout' | 'orders' | 'about' | 'admin'
  >('home');

  // Services
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Service Order Modal State (popup for requesting a service)
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Orders navigation context
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<string | null>(null);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Chat / Customer Support Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [chatOrderContext, setChatOrderContext] = useState<{
    orderId?: string;
    orderNumber?: string;
  }>({});

  // Reset customer session state when user changes
  useEffect(() => {
    setSelectedOrderIdForDetails(null);
    setChatOrderContext({});
    setChatOpen(false);
    setUnreadSupportCount(0);
  }, [currentUser?.uid]);

  // Realtime subscription & sync for support messages unread count
  useEffect(() => {
    if (!currentUser) {
      setUnreadSupportCount(0);
      return;
    }

    let isMounted = true;
    const fetchUnreadSupport = async () => {
      try {
        const { unreadSupportCount } = await api.getUnreadSupportCount();
        if (!isMounted) return;
        setUnreadSupportCount(unreadSupportCount || 0);
      } catch {
        // ignore
      }
    };

    fetchUnreadSupport();

    // Realtime SSE listener for instant notifications
    const unsub = api.subscribeChat({
      userId: currentUser.uid,
      role: 'user',
      onMessage: (msg) => {
        if (msg.senderRole === 'admin') {
          fetchUnreadSupport();
        }
      },
      onConversationUnreadUpdated: (data) => {
        if (!isMounted) return;
        if (data.userId === currentUser.uid) {
          setUnreadSupportCount(data.unreadByUser || 0);
        }
      },
      onMessagesRead: () => {
        if (!isMounted) return;
        fetchUnreadSupport();
      },
    });

    const timer = setInterval(fetchUnreadSupport, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
      unsub();
    };
  }, [currentUser]);

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // View Service Details
  const handleViewService = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      setSelectedService(srv);
      setCurrentView('service-details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Request Service / Open Order Modal
  const handleRequestService = (srv: ServiceItem) => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }
    setSelectedService(srv);
    setOrderModalOpen(true);
  };

  // Open Chat with optional conversation and order context
  const handleOpenSupport = (
    conversationId?: string,
    orderId?: string,
    orderNumber?: string
  ) => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }
    setChatOrderContext({ conversationId, orderId, orderNumber });
    setChatOpen(true);
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  // 1. Loading screen while Firebase checks session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06080e] flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="7 8 3 12 7 16" />
            <line x1="14" y1="4" x2="10" y2="20" strokeWidth="2.4" />
            <polyline points="17 8 21 12 17 16" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider">HEMA SERVICES</p>
      </div>
    );
  }

  // 2. Auth Gate: Show login page on entering the site if not logged in
  if (!currentUser) {
    return <AuthGatePage />;
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* If in admin view, render Admin Workspace directly */}
      {currentView === 'admin' ? (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-center p-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 animate-spin">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 font-cairo">جاري تحميل لوحة التحكم...</p>
            </div>
          }
        >
          <AdminDashboard onBackToHome={() => setCurrentView('home')} />
        </Suspense>
      ) : (
        <>
          {/* Header */}
          <Header
            currentView={currentView}
            onNavigate={(view) => {
              if (view === 'orders' && !currentUser) {
                handleOpenAuth('login');
                return;
              }
              setCurrentView(view as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={handleOpenAuth}
            onOpenSupport={(conversationId, orderId, orderNumber) =>
              handleOpenSupport(conversationId, orderId, orderNumber)
            }
            onSelectOrder={(orderId) => {
              setSelectedOrderIdForDetails(orderId);
              setCurrentView('orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Main Content Pages with smooth fade transitions */}
          <main className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {currentView === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <HomePage
                    services={services}
                    loading={loadingServices}
                    onRequestService={handleRequestService}
                    onViewService={handleViewService}
                    onNavigate={(v) => setCurrentView(v as any)}
                  />
                </motion.div>
              )}

              {currentView === 'service-details' && selectedService && (
                <motion.div
                  key={`service-details-${selectedService.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <ServiceDetailsPage
                    service={selectedService}
                    onBack={() => setCurrentView('home')}
                    onRequestService={handleRequestService}
                  />
                </motion.div>
              )}

              {currentView === 'checkout' && selectedService && (
                <motion.div
                  key={`checkout-${selectedService.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <CheckoutPage
                    service={selectedService}
                    onBack={() => setCurrentView('service-details')}
                    onViewOrders={() => setCurrentView('orders')}
                    onOpenAuth={() => handleOpenAuth('login')}
                    onOpenSupportForOrder={(orderId, orderNumber) =>
                      handleOpenSupport(undefined, orderId, orderNumber)
                    }
                  />
                </motion.div>
              )}

              {currentView === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <OrdersPage
                    onOpenSupportForOrder={(orderId, orderNumber) =>
                      handleOpenSupport(undefined, orderId, orderNumber)
                    }
                    onExploreServices={() => setCurrentView('home')}
                    selectedOrderId={selectedOrderIdForDetails}
                  />
                </motion.div>
              )}

              {currentView === 'about' && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <AboutPage
                    onExploreServices={() => setCurrentView('home')}
                    onOpenSupport={() => handleOpenSupport()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating Customer Support Button */}
          <CustomerSupportFloatingButton
            onClick={() => handleOpenSupport()}
            unreadCount={unreadSupportCount}
          />

          {/* Global Footer */}
          <Footer
            onNavigate={(view) => {
              if (view === 'orders' && !currentUser) {
                handleOpenAuth('login');
                return;
              }
              setCurrentView(view as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSupport={() => handleOpenSupport()}
          />
        </>
      )}

      {/* Service Order Modal (Responsive across all screens) */}
      <ServiceOrderModal
        isOpen={orderModalOpen}
        service={selectedService}
        onClose={() => setOrderModalOpen(false)}
        onSuccessNavigateToOrders={() => {
          setOrderModalOpen(false);
          setCurrentView('orders');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSupportAfterOrder={(orderId, orderNumber) => {
          setOrderModalOpen(false);
          handleOpenSupport(undefined, orderId, orderNumber);
        }}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      {/* Live Chat & Customer Support Modal */}
      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        conversationId={chatOrderContext.conversationId}
        orderId={chatOrderContext.orderId}
        orderNumber={chatOrderContext.orderNumber}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
