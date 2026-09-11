import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

// Ensure storage directories exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hema_db.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Multer storage configuration for backend file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_').substring(0, 30);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB reasonable limit
});

// JSON DB Schema & Initial Data
interface DBStructure {
  settings: {
    walletName: string;
    walletNumber: string;
    adminEmail: string;
  };
  services: any[];
  orders: any[];
  conversations: any[];
  messages: any[];
  users: any[];
  notifications: any[];
}

const initialServices = [
  {
    id: 'srv-web-custom',
    title: 'تصميم وبرمجة المواقع الإلكترونية',
    shortDescription: 'بناء وتطوير مواقع ويب عصرية وسريعة ومتوافقة مع جميع الشاشات ومحركات البحث.',
    description: 'خدمة متكاملة لتصميم وتطوير مواقع الويب الاحترافية للأنشطة التجارية والمشاريع الشخصية. تشمل دراسة الفكرة، تصميم واجهات تفاعلية جذابة، برمجة دقيقة وسريعة، وتهيئة تامة للأجهزة الذكية ومحركات البحث.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    basePrice: 0,
    discountedPrice: 0,
    isDiscounted: false,
    pricingType: 'budget',
    deliverables: [
      'تصميم واجهات UI/UX عصرية حصرية متوافقة مع هويتك',
      'برمجة الموقع وتوافقه مع جميع الشاشات والموبايل',
      'لوحة تحكم سهلة لإدارة وتعديل المحتوى',
      'تهيئة الموقع لمحركات البحث (SEO)',
      'دعم فني وتدريب على إدارة الموقع'
    ],
    additionalInfo: 'التكلفة تحدد بدقة حسب حجم ومتطلبات المشروع.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'srv-mobile-app',
    title: 'تصميم وبرمجة تطبيقات الهاتف',
    shortDescription: 'بناء تطبيقات ذكية فائقة السلاسة لنظامي Android و iOS بتجربة استخدام ممتعة.',
    description: 'تطوير تطبيقات الهواتف الذكية عالية الأداء التي تلبي متطلبات مشروعك. نقوم ببناء التطبيق من مرحلة التصميم والنمذجة حتى الإطلاق، مع التركيز على سهولة الاستخدام والسرعة واستقرار الأداء.',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    basePrice: 0,
    discountedPrice: 0,
    isDiscounted: false,
    pricingType: 'budget',
    deliverables: [
      'تصميم واجهات وتجربة مستخدم (UI/UX) احترافية',
      'تطوير التطبيق لنظامي Android و iOS',
      'ربط الإشعارات الفورية والمحتوى الديناميكي',
      'تجهيز ملفات النشر والتوافق مع المتاجر',
      'دعم فني وصيانة مستمرة'
    ],
    additionalInfo: 'التكلفة تحدد بدقة حسب حجم ومزايا التطبيق المطلوبة.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
];

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, reinitializing', err);
  }

  const initialDB: DBStructure = {
    settings: {
      walletName: process.env.WALLET_NAME || 'المحفظة الإلكترونية',
      walletNumber: process.env.WALLET_NUMBER || '01098765432',
      adminEmail: process.env.ADMIN_EMAIL || 'ibraimbdo11@gmail.com',
    },
    services: initialServices,
    orders: [],
    conversations: [],
    messages: [],
    users: [],
    notifications: [],
  };

  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file', err);
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static serving for uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Check admin authorization
function isAdminRequest(req: express.Request, db: DBStructure): boolean {
  const reqEmail = (req.headers['x-user-email'] as string || '').trim().toLowerCase();
  const reqRole = (req.headers['x-user-role'] as string || '').trim().toLowerCase();
  const reqUserId = (req.headers['x-user-id'] as string || '').trim();
  const adminEmail = (db.settings.adminEmail || 'ibraimbdo11@gmail.com').trim().toLowerCase();
  
  if (reqRole === 'admin') return true;
  if (reqEmail && reqEmail === adminEmail) return true;
  if (reqUserId) {
    const user = db.users.find((u) => u.id === reqUserId);
    if (user && (user.role === 'admin' || user.email?.toLowerCase() === adminEmail)) {
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Platform Settings & Config
app.get('/api/config', (_req, res) => {
  const db = readDB();
  res.json({
    walletName: db.settings.walletName,
    walletNumber: db.settings.walletNumber,
    adminEmail: db.settings.adminEmail,
  });
});

app.put('/api/admin/settings', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  const { walletName, walletNumber, adminEmail } = req.body;
  if (walletName) db.settings.walletName = String(walletName).trim();
  if (walletNumber) db.settings.walletNumber = String(walletNumber).trim();
  if (adminEmail) db.settings.adminEmail = String(adminEmail).trim();

  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// 2. Services Endpoints
app.get('/api/services', (_req, res) => {
  const db = readDB();
  res.json(db.services.filter((s) => s.isActive !== false));
});

app.get('/api/services/:id', (req, res) => {
  const db = readDB();
  const service = db.services.find((s) => s.id === req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'الخدمة غير موجودة' });
  }
  res.json(service);
});

app.post('/api/services', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  const { title, shortDescription, description, image, basePrice, discountedPrice, isDiscounted, deliverables, additionalInfo } = req.body;
  if (!title || !shortDescription || !basePrice) {
    return res.status(400).json({ error: 'يرجى استكمال البيانات المطلوبة للخدمة' });
  }

  const newService = {
    id: `srv-${Date.now()}`,
    title: String(title).trim(),
    shortDescription: String(shortDescription).trim(),
    description: String(description || shortDescription).trim(),
    image: image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    basePrice: Number(basePrice) || 0,
    discountedPrice: Number(discountedPrice) || Number(basePrice),
    isDiscounted: Boolean(isDiscounted),
    deliverables: Array.isArray(deliverables) ? deliverables : ['تسليم ملفات المشروع كاملة', 'دعم فني وتوجيه تشغيلي'],
    additionalInfo: additionalInfo || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  db.services.unshift(newService);
  writeDB(db);
  res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  const idx = db.services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الخدمة غير موجودة' });
  }

  const { title, shortDescription, description, image, basePrice, discountedPrice, isDiscounted, deliverables, additionalInfo } = req.body;
  db.services[idx] = {
    ...db.services[idx],
    title: title !== undefined ? String(title).trim() : db.services[idx].title,
    shortDescription: shortDescription !== undefined ? String(shortDescription).trim() : db.services[idx].shortDescription,
    description: description !== undefined ? String(description).trim() : db.services[idx].description,
    image: image !== undefined ? image : db.services[idx].image,
    basePrice: basePrice !== undefined ? Number(basePrice) : db.services[idx].basePrice,
    discountedPrice: discountedPrice !== undefined ? Number(discountedPrice) : db.services[idx].discountedPrice,
    isDiscounted: isDiscounted !== undefined ? Boolean(isDiscounted) : db.services[idx].isDiscounted,
    deliverables: Array.isArray(deliverables) ? deliverables : db.services[idx].deliverables,
    additionalInfo: additionalInfo !== undefined ? additionalInfo : db.services[idx].additionalInfo,
    updatedAt: new Date().toISOString(),
  };

  writeDB(db);
  res.json(db.services[idx]);
});

app.delete('/api/services/:id', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  const idx = db.services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الخدمة غير موجودة' });
  }

  db.services.splice(idx, 1);
  writeDB(db);
  res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
});

