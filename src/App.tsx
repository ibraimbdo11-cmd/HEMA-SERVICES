import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import { EnergyLineProvider, useEnergyLine } from './context/EnergyLineContext';
import { HemaEnergyLine } from './components/HemaEnergyLine';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Logo } from './components/Logo';
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
import { OrderStatusModal, hasSeenOrderStatus } from './components/OrderStatusModal';
import { ServiceItem, OrderItem } from './types';
import { api } from './lib/api';

// Code-splitting for heavy admin dashboard
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function MainApp() {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const energyLine = useEnergyLine();

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

  // Order Status Notification Modal State
  const [statusModalOrder, setStatusModalOrder] = useState<OrderItem | null>(null);

  // Reset customer session state when user changes
  useEffect(() => {
    setSelectedOrderIdForDetails(null);
    setChatOrderContext({});
    setChatOpen(false);
    setUnreadSupportCount(0);
    setStatusModalOrder(null);
  }, [currentUser?.uid]);

  // Unified navigation trigger with HEMA Energy Line pacing
  const handleNavigate = (view: any) => {
    if (view === 'orders' && !currentUser) {
      handleOpenAuth('login');
      return;
    }
    if (view !== currentView) {
      energyLine.start();
    }
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View Service Details
  const handleViewService = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      energyLine.start();
      setSelectedService(srv);
      setCurrentView('service-details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reactive listener to ensure HEMA Energy Line tracks every view change and completes smoothly
  const prevNavKeyRef = useRef<string>(
    `${currentView}-${selectedService?.id || ''}-${selectedOrderIdForDetails || ''}`
  );
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const currentNavKey = `${currentView}-${selectedService?.id || ''}-${selectedOrderIdForDetails || ''}`;
    if (prevNavKeyRef.current !== currentNavKey) {
      prevNavKeyRef.current = currentNavKey;
      energyLine.start();
      const frame = requestAnimationFrame(() => {
        energyLine.complete();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [currentView, selectedService?.id, selectedOrderIdForDetails, energyLine]);

  // Check for unseen order status changes upon user session initialization
  useEffect(() => {
    if (!currentUser || isAdmin) return;

    let isMounted = true;
    const checkUnseenOrderStatus = async () => {
      try {
        const userOrders = await api.getOrders();
        if (!isMounted) return;

        // Find any order whose status has changed and has not been acknowledged in localStorage yet
        const unseenOrder = userOrders.find(
          (o) =>
            o.status !== 'pending_review' &&
            !hasSeenOrderStatus(o.id, o.status, o.statusVersion)
        );

        if (unseenOrder) {
          setStatusModalOrder(unseenOrder);
        }
      } catch {
        // ignore
      }
    };

    checkUnseenOrderStatus();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, isAdmin]);

  // Realtime subscription & sync for support messages and order status changes
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

    // Realtime SSE listener for instant notifications & order status changes
    const unsub = api.subscribeChat({
      userId: currentUser.uid,
      role: isAdmin ? 'admin' : 'user',
      onMessage: (msg) => {
        if (isAdmin ? msg.senderRole === 'user' : msg.senderRole === 'admin') {
          fetchUnreadSupport();
        }
      },
      onConversationUnreadUpdated: (data) => {
        if (!isMounted) return;
        if (isAdmin) {
          fetchUnreadSupport();
        } else if (data.userId === currentUser.uid) {
          setUnreadSupportCount(data.unreadByUser || 0);
        }
      },
      onMessagesRead: () => {
        if (!isMounted) return;
        fetchUnreadSupport();
      },
      onOrderStatusUpdated: (data) => {
        if (!isMounted) return;
        if (data.order && !isAdmin) {
          // Show status notification modal once per status change using localStorage
          if (!hasSeenOrderStatus(data.order.id, data.order.status, data.order.statusVersion)) {
            setStatusModalOrder(data.order);
          }
        }
      },
    });

    const timer = setInterval(fetchUnreadSupport, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
      unsub();
    };
  }, [currentUser, isAdmin]);

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
      <div className="min-h-screen bg-[#06080C] flex flex-col items-center justify-center text-center p-4 selection:bg-emerald-500/20">
        <div className="p-6 rounded-3xl bg-[#0A0E17]/80 border border-white/[0.08] shadow-2xl shadow-black/80 flex flex-col items-center gap-4 animate-pulse">
          <Logo size="lg" />
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00FF9D] shadow-[0_0_8px_rgba(0,255,157,0.8)] animate-ping" />
            <span>CONNECTING SYSTEM...</span>
          </div>
        </div>
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
          <AdminDashboard
            onBackToHome={() => handleNavigate('home')}
            onOpenSupport={handleOpenSupport}
          />
        </Suspense>
      ) : (
        <>
          {/* Header */}
          <Header
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onOpenSupport={(conversationId, orderId, orderNumber) =>
              handleOpenSupport(conversationId, orderId, orderNumber)
            }
            onSelectOrder={(orderId) => {
              setSelectedOrderIdForDetails(orderId);
              handleNavigate('orders');
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
                    onNavigate={handleNavigate}
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
                    onBack={() => handleNavigate('home')}
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
                    onBack={() => handleNavigate('service-details')}
                    onViewOrders={() => handleNavigate('orders')}
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
                    onExploreServices={() => handleNavigate('home')}
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
                    onExploreServices={() => handleNavigate('home')}
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
            onNavigate={handleNavigate}
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
          handleNavigate('orders');
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

      {/* Order Status Notification Modal (Shown once per status change using localStorage) */}
      <OrderStatusModal
        isOpen={!!statusModalOrder}
        order={statusModalOrder}
        onClose={() => setStatusModalOrder(null)}
        onViewOrderDetails={(orderId) => {
          setSelectedOrderIdForDetails(orderId);
          handleNavigate('orders');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <EnergyLineProvider>
            <HemaEnergyLine />
            <MainApp />
          </EnergyLineProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
