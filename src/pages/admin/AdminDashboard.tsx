import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  DashboardOverviewKPI,
  OrderItem,
  OrderStatus,
  ServiceItem,
  UserProfile,
  NotificationItem,
  PlatformSettings,
} from '../../types';
import { AlertCircle } from 'lucide-react';

// Standard Confirmation Modal
import { ConfirmationModal } from '../../components/ConfirmationModal';

// Admin Subcomponents
import { AdminSidebar, AdminTabId } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { AdminOrdersTab } from './components/AdminOrdersTab';
import { AdminServicesTab } from './components/AdminServicesTab';
import { AdminUsersTab } from './components/AdminUsersTab';
import { AdminNotificationsTab } from './components/AdminNotificationsTab';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import {
  ServiceModal,
  RejectionModal,
  ImageLightboxModal,
} from './components/AdminModals';

interface AdminDashboardProps {
  onBackToHome: () => void;
  onOpenSupport?: (conversationId?: string, orderId?: string, orderNumber?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToHome,
  onOpenSupport,
}) => {
  const { isAdmin, currentUser } = useAuth();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Overview Data
  const [kpi, setKpi] = useState<DashboardOverviewKPI>({
    totalUsers: 0,
    totalServices: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Orders Management Data
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [rejectionModalOrder, setRejectionModalOrder] = useState<OrderItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Services Management Data
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [serviceModalMode, setServiceModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingService, setEditingService] = useState<Partial<ServiceItem>>({});
  const [serviceImageUploading, setServiceImageUploading] = useState(false);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<ServiceItem | null>(null);

  // Users Data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Receipt Lightbox State for Orders
  const [adminViewingImage, setAdminViewingImage] = useState<{ url: string; name?: string } | null>(null);

  // Notifications Data
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Settings Data
  const [settings, setSettings] = useState<PlatformSettings>({
    walletName: 'فودافون كاش',
    walletNumber: '01012345678',
    adminEmail: 'admin@hema-services.com',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // ==========================================
  // DATA LOADERS
  // ==========================================

  // Load Overview Data
  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await api.getAdminOverview();
      setKpi(data.kpi);
      setRecentOrders(data.recentOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    try {
      const data = await api.getAdminOrders();
      setOrdersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Services
  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServicesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotificationsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Settings
  const loadSettings = async () => {
    try {
      const data = await api.getConfig();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Switch tabs & fetch data
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'services') loadServices();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab, isAdmin]);

  // Global Refresh Handler
  const handleRefreshCurrentTab = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'overview') await loadOverview();
      else if (activeTab === 'orders') await loadOrders();
      else if (activeTab === 'services') await loadServices();
      else if (activeTab === 'users') await loadUsers();
      else if (activeTab === 'notifications') await loadNotifications();
      else if (activeTab === 'settings') await loadSettings();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Realtime SSE & Heartbeat Subscriptions for Platform Management
  useEffect(() => {
    if (!isAdmin || !currentUser) return;
    let isMounted = true;

    // Presence heartbeat
    api.sendPresenceHeartbeat(currentUser.uid, 'admin').catch(() => {});
    const heartbeat = setInterval(() => {
      api.sendPresenceHeartbeat(currentUser.uid, 'admin').catch(() => {});
    }, 20000);

    const unsub = api.subscribeChat({
      userId: currentUser.uid,
      role: 'admin',
      onNotification: () => {
        if (!isMounted) return;
        loadNotifications();
        loadOrders();
      },
    });

    return () => {
      isMounted = false;
      clearInterval(heartbeat);
      unsub();
    };
  }, [isAdmin, currentUser]);

  // Unauthorized screen
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">غير مصرح بالدخول</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          لوحة التحكم الإدارية مخصصة للمدير العام فقط، تم تقييد الوصول وفقاً لقواعد الحماية والأمان.
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Handle Order Status updates
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, reason);
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      setRejectionModalOrder(null);
      setRejectionReasonText('');
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في تحديث الحالة');
    }
  };

  // Handle Service Image Upload
  const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setServiceImageUploading(true);
      const res = await api.uploadFile(file, file.name);
      setEditingService((prev) => ({ ...prev, image: res.url }));
    } catch (err: any) {
      alert(err.message || 'فشل رفع صورة الخدمة');
    } finally {
      setServiceImageUploading(false);
      if (serviceImageInputRef.current) serviceImageInputRef.current.value = '';
    }
  };

  // Handle Service Save
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService.title || !editingService.shortDescription || !editingService.basePrice) {
      alert('يرجى ملء الحقول المطلوبة');
      return;
    }

    const payload = {
      ...editingService,
      description: editingService.shortDescription,
      image:
        editingService.image ||
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    };

    try {
      if (serviceModalMode === 'add') {
        const created = await api.createService(payload);
        setServicesList((prev) => [created, ...prev]);
      } else if (serviceModalMode === 'edit' && editingService.id) {
        const updated = await api.updateService(editingService.id, payload);
        setServicesList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
      setServiceModalMode(null);
      setEditingService({});
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الخدمة');
    }
  };

  // Handle Delete Service
  const handleDeleteService = async () => {
    if (!deleteConfirmService) return;
    try {
      await api.deleteService(deleteConfirmService.id);
      setServicesList((prev) => prev.filter((s) => s.id !== deleteConfirmService.id));
      setDeleteConfirmService(null);
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الخدمة');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg(false);
    try {
      await api.updateSettings(settings);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Customer Support Dialog directly for an Order or User
  const handleOpenCustomerChat = (order: OrderItem) => {
    onOpenSupport?.(undefined, order.id, order.orderNumber);
  };

  const handleContactUser = (_user: UserProfile) => {
    onOpenSupport?.(undefined, undefined, undefined);
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col md:flex-row antialiased overflow-x-hidden font-cairo">
      {/* SaaS Sidebar (Desktop & Mobile Drawer) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'orders') setSelectedOrder(null);
        }}
        onBackToHome={onBackToHome}
        adminEmail={currentUser?.email || settings.adminEmail}
        stats={{
          pendingOrders: kpi.pendingOrders,
          totalOrders: kpi.totalOrders,
          totalServices: kpi.totalServices,
          totalUsers: kpi.totalUsers,
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <AdminTopBar
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          onRefresh={handleRefreshCurrentTab}
          isRefreshing={isRefreshing}
          pendingOrdersCount={kpi.pendingOrders}
          onNavigateToOrders={() => {
            setOrderFilter('pending_review');
            setSelectedOrder(null);
            setActiveTab('orders');
          }}
          onBackToHome={onBackToHome}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              kpi={kpi}
              recentOrders={recentOrders}
              isLoading={loadingOverview}
              onSelectOrder={(order) => {
                setSelectedOrder(order);
                setActiveTab('orders');
              }}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAddNewService={() => {
                setServiceModalMode('add');
                setEditingService({
                  basePrice: 100,
                  deliverables: ['كود نظيف وموثق', 'دعم فني وضمان'],
                });
              }}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              ordersList={ordersList}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              orderFilter={orderFilter}
              onSetFilter={setOrderFilter}
              onUpdateStatus={handleUpdateOrderStatus}
              onRequestRejectOrder={(order) => {
                setRejectionModalOrder(order);
                setRejectionReasonText('');
              }}
              onOpenCustomerChat={handleOpenCustomerChat}
              onViewImageLightbox={setAdminViewingImage}
            />
          )}

          {activeTab === 'services' && (
            <AdminServicesTab
              servicesList={servicesList}
              onAddNewService={() => {
                setServiceModalMode('add');
                setEditingService({
                  basePrice: 100,
                  deliverables: ['كود نظيف وموثق', 'دعم فني وضمان'],
                });
              }}
              onEditService={(service) => {
                setServiceModalMode('edit');
                setEditingService(service);
              }}
              onDeleteService={setDeleteConfirmService}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersTab
              usersList={usersList}
              onContactUser={handleContactUser}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsTab
              notificationsList={notificationsList}
              onSelectNotification={(notif) => {
                if (notif.orderNumber) {
                  setOrderFilter('all');
                  setActiveTab('orders');
                }
              }}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              onUpdateSettings={setSettings}
              onSaveSettings={handleSaveSettings}
              isSaving={savingSettings}
              isSavedMsg={settingsSavedMsg}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      {/* 1. Add / Edit Service Modal */}
      <ServiceModal
        isOpen={Boolean(serviceModalMode)}
        mode={serviceModalMode}
        editingService={editingService}
        onClose={() => {
          setServiceModalMode(null);
          setEditingService({});
        }}
        onSave={handleSaveService}
        onChangeService={setEditingService}
        imageInputRef={serviceImageInputRef}
        onImageUpload={handleServiceImageUpload}
        isUploadingImage={serviceImageUploading}
      />

      {/* 2. Reject Order Reason Dialog */}
      <RejectionModal
        order={rejectionModalOrder}
        reasonText={rejectionReasonText}
        onChangeReason={setRejectionReasonText}
        onClose={() => {
          setRejectionModalOrder(null);
          setRejectionReasonText('');
        }}
        onConfirm={() => {
          if (rejectionModalOrder) {
            handleUpdateOrderStatus(
              rejectionModalOrder.id,
              'rejected',
              rejectionReasonText.trim()
            );
          }
        }}
      />

      {/* 3. Delete Service Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmService)}
        onClose={() => setDeleteConfirmService(null)}
        onConfirm={handleDeleteService}
        title="حذف الخدمة"
        description="هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive={true}
        icon="trash"
      />

      {/* 4. Lightbox for Orders / Receipts */}
      <ImageLightboxModal
        image={adminViewingImage}
        onClose={() => setAdminViewingImage(null)}
      />
    </div>
  );
};