// 3. Orders Endpoints
app.get('/api/orders', (req, res) => {
  const db = readDB();
  const userId = req.query.userId as string;
  const isAdmin = isAdminRequest(req, db);

  if (isAdmin) {
    return res.json(db.orders);
  }

  if (!userId) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى الطلبات' });
  }

  const userOrders = db.orders.filter((o) => o.userId === userId);
  res.json(userOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const isAdmin = isAdminRequest(req, db);
  const userHeader = req.headers['x-user-id'] as string;
  if (!isAdmin && order.userId !== userHeader) {
    return res.status(403).json({ error: 'غير مصرح بعرض هذا الطلب' });
  }

  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const { userId, userName, userEmail, serviceId, customerRequirements, paymentProof, paymentProofFilename, paymentMethod, senderWalletNumber } = req.body;

  if (!userId || !serviceId || !paymentProof) {
    return res.status(400).json({ error: 'يرجى استكمال جميع بيانات الطلب وإرفاق إثبات التحويل' });
  }

  const service = db.services.find((s) => s.id === serviceId);
  const serviceTitle = service ? service.title : 'خدمة برمجية';
  const serviceImg = service ? service.image : '';
  const price = service ? (service.isDiscounted ? service.discountedPrice : service.basePrice) : 0;
  const originalPrice = service ? service.basePrice : price;

  const count = db.orders.length + 1;
  const orderNumber = `HEMA-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    userId,
    userName: userName || 'عميل',
    userEmail: userEmail || '',
    serviceId,
    serviceNameSnapshot: serviceTitle,
    serviceImageSnapshot: serviceImg,
    price,
    originalPrice,
    customerRequirements: customerRequirements ? String(customerRequirements).trim() : 'طلب عبر المحفظة الإلكترونية',
    paymentMethod: paymentMethod || 'المحفظة الإلكترونية',
    senderWalletNumber: senderWalletNumber ? String(senderWalletNumber).trim() : '',
    paymentProof,
    paymentProofFilename: paymentProofFilename || 'receipt.png',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);

  // Increment user orderCount
  const userObj = db.users.find((u) => u.id === userId);
  if (userObj) {
    userObj.orderCount = (userObj.orderCount || 0) + 1;
  }

  // Create Admin Notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: 'admin',
    type: 'new_order',
    title: 'طلب خدمة جديد',
    body: `قام العميل ${userName} بطلب "${serviceTitle}" برقم طلب ${orderNumber}.`,
    relatedOrderId: newOrder.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Create User Confirmation Notification
  db.notifications.unshift({
    id: `notif-${Date.now() + 1}`,
    userId: userId,
    type: 'order_status',
    title: 'تم استلام طلبك بنجاح',
    body: `تم استلام طلبك برقم ${orderNumber} وهو قيد المراجعة حالياً من قبل الإدارة.`,
    relatedOrderId: newOrder.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Automatically ensure a conversation exists for this user/order
  let conv = db.conversations.find((c) => c.userId === userId && c.orderId === newOrder.id);
  if (!conv) {
    conv = {
      id: `conv-${Date.now()}`,
      userId,
      userName: userName || 'عميل',
      userEmail: userEmail || '',
      orderId: newOrder.id,
      orderNumber,
      lastMessage: `تم إنشاء الطلب برقم ${orderNumber}`,
      lastMessageAt: new Date().toISOString(),
      unreadByAdmin: 1,
      unreadByUser: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.conversations.unshift(conv);

    // Initial message in order chat
    db.messages.push({
      id: `msg-${Date.now()}`,
      conversationId: conv.id,
      senderId: 'system',
      senderName: 'HEMA SERVICES',
      senderRole: 'admin',
      type: 'text',
      text: `مرحباً بك! تم تسجيل طلبك برقم ${orderNumber} بنجاح. يمكنك استخدام هذه المحادثة للتواصل المباشر مع الإدارة بخصوص متطلباتك أو إرسال استفساراتك.`,
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بتحديث حالة الطلب' });
  }

  const { status, rejectionReason } = req.body;
  const validStatuses = ['pending_review', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'حالة الطلب غير صالحة' });
  }

  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  order.status = status;
  if (rejectionReason !== undefined) {
    order.rejectionReason = rejectionReason;
  }
  order.updatedAt = new Date().toISOString();

  // Status Arabic mapping for notification
  const statusNames: Record<string, string> = {
    pending_review: 'قيد المراجعة',
    accepted: 'مقبول',
    in_progress: 'جاري التنفيذ',
    completed: 'مكتمل',
    rejected: 'مرفوض',
    cancelled: 'ملغي',
  };

  const notificationTitle =
    status === 'accepted'
      ? 'تم قبول طلبك'
      : status === 'completed'
      ? 'تم اكتمال طلبك'
      : status === 'rejected'
      ? 'تم رفض طلبك'
      : status === 'cancelled'
      ? 'تم إلغاء الطلب'
      : 'تم تحديث حالة طلبك';

  const notificationBody =
    status === 'rejected' && rejectionReason
      ? `تم تحديث حالة طلبك ${order.orderNumber} إلى مرفوض. السبب: ${rejectionReason}`
      : `تم تحديث حالة طلبك ${order.orderNumber} إلى "${statusNames[status]}".`;

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: order.userId,
    type: 'order_status',
    title: notificationTitle,
    body: notificationBody,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json(order);
});

// User cancel order endpoint
app.post('/api/orders/:id/cancel', (req, res) => {
  const db = readDB();
  const userId = req.headers['x-user-id'] as string;
  const isAdmin = isAdminRequest(req, db);

  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  if (!isAdmin && order.userId !== userId) {
    return res.status(403).json({ error: 'غير مصرح بإلغاء هذا الطلب' });
  }

  if (order.status === 'completed') {
    return res.status(400).json({ error: 'لا يمكن إلغاء طلب مكتمل بالفعل' });
  }
  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'الطلب ملغي بالفعل' });
  }

  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();

  // Admin Notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: 'admin',
    type: 'order_status',
    title: 'تم إلغاء طلب من قبل العميل',
    body: `قام العميل ${order.userName} بإلغاء الطلب رقم ${order.orderNumber}.`,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // User Notification
  db.notifications.unshift({
    id: `notif-${Date.now() + 1}`,
    userId: order.userId,
    type: 'order_status',
    title: 'تم إلغاء الطلب بنجاح',
    body: `تم إلغاء طلبك رقم ${order.orderNumber} بنجاح.`,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json({ success: true, order });
});

// 4. File Upload Endpoint (Handled securely via backend)
app.post('/api/upload', upload.single('file') as any, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// SSE Client Registry for Realtime Chat
interface SSEClient {
  id: string;
  res: express.Response;
  userId: string;
  role: 'admin' | 'user';
  conversationId?: string;
}

const sseClients = new Map<string, SSEClient>();

function broadcastSSE(event: string, data: any, filter?: (client: SSEClient) => boolean) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client, id) => {
    try {
      if (!filter || filter(client)) {
        client.res.write(payload);
      }
    } catch {
      sseClients.delete(id);
    }
  });
}

// Presence tracking in-memory
const presenceStore = new Map<string, { lastSeenAt: string; isOnline: boolean; role: string }>();

function updatePresence(userId: string, role: string, isOnline: boolean = true) {
  if (!userId) return;
  presenceStore.set(userId, {
    lastSeenAt: new Date().toISOString(),
    isOnline,
    role,
  });
}

// Heartbeat ping every 15s to keep SSE connections alive
setInterval(() => {
  sseClients.forEach((client, id) => {
    try {
      client.res.write(':heartbeat\n\n');
    } catch {
      sseClients.delete(id);
    }
  });
}, 15000);

// 5. Customer Support & Chat Endpoints

// Realtime SSE Stream Endpoint
app.get('/api/chat/stream', (req, res) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const role = ((req.query.role as string) || 'user') as 'admin' | 'user';
  const conversationId = req.query.convId as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { id: clientId, res, userId, role, conversationId };
  sseClients.set(clientId, client);

  updatePresence(userId, role, true);

  // Send initial connect ack
  res.write(`:connected clientId=${clientId}\n\n`);

  // Broadcast presence
  broadcastSSE('presence', { userId, role, isOnline: true, lastSeenAt: new Date().toISOString() });

  req.on('close', () => {
    sseClients.delete(clientId);
    updatePresence(userId, role, false);
    broadcastSSE('presence', { userId, role, isOnline: false, lastSeenAt: new Date().toISOString() });
  });
});

// Presence & Heartbeat API
app.post('/api/chat/presence', (req, res) => {
  const { userId, role, isOnline } = req.body;
  if (userId) {
    updatePresence(userId, role || 'user', isOnline !== false);
  }
  res.json({ success: true });
});

// Get user presence (for Admin)
app.get('/api/chat/presence/:userId', (req, res) => {
  const { userId } = req.params;
  const userP = presenceStore.get(userId);
  if (!userP) {
    const db = readDB();
    const dbUser = db.users.find((u) => u.id === userId);
    return res.json({
      userId,
      isOnline: false,
      lastSeenAt: dbUser?.lastLoginAt || dbUser?.createdAt || new Date(Date.now() - 3600000).toISOString(),
    });
  }

  const isActuallyOnline = Date.now() - new Date(userP.lastSeenAt).getTime() < 45000;
  res.json({
    userId,
    isOnline: isActuallyOnline,
    lastSeenAt: userP.lastSeenAt,
  });
});

// Get Admin support status (for Client)
app.get('/api/chat/presence-admin/status', (req, res) => {
  let adminOnline = false;
  presenceStore.forEach((val) => {
    if (val.role === 'admin') {
      const diff = Date.now() - new Date(val.lastSeenAt).getTime();
      if (diff < 120000) adminOnline = true;
    }
  });

  res.json({
    isOnline: adminOnline,
    statusText: adminOnline ? 'متصل الآن' : 'خدمة العملاء متاحة للرد',
  });
});

// Typing indicator endpoint
app.post('/api/conversations/:id/typing', (req, res) => {
  const convId = req.params.id;
  const { userId, userName, role, isTyping } = req.body;

  broadcastSSE(
    'typing',
    {
      conversationId: convId,
      userId,
      userName,
      role,
      isTyping: Boolean(isTyping),
    },
    (c) => c.userId !== userId
  );

  res.json({ success: true });
});

app.get('/api/conversations', (req, res) => {
  const db = readDB();
  const isAdmin = isAdminRequest(req, db);
  const userId = req.query.userId as string;

  if (isAdmin) {
    return res.json(db.conversations);
  }

  if (!userId) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول' });
  }

  const userConversations = db.conversations.filter((c) => c.userId === userId);
  res.json(userConversations);
});

app.post('/api/conversations/find-or-create', (req, res) => {
  const db = readDB();
  const { userId, userName, userEmail, orderId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'معرّف المستخدم مطلوب' });
  }

  let conv = db.conversations.find((c) => {
    if (orderId) {
      return c.userId === userId && c.orderId === orderId;
    }
    return c.userId === userId && !c.orderId;
  });

  if (!conv) {
    let orderNum: string | undefined;
    if (orderId) {
      const ord = db.orders.find((o) => o.id === orderId);
      if (ord) orderNum = ord.orderNumber;
    }

    conv = {
      id: `conv-${Date.now()}`,
      userId,
      userName: userName || 'عميل',
      userEmail: userEmail || '',
      orderId: orderId || undefined,
      orderNumber: orderNum,
      lastMessage: 'محادثة جديدة',
      lastMessageAt: new Date().toISOString(),
      unreadByAdmin: 0,
      unreadByUser: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.conversations.unshift(conv);
    writeDB(db);
  }

  res.json(conv);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  let messages = db.messages.filter((m) => m.conversationId === convId);

  // Pagination support
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const before = req.query.before as string;

  if (before) {
    const beforeIdx = messages.findIndex((m) => m.id === before || m.createdAt === before);
    if (beforeIdx !== -1) {
      messages = messages.slice(0, beforeIdx);
    }
  }

  const totalCount = messages.length;
  let returnedMessages = messages;
  if (limit && limit > 0 && messages.length > limit) {
    returnedMessages = messages.slice(messages.length - limit);
  }

  // Mark as read according to caller
  const isAdmin = isAdminRequest(req, db);
  const conv = db.conversations.find((c) => c.id === convId);
  const now = new Date().toISOString();
  let updated = false;

  if (conv) {
    if (isAdmin) {
      conv.unreadByAdmin = 0;
      messages.forEach((m) => {
        if (m.senderRole === 'user' && !m.readAt) {
          m.readAt = now;
          updated = true;
        }
      });
    } else {
      conv.unreadByUser = 0;
      messages.forEach((m) => {
        if (m.senderRole === 'admin' && !m.readAt) {
          m.readAt = now;
          updated = true;
        }
      });
    }
    if (updated) {
      writeDB(db);
      broadcastSSE('messages_read', {
        conversationId: convId,
        readAt: now,
        readByRole: isAdmin ? 'admin' : 'user',
      });
    }
  }

  // If query had pagination, return object with metadata, else return array for compatibility
  if (req.query.limit || req.query.before) {
    res.json({
      messages: returnedMessages,
      totalCount,
      hasMore: limit ? messages.length > limit : false,
    });
  } else {
    res.json(returnedMessages);
  }
});

app.post('/api/conversations/:id/read', (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  const isAdmin = isAdminRequest(req, db);
  const conv = db.conversations.find((c) => c.id === convId);
  const now = new Date().toISOString();
  let updated = false;

  if (conv) {
    if (isAdmin) {
      conv.unreadByAdmin = 0;
      db.messages.forEach((m) => {
        if (m.conversationId === convId && m.senderRole === 'user' && !m.readAt) {
          m.readAt = now;
          updated = true;
        }
      });
    } else {
      conv.unreadByUser = 0;
      db.messages.forEach((m) => {
        if (m.conversationId === convId && m.senderRole === 'admin' && !m.readAt) {
          m.readAt = now;
          updated = true;
        }
      });
    }
    writeDB(db);

    if (updated) {
      broadcastSSE('messages_read', {
        conversationId: convId,
        readAt: now,
        readByRole: isAdmin ? 'admin' : 'user',
      });
    }
  }

  res.json({ success: true });
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }

  const {
    senderId,
    senderName,
    senderRole,
    type,
    text,
    fileUrl,
    fileName,
    fileSize,
    isImage,
    audioUrl,
    audioDuration,
    replyTo,
  } = req.body;

  if (!senderId || !senderRole || !type) {
    return res.status(400).json({ error: 'بيانات الرسالة غير مكتملة' });
  }

  const determinedType = type === 'image' || isImage ? 'image' : (type as 'text' | 'file' | 'audio' | 'image');

  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: convId,
    senderId,
    senderName: senderName || (senderRole === 'admin' ? 'إدارة HEMA SERVICES' : 'العميل'),
    senderRole: senderRole as 'user' | 'admin',
    type: determinedType,
    text: text ? String(text).trim() : undefined,
    fileUrl,
    fileName,
    fileSize,
    isImage: Boolean(determinedType === 'image'),
    audioUrl,
    audioDuration,
    replyTo: replyTo || undefined,
    isDeleted: false,
    isEdited: false,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMsg);

  // Update conversation
  const preview =
    determinedType === 'audio'
      ? 'تسجيل صوتي'
      : determinedType === 'image'
      ? 'صورة مرفقة'
      : determinedType === 'file'
      ? `ملف مرفق: ${fileName || 'ملف'}`
      : text || '';

  conv.lastMessage = preview;
  conv.lastMessageAt = new Date().toISOString();
  conv.updatedAt = new Date().toISOString();

  if (senderRole === 'admin') {
    conv.unreadByUser = (conv.unreadByUser || 0) + 1;
    // Send user notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: conv.userId,
      type: 'new_message',
      title: 'رسالة جديدة من الدعم الفني',
      body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
      relatedConversationId: conv.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    conv.unreadByAdmin = (conv.unreadByAdmin || 0) + 1;
    // Send admin notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'admin',
      type: 'new_message',
      title: `رسالة جديدة من ${conv.userName}`,
      body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
      relatedConversationId: conv.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);

  // Realtime broadcast via SSE to all connected clients!
  broadcastSSE('message_created', {
    conversationId: convId,
    message: newMsg,
  });

  res.status(201).json(newMsg);
});

// Edit message endpoint (text messages only)
app.put('/api/conversations/:convId/messages/:msgId', (req, res) => {
  const db = readDB();
  const { convId, msgId } = req.params;
  const { text } = req.body;
  const isAdmin = isAdminRequest(req, db);
  const reqUserId = ((req.headers['x-user-id'] as string) || '').trim();

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  if (msg.isDeleted) {
    return res.status(400).json({ error: 'لا يمكن تعديل رسالة محذوفة' });
  }

  // Authorization:
  if (msg.senderRole === 'admin' && !isAdmin) {
    return res.status(403).json({ error: 'غير مصرح بتعديل رسائل الإدارة' });
  }
  if (!isAdmin && reqUserId && msg.senderId !== reqUserId) {
    return res.status(403).json({ error: 'يمكنك تعديل رسائلك فقط' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'نص الرسالة مطلوب' });
  }

  msg.text = text.trim();
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  writeDB(db);

  // Broadcast message_updated via SSE
  broadcastSSE('message_updated', {
    conversationId: convId,
    message: msg,
  });

  res.json({ success: true, updatedMessage: msg });
});

// Delete message endpoint (WhatsApp style + admin protection)
app.delete('/api/conversations/:convId/messages/:msgId', (req, res) => {
  const db = readDB();
  const { convId, msgId } = req.params;
  const isAdmin = isAdminRequest(req, db);
  const reqUserId = (req.headers['x-user-id'] as string || '').trim();

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  // If the message was sent by the admin, a customer cannot delete it!
  if (msg.senderRole === 'admin' && !isAdmin) {
    return res.status(403).json({ error: 'لا يمكن حذف رسائل الإدارة' });
  }

  // If normal user, they can only delete their own messages
  if (!isAdmin && reqUserId && msg.senderId !== reqUserId) {
    return res.status(403).json({ error: 'لا يمكنك حذف رسائل مرسلة من مستخدم آخر' });
  }

  // WhatsApp style: mark as deleted
  msg.isDeleted = true;
  msg.text = 'تم حذف هذه الرسالة';
  msg.fileUrl = undefined;
  msg.fileName = undefined;
  msg.fileSize = undefined;
  msg.audioUrl = undefined;
  msg.audioDuration = undefined;

  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    conv.lastMessage = 'تم حذف رسالة';
    conv.updatedAt = new Date().toISOString();
  }

  writeDB(db);

  // Broadcast deletion update via SSE
  broadcastSSE('message_updated', {
    conversationId: convId,
    message: msg,
  });

  res.json({ success: true, message: 'تم حذف الرسالة بنجاح', updatedMessage: msg });
});

// 6. Notifications Endpoints
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  const isAdmin = isAdminRequest(req, db);
  const userId = req.query.userId as string;

  if (isAdmin) {
    const adminNotifs = db.notifications.filter((n) => n.userId === 'admin');
    return res.json(adminNotifs);
  }

  if (!userId) {
    return res.json([]);
  }

  const userNotifs = db.notifications.filter((n) => n.userId === userId);
  res.json(userNotifs);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const db = readDB();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    writeDB(db);
  }
  res.json({ success: true });
});

app.patch('/api/notifications/read-all', (req, res) => {
  const db = readDB();
  const isAdmin = isAdminRequest(req, db);
  const userId = req.query.userId as string;

  if (isAdmin) {
    db.notifications.filter((n) => n.userId === 'admin').forEach((n) => (n.isRead = true));
  } else if (userId) {
    db.notifications.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true));
  }

  writeDB(db);
  res.json({ success: true });
});

// 7. Admin Dashboard Overview & Users
app.get('/api/admin/overview', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  const kpi = {
    totalUsers: db.users.length,
    totalServices: db.services.length,
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter((o) => o.status === 'pending_review').length,
    completedOrders: db.orders.filter((o) => o.status === 'completed').length,
    rejectedOrders: db.orders.filter((o) => o.status === 'rejected').length,
  };

  const recentOrders = db.orders.slice(0, 8);
  res.json({ kpi, recentOrders });
});

app.get('/api/admin/users', (req, res) => {
  const db = readDB();
  if (!isAdminRequest(req, db)) {
    return res.status(403).json({ error: 'غير مصرح بالدخول' });
  }

  res.json(db.users);
});

// Sync user record from Firebase Auth
app.post('/api/users/sync', (req, res) => {
  const db = readDB();
  const { id, name, email, photo } = req.body;
  if (!id || !email) {
    return res.status(400).json({ error: 'بيانات المستخدم غير مكتملة' });
  }

  const now = new Date().toISOString();
  const adminEmail = (db.settings.adminEmail || 'ibraimbdo11@gmail.com').trim().toLowerCase();
  const role = email.trim().toLowerCase() === adminEmail ? 'admin' : 'user';

  let user = db.users.find((u) => u.id === id);
  if (!user) {
    user = {
      id,
      name: name || email.split('@')[0],
      email,
      photo: photo || '',
      role,
      createdAt: now,
      lastLoginAt: now,
      orderCount: 0,
    };
    db.users.unshift(user);

    // Notify admin about new registered user if not admin
    if (role !== 'admin') {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: 'admin',
        type: 'new_user',
        title: 'مستخدم جديد انضم للمنصة',
        body: `انضم المستخدم ${user.name} (${user.email}) إلى المنصة.`,
        isRead: false,
        createdAt: now,
      });
    }
  } else {
    user.name = name || user.name;
    user.email = email;
    user.lastLoginAt = now;
    user.role = role;
    if (photo) user.photo = photo;
  }

  writeDB(db);
  res.json(user);
});

// ----------------------------------------------------
// Production / Development Vite Integration
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HEMA SERVICES server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
