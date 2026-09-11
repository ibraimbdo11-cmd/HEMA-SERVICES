import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// ----------------------------------------------------
// FIREBASE ADMIN INITIALIZATION
// ----------------------------------------------------
const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'hema-services-1ffb7';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseProjectId,
  });
}

const firebaseAuth = getAuth();

const app = express();
const PORT = 3000;

// Increase body parser limits for handling larger payloads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ----------------------------------------------------
// DATABASE & PERSISTENCE (In-Memory JSON DB)
// ----------------------------------------------------
const DB_PATH = path.join(process.cwd(), 'hema_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const ALLOWED_UPLOAD_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
  '.xls', '.xlsx', '.csv', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.webm', '.ogg', '.mp3', '.m4a', '.wav', '.aac',
]);

const DANGEROUS_UPLOAD_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.js', '.mjs', '.cjs', '.ts', '.py', '.rb', '.pl', '.cgi', '.jar', '.vbs', '.ps1',
  '.msi', '.apk', '.com', '.scr', '.pif', '.hta', '.html', '.htm', '.asp', '.aspx',
  '.jsp', '.svg', '.xml', '.xhtml',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = ALLOWED_UPLOAD_EXTS.has(rawExt) ? rawExt : '.bin';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    if (DANGEROUS_UPLOAD_EXTS.has(rawExt)) {
      return cb(new Error('INVALID_FILE_DANGEROUS'));
    }
    if (!ALLOWED_UPLOAD_EXTS.has(rawExt)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

interface UploadRecord {
  filename: string;
  originalName: string;
  uploaderId: string;
  size: number;
  mimetype: string;
  createdAt: string;
}

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
  uploads: UploadRecord[];
}

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.uploads) parsed.uploads = [];
      return parsed;
    }
  } catch (err) {
    console.error('Error reading DB, using default structure', err);
  }

  const defaultDB: DBStructure = {
    settings: {
      walletName: 'فودافون كاش / المحافظ الإلكترونية',
      walletNumber: '01012345678',
      adminEmail: 'ibraimbdo11@gmail.com',
    },
    services: [
      {
        id: 'srv-1',
        title: 'تطوير المواقع والمتاجر الإلكترونية',
        shortDescription: 'تصميم وبرمجة مواقع حديثة ومتجاوبة بأعلى معايير السرعة والأمان.',
        description: 'نقدم لك حلولاً برمجية متكاملة لإنشاء موقع شركتك أو متجرك الإلكتروني بأحدث التقنيات مع دعم كامل للسيو ولوحة تحكم متطورة.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        basePrice: 1500,
        discountedPrice: 1200,
        isDiscounted: true,
        deliverables: ['تصميم متجاوب بالكامل مع الموبايل', 'لوحة تحكم ديناميكية وسهلة', 'ربط بوابات الدفع والشحن', 'تهيئة محركات البحث الأساسية'],
        additionalInfo: 'يتم التسليم خلال 5 إلى 10 أيام عمل حسب حجم المشروع.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'srv-2',
        title: 'تطوير تطبيقات الجوال (iOS & Android)',
        shortDescription: 'تطبيقات جوال سريعة وسلسة بأداء عالٍ وتجربة مستخدم استثنائية.',
        description: 'برمجة تطبيقات للهواتف الذكية بنظامي Android و iOS باستخدام أحدث تقنيات Flutter و React Native مع لوحة إدارة كاملة.',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        basePrice: 3500,
        discountedPrice: 2900,
        isDiscounted: true,
        deliverables: ['تطبيق يعمل على أندرويد وآبل', 'إشعارات فورية وسريعة', 'واجهات مستخدم تفاعلية وجذابة', 'رفع التطبيق على المتاجر الرسمية'],
        additionalInfo: 'يتضمن الدعم الفني المجاني لمدة شهر بعد التسليم.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'srv-3',
        title: 'تكامل الذكاء الاصطناعي وبوتات المحادثة',
        shortDescription: 'دمج تقنيات الذكاء الاصطناعي التوليدي لخدمة العملاء وأتمتة المهام.',
        description: 'بناء شات بوت ذكي مخصص لنشاطك التجاري، مساعدين أذكياء لتحليل البيانات، وتكامل كامل مع نماذج Gemini و ChatGPT.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        basePrice: 2000,
        discountedPrice: 1600,
        isDiscounted: true,
        deliverables: ['شات بوت ذكي لخدمة العملاء 24/7', 'تدريب البوت على بيانات مشروعك', 'تكامل مع واتساب أو موقعك', 'لوحة إحصائيات للمحادثات'],
        additionalInfo: 'توفير استهلاك فعال للـ API وأداء سريع للغاية.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'srv-4',
        title: 'حلول وتطوير واجهات برمجة التطبيقات (APIs)',
        shortDescription: 'بناء خوادم وخدمات سحابية آمنة ومستقرة للربط والربط البيني.',
        description: 'تصميم وبناء Restful APIs و GraphQL عالية الأمان وقابلة للتوسع للشركات والأنظمة المعقدة.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        basePrice: 1800,
        discountedPrice: 1800,
        isDiscounted: false,
        deliverables: ['توثيق كامل للـ API بواسطة Swagger', 'تأمين بنظام JWT و OAuth2', 'قواعد بيانات سريعة ومحسنة', 'اختبارات ضغط وأمان'],
        additionalInfo: 'التسليم مع كود المصدر كامل وموثق.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
    ],
    orders: [],
    conversations: [],
    messages: [],
    users: [],
    notifications: [],
    uploads: [],
  };

  writeDB(defaultDB);
  return defaultDB;
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB', err);
  }
}

// ----------------------------------------------------
// CONCURRENCY CONTROL: IN-MEMORY PER-USER MUTEX LOCK
// ----------------------------------------------------
const userLocks = new Map<string, Promise<any>>();

async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  while (userLocks.has(userId)) {
    try {
      await userLocks.get(userId);
    } catch {
      // ignore previous lock errors
    }
  }

  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  userLocks.set(userId, lockPromise);

  try {
    return await fn();
  } finally {
    userLocks.delete(userId);
    releaseLock!();
  }
}

// ----------------------------------------------------
// HISTORICAL CONVERSATION NORMALIZATION & MIGRATION
// ----------------------------------------------------
function normalizeAndMigrateConversations(db: DBStructure): boolean {
  let changed = false;

  const convsByUser = new Map<string, any[]>();
  for (const conv of db.conversations) {
    if (!conv.userId) continue;
    const list = convsByUser.get(conv.userId) || [];
    list.push(conv);
    convsByUser.set(conv.userId, list);
  }

  const normalizedConversations: any[] = [];

  for (const [userId, convList] of convsByUser.entries()) {
    if (convList.length === 1) {
      normalizedConversations.push(convList[0]);
      continue;
    }

    changed = true;
    console.log(`[CANONICAL MIGRATION] Consolidating ${convList.length} conversations for customer: ${userId}`);

    // Sort to determine canonical: prefer one without orderId, or earliest created
    convList.sort((a, b) => {
      if (!a.orderId && b.orderId) return -1;
      if (a.orderId && !b.orderId) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const canonical = convList[0];
    const nonCanonical = convList.slice(1);
    const nonCanonicalIds = new Set(nonCanonical.map((c) => c.id));

    // Map old conversation IDs to order context
    const oldConvOrderMap = new Map<string, { orderId?: string; orderNumber?: string }>();
    for (const c of convList) {
      oldConvOrderMap.set(c.id, { orderId: c.orderId, orderNumber: c.orderNumber });
    }

    // Re-point all messages from non-canonical conversations into canonical, preserving order context
    for (const msg of db.messages) {
      if (nonCanonicalIds.has(msg.conversationId)) {
        const oldCtx = oldConvOrderMap.get(msg.conversationId);
        if (oldCtx?.orderId && !msg.orderId) {
          msg.orderId = oldCtx.orderId;
          msg.orderNumber = oldCtx.orderNumber;
        }
        msg.conversationId = canonical.id;
      }
    }

    // Re-point notifications
    for (const notif of db.notifications) {
      if (notif.relatedConversationId && nonCanonicalIds.has(notif.relatedConversationId)) {
        notif.relatedConversationId = canonical.id;
      }
    }

    // Recompute last message from merged messages
    const allUserMessages = db.messages
      .filter((m) => m.conversationId === canonical.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (allUserMessages.length > 0) {
      const lastMsg = allUserMessages[allUserMessages.length - 1];
      canonical.lastMessage =
        lastMsg.type === 'image'
          ? 'صورة مرفقة'
          : lastMsg.type === 'file'
          ? `ملف مرفق: ${lastMsg.fileName || 'ملف'}`
          : lastMsg.type === 'audio'
          ? 'تسجيل صوتي'
          : lastMsg.text || 'رسالة';
      canonical.lastMessageAt = lastMsg.createdAt;
      canonical.updatedAt = new Date().toISOString();
    }

    // Sum unread counts
    canonical.unreadByAdmin = convList.reduce((acc, c) => acc + (c.unreadByAdmin || 0), 0);
    canonical.unreadByUser = convList.reduce((acc, c) => acc + (c.unreadByUser || 0), 0);

    normalizedConversations.push(canonical);
  }

  // Preserve any conversation without a userId
  for (const conv of db.conversations) {
    if (!conv.userId && !normalizedConversations.some((c) => c.id === conv.id)) {
      normalizedConversations.push(conv);
    }
  }

  if (changed) {
    db.conversations = normalizedConversations;
    writeDB(db);
    console.log(`[CANONICAL MIGRATION] Migration completed successfully. DB updated.`);
  }

  return changed;
}

// Run migration check on startup
try {
  const initialDB = readDB();
  normalizeAndMigrateConversations(initialDB);
} catch (e) {
  console.error('Migration startup check error:', e);
}

// ----------------------------------------------------
// AUTHENTICATION & AUTHORIZATION HELPERS
// ----------------------------------------------------

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  photo?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (!name) return;
    const value = parts.slice(1).join('=').trim();
    try {
      list[name] = decodeURIComponent(value);
    } catch {
      list[name] = value;
    }
  });
  return list;
}

function extractToken(req: express.Request): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Query param: "?token=<token>" (primarily for EventSource / direct links)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token.trim();
  }

  // 3. Cookie header: "hema_session=<token>"
  const cookies = parseCookies(req.headers.cookie);
  if (cookies['hema_session']) {
    return cookies['hema_session'];
  }

  return null;
}

function isUserAdmin(uid: string, email?: string, tokenClaims?: Record<string, any>): boolean {
  const verifiedEmail = (email || '').trim().toLowerCase();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'ibraimbdo11@gmail.com').trim().toLowerCase();
  const db = readDB();
  const dbAdminEmail = (db.settings.adminEmail || 'ibraimbdo11@gmail.com').trim().toLowerCase();

  if (verifiedEmail && (verifiedEmail === envAdminEmail || verifiedEmail === dbAdminEmail)) {
    return true;
  }
  if (tokenClaims?.admin === true || tokenClaims?.role === 'admin') {
    return true;
  }
  return false;
}

async function verifyTokenString(token: string): Promise<AuthenticatedUser | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    const email = (decoded.email || '').trim();
    const role: 'admin' | 'user' = isUserAdmin(decoded.uid, email, decoded) ? 'admin' : 'user';
    return {
      uid: decoded.uid,
      email,
      name: decoded.name || decoded.displayName || (email ? email.split('@')[0] : 'مستخدم'),
      role,
      photo: decoded.picture || undefined,
    };
  } catch (err) {
    return null;
  }
}

// Middleware: Require Authenticated User
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى هذه الخدمة' });
  }

  const user = await verifyTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة أو منتهية الصلاحية' });
  }

  req.user = user;

  // Set session cookie if token came from Authorization header so browser media tags can load
  if (req.headers.authorization && !req.headers.cookie?.includes('hema_session=')) {
    res.cookie('hema_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  next();
}

// Middleware: Require Admin
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى هذه الخدمة' });
  }

  const user = await verifyTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة أو منتهية الصلاحية' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بالوصول - يتطلب صلاحيات الإدارة' });
  }

  req.user = user;
  next();
}

// ----------------------------------------------------
// REALTIME SSE REGISTRY & FILTERED DISPATCHING
// ----------------------------------------------------
// REALTIME SSE REGISTRY & FILTERED DISPATCHING
// ----------------------------------------------------
interface SSEClient {
  id: string;
  res: express.Response;
  userId: string;
  role: 'admin' | 'user';
  conversationId?: string;
  connectedAt: string;
}

const sseClients = new Map<string, SSEClient>();

// Helper: Count active SSE connections for a specific user ID
function getUserActiveConnectionCount(userId: string): number {
  if (!userId) return 0;
  let count = 0;
  sseClients.forEach((client) => {
    if (client.userId === userId) {
      count++;
    }
  });
  return count;
}

// Presence tracking in-memory + persistent lastSeenAt in DB
interface PresenceInfo {
  lastSeenAt: string;
  isOnline: boolean;
  role: string;
}
const presenceStore = new Map<string, PresenceInfo>();

function updatePresence(userId: string, role: string, isOnline: boolean = true) {
  if (!userId) return;
  const now = new Date().toISOString();
  presenceStore.set(userId, {
    lastSeenAt: now,
    isOnline,
    role,
  });

  // Persist lastSeenAt in database for permanence across server restarts
  if (!isOnline) {
    try {
      const db = readDB();
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.lastSeenAt = now;
        writeDB(db);
      }
    } catch (e) {
      console.error('Error saving lastSeenAt to DB:', e);
    }
  }
}

// Scoped Presence Dispatcher:
// 1. Support/Admin presence is visible to customers (so they know support is online)
// 2. Customer presence and last seen are delivered ONLY to authenticated Admins
function sendRealtimePresence(userId: string, role: string, isOnline: boolean) {
  const p = presenceStore.get(userId);
  const lastSeenAt = p ? p.lastSeenAt : new Date().toISOString();

  sseClients.forEach((client, id) => {
    try {
      if (role === 'admin') {
        // Admin status visible to all: customers see general support status, admins see details
        const payload = `event: presence\ndata: ${JSON.stringify({
          userId: client.role === 'admin' ? userId : 'support',
          role: 'admin',
          isOnline,
          lastSeenAt,
        })}\n\n`;
        client.res.write(payload);
      } else if (client.role === 'admin') {
        // Customer presence is strictly private to admins
        const payload = `event: presence\ndata: ${JSON.stringify({
          userId,
          role: 'user',
          isOnline,
          lastSeenAt,
        })}\n\n`;
        client.res.write(payload);
      }
      // Non-admin customers NEVER receive other customers' presence or last seen
    } catch {
      handleClientDisconnect(id);
    }
  });
}

// Centralized disconnect handler that respects multiple tabs/devices per user
function handleClientDisconnect(clientId: string) {
  const client = sseClients.get(clientId);
  if (!client) return;

  sseClients.delete(clientId);
  try {
    client.res.end();
  } catch {}

  // Check remaining connections for this user across all open tabs/devices
  const remaining = getUserActiveConnectionCount(client.userId);
  if (remaining === 0) {
    // Only mark user offline when the very last connection closes
    updatePresence(client.userId, client.role, false);
    sendRealtimePresence(client.userId, client.role, false);
  }
}

// Immediately close all connections belonging to a user (used on logout)
function closeAllUserConnections(userId: string) {
  const toClose: string[] = [];
  sseClients.forEach((client, id) => {
    if (client.userId === userId) {
      toClose.push(id);
      try {
        client.res.write('event: force_disconnect\ndata: {"reason":"logged_out"}\n\n');
        client.res.end();
      } catch {}
    }
  });
  toClose.forEach((id) => sseClients.delete(id));
  updatePresence(userId, 'user', false);
  sendRealtimePresence(userId, 'user', false);
}

// Strict Server-Side Event Dispatcher:
// - Customer A NEVER receives Customer B's private messages or events
// - Admin receives authorized support coordination events
// - Notifications are delivered strictly to the intended recipient
function sendRealtimeEvent(
  event: string,
  data: any,
  conversationId?: string,
  targetUserId?: string
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const db = readDB();
  const conv = conversationId ? db.conversations.find((c) => c.id === conversationId) : null;
  const conversationOwnerId = conv ? conv.userId : targetUserId;

  sseClients.forEach((client, id) => {
    try {
      // 1. Notification events: strictly private to intended recipient
      if (event === 'new_notification' || event === 'notification_read' || event === 'notifications_read') {
        if (targetUserId === 'admin') {
          if (client.role === 'admin') {
            client.res.write(payload);
          }
        } else if (targetUserId && client.userId === targetUserId) {
          client.res.write(payload);
        }
        return;
      }

      // 2. Conversation events (message_created, message_updated, message_deleted, messages_read)
      if (conversationId) {
        if (!conv) {
          // Conversation not found in DB: abort delivery to prevent data leakage
          return;
        }

        if (client.role === 'admin') {
          // Authorized support admin receives conversation events
          client.res.write(payload);
        } else if (conversationOwnerId && client.userId === conversationOwnerId) {
          // Customer ONLY receives events belonging to their own conversation
          client.res.write(payload);
        }
        return;
      }

      // 3. User-targeted events without conversation ID
      if (targetUserId) {
        if (targetUserId === 'admin') {
          if (client.role === 'admin') {
            client.res.write(payload);
          }
        } else if (client.userId === targetUserId) {
          client.res.write(payload);
        }
      }
    } catch {
      handleClientDisconnect(id);
    }
  });
}

// Heartbeat ping every 15s to keep SSE connections alive and prune stale sockets
setInterval(() => {
  sseClients.forEach((client, id) => {
    try {
      client.res.write(':heartbeat\n\n');
    } catch {
      handleClientDisconnect(id);
    }
  });
}, 15000);

// ----------------------------------------------------
// SECURE FILE UPLOAD & PROTECTED ATTACHMENT ACCESS
// ----------------------------------------------------

// Periodic cleanup of abandoned temporary uploads older than 24 hours
function cleanOrphanedUploads() {
  try {
    const db = readDB();
    if (!db.uploads || !Array.isArray(db.uploads)) return;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const keptUploads: UploadRecord[] = [];

    db.uploads.forEach((u) => {
      const isUsedInMsg = (db.messages || []).some(
        (m) => (m.fileUrl && m.fileUrl.includes(u.filename)) || (m.audioUrl && m.audioUrl.includes(u.filename))
      );
      const isUsedInOrder = (db.orders || []).some(
        (o) => o.paymentProof && o.paymentProof.includes(u.filename)
      );

      const uploadTime = new Date(u.createdAt).getTime();
      if (!isUsedInMsg && !isUsedInOrder && uploadTime < oneDayAgo) {
        const filePath = path.join(UPLOADS_DIR, u.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      } else {
        keptUploads.push(u);
      }
    });

    if (keptUploads.length !== db.uploads.length) {
      db.uploads = keptUploads;
      writeDB(db);
    }
  } catch (err) {
    console.error('Error cleaning orphaned uploads:', err);
  }
}

// Run cleanup immediately and then every 6 hours
cleanOrphanedUploads();
setInterval(cleanOrphanedUploads, 6 * 60 * 60 * 1000);

// 1. Upload file (Authenticated users only, validated and staged)
app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req as any, res as any, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميجابايت)' });
      }
      if (err.message === 'INVALID_FILE_DANGEROUS') {
        return res.status(400).json({ error: 'نوع الملف غير مسموح به لأسباب أمنية (الملفات التنفيذية والبرمجية محظورة)' });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'نوع الملف غير مدعوم. يرجى اختيار صورة، ملف PDF، مستند، أرشيف أو تسجيل صوتي' });
      }
      return res.status(400).json({ error: err.message || 'فشل في رفع الملف' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const db = readDB();
    if (!db.uploads) db.uploads = [];

    db.uploads.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploaderId: req.user!.uid,
      size: req.file.size,
      mimetype: req.file.mimetype,
      createdAt: new Date().toISOString(),
    });

    writeDB(db);

    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  });
});

// 2. Delete temporary/staged upload (if user cancels before sending)
app.delete('/api/upload/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const db = readDB();

  const uploadIndex = (db.uploads || []).findIndex(
    (u) => u.filename === filename && (u.uploaderId === req.user!.uid || req.user!.role === 'admin')
  );

  if (uploadIndex === -1) {
    return res.status(404).json({ error: 'الملف غير موجود أو غير مصرح بإلغائه' });
  }

  // Ensure file is not already committed to a permanent message or order
  const isUsedInMsg = (db.messages || []).some(
    (m) => (m.fileUrl && m.fileUrl.includes(filename)) || (m.audioUrl && m.audioUrl.includes(filename))
  );
  const isUsedInOrder = (db.orders || []).some(
    (o) => o.paymentProof && o.paymentProof.includes(filename)
  );

  if (isUsedInMsg || isUsedInOrder) {
    return res.status(400).json({ error: 'لا يمكن حذف ملف مرتبط برسالة أو طلب تم إرساله بالفعل' });
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting staged file from disk:', e);
    }
  }

  db.uploads.splice(uploadIndex, 1);
  writeDB(db);

  res.json({ success: true, message: 'تم إلغاء وحذف الملف المؤقت بنجاح' });
});

// Helper to determine original filename for Content-Disposition
function getOriginalFileName(filename: string, db: DBStructure): string {
  const uploadRecord = (db.uploads || []).find((u) => u.filename === filename);
  if (uploadRecord && uploadRecord.originalName) return uploadRecord.originalName;

  const msg = (db.messages || []).find(
    (m) => (m.fileUrl && m.fileUrl.includes(filename)) || (m.audioUrl && m.audioUrl.includes(filename))
  );
  if (msg && msg.fileName) return msg.fileName;

  const order = (db.orders || []).find((o) => o.paymentProof && o.paymentProof.includes(filename));
  if (order && order.paymentProofFilename) return order.paymentProofFilename;

  return filename;
}

// 3. Protected Attachment Access & Download Route (Replaces raw static /uploads directory)
app.get('/uploads/:filename', async (req, res) => {
  // Verify authentication first to prevent filename probing
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى هذا الملف' });
  }

  const user = await verifyTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة' });
  }

  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'الملف غير موجود' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');

  const db = readDB();
  const isDownload = req.query.download === '1' || req.query.dl === '1';

  // Admin has access to review all customer receipts and attachments
  if (user.role === 'admin') {
    if (isDownload) {
      const originalName = getOriginalFileName(filename, db);
      return res.download(filePath, originalName);
    }
    return res.sendFile(filePath);
  }

  // Non-admin customer ownership verification:
  // A. Is this file the customer's payment proof?
  const isUserOrderFile = db.orders.some(
    (o) => o.userId === user.uid && o.paymentProof && o.paymentProof.includes(filename)
  );
  if (isUserOrderFile) {
    if (isDownload) {
      const originalName = getOriginalFileName(filename, db);
      return res.download(filePath, originalName);
    }
    return res.sendFile(filePath);
  }

  // B. Is this file an attachment in a conversation the customer belongs to?
  const isUserMessageFile = db.messages.some((m) => {
    if ((m.fileUrl && m.fileUrl.includes(filename)) || (m.audioUrl && m.audioUrl.includes(filename))) {
      const conv = db.conversations.find((c) => c.id === m.conversationId);
      return conv && conv.userId === user.uid;
    }
    return false;
  });
  if (isUserMessageFile) {
    if (isDownload) {
      const originalName = getOriginalFileName(filename, db);
      return res.download(filePath, originalName);
    }
    return res.sendFile(filePath);
  }

  // C. Was this file uploaded by this customer (e.g., during checkout staging)?
  const isUserUpload = (db.uploads || []).some(
    (u) => u.filename === filename && u.uploaderId === user.uid
  );
  if (isUserUpload) {
    if (isDownload) {
      const originalName = getOriginalFileName(filename, db);
      return res.download(filePath, originalName);
    }
    return res.sendFile(filePath);
  }

  // Access Denied: Customer A cannot access Customer B's private attachment
  return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذا الملف' });
});

// Explicit download endpoint alias
app.get('/api/attachments/:filename/download', async (req, res) => {
  req.query.download = '1';
  // Redirect internally to the protected route logic
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى هذا الملف' });
  }
  const user = await verifyTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة' });
  }
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'الملف غير موجود' });
  }

  const db = readDB();
  const originalName = getOriginalFileName(filename, db);

  if (user.role === 'admin') {
    return res.download(filePath, originalName);
  }

  const isAllowed =
    db.orders.some((o) => o.userId === user.uid && o.paymentProof && o.paymentProof.includes(filename)) ||
    db.messages.some((m) => {
      if ((m.fileUrl && m.fileUrl.includes(filename)) || (m.audioUrl && m.audioUrl.includes(filename))) {
        const conv = db.conversations.find((c) => c.id === m.conversationId);
        return conv && conv.userId === user.uid;
      }
      return false;
    }) ||
    (db.uploads || []).some((u) => u.filename === filename && u.uploaderId === user.uid);

  if (isAllowed) {
    return res.download(filePath, originalName);
  }
  return res.status(403).json({ error: 'غير مصرح بتحميل هذا الملف' });
});

// ----------------------------------------------------
// AUTH & SESSION ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/logout', async (req, res) => {
  const token = extractToken(req);
  if (token) {
    const user = await verifyTokenString(token);
    if (user) {
      closeAllUserConnections(user.uid);
    }
  }
  res.clearCookie('hema_session', { path: '/' });
  res.json({ success: true });
});

// Sync user record from Firebase Auth (Derives identity strictly server-side)
app.post('/api/users/sync', requireAuth, (req, res) => {
  const db = readDB();
  const { name, photo } = req.body;

  // Identity and role are derived 100% server-side from verified token
  const id = req.user!.uid;
  const email = req.user!.email;
  const role = req.user!.role;
  const userName = name && typeof name === 'string' && name.trim() ? name.trim() : req.user!.name;
  const userPhoto = photo && typeof photo === 'string' ? photo : req.user!.photo || '';

  const now = new Date().toISOString();

  let user = db.users.find((u) => u.id === id);
  if (!user) {
    user = {
      id,
      name: userName,
      email,
      photo: userPhoto,
      role,
      createdAt: now,
      lastLoginAt: now,
      orderCount: 0,
    };
    db.users.unshift(user);

    if (role !== 'admin') {
      const newUserNotif = {
        id: `notif-${Date.now()}`,
        userId: 'admin',
        type: 'new_user' as const,
        title: 'مستخدم جديد انضم للمنصة',
        body: `انضم المستخدم ${user.name} (${user.email}) إلى المنصة.`,
        isRead: false,
        createdAt: now,
      };
      db.notifications.unshift(newUserNotif);
      sendRealtimeEvent('new_notification', { userId: 'admin', notification: newUserNotif }, undefined, 'admin');
    }
  } else {
    user.name = userName || user.name;
    user.email = email;
    user.lastLoginAt = now;
    user.role = role;
    if (userPhoto) user.photo = userPhoto;
  }

  writeDB(db);

  // Set session cookie for seamless attachment/media viewing
  const token = extractToken(req);
  if (token) {
    res.cookie('hema_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  res.json(user);
});

// ----------------------------------------------------
// PLATFORM CONFIG & ADMIN SETTINGS
// ----------------------------------------------------

app.get('/api/config', (_req, res) => {
  const db = readDB();
  res.json({
    walletName: db.settings.walletName,
    walletNumber: db.settings.walletNumber,
    adminEmail: db.settings.adminEmail,
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const db = readDB();
  const { walletName, walletNumber, adminEmail } = req.body;
  if (walletName) db.settings.walletName = String(walletName).trim();
  if (walletNumber) db.settings.walletNumber = String(walletNumber).trim();
  if (adminEmail) db.settings.adminEmail = String(adminEmail).trim();

  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// ----------------------------------------------------
// SERVICES ENDPOINTS
// ----------------------------------------------------

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

app.post('/api/services', requireAdmin, (req, res) => {
  const db = readDB();
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

app.put('/api/services/:id', requireAdmin, (req, res) => {
  const db = readDB();
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

app.delete('/api/services/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الخدمة غير موجودة' });
  }

  db.services.splice(idx, 1);
  writeDB(db);
  res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
});

// ----------------------------------------------------
// ORDERS ENDPOINTS (Strict Isolation & Ownership)
// ----------------------------------------------------

app.get('/api/orders', requireAuth, (req, res) => {
  const db = readDB();

  // Admin can see all orders, or filter by user if requested
  if (req.user!.role === 'admin') {
    const filterUserId = req.query.userId as string;
    if (filterUserId) {
      return res.json(db.orders.filter((o) => o.userId === filterUserId));
    }
    return res.json(db.orders);
  }

  // Regular customer: strictly filter by verified req.user.uid
  // Any client-provided userId query parameter is completely ignored
  const userOrders = db.orders.filter((o) => o.userId === req.user!.uid);
  res.json(userOrders);
});

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const db = readDB();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  // Ownership verification
  if (order.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بعرض هذا الطلب' });
  }

  res.json(order);
});

app.post('/api/orders', requireAuth, (req, res) => {
  const db = readDB();
  const { serviceId, customerRequirements, paymentProof, paymentProofFilename, paymentMethod, senderWalletNumber, userName } = req.body;

  if (!serviceId || !paymentProof) {
    return res.status(400).json({ error: 'يرجى استكمال جميع بيانات الطلب وإرفاق إثبات التحويل' });
  }

  // Identity is derived 100% server-side from verified req.user
  const userId = req.user!.uid;
  const userEmail = req.user!.email || '';
  const resolvedUserName = userName && typeof userName === 'string' && userName.trim() ? userName.trim() : req.user!.name;

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
    userName: resolvedUserName,
    userEmail,
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

  // Admin Notification
  const adminOrderNotif = {
    id: `notif-${Date.now()}`,
    userId: 'admin',
    type: 'new_order' as const,
    title: 'طلب خدمة جديد',
    body: `قام العميل ${resolvedUserName} بطلب "${serviceTitle}" برقم طلب ${orderNumber}.`,
    relatedOrderId: newOrder.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(adminOrderNotif);
  sendRealtimeEvent('new_notification', { userId: 'admin', notification: adminOrderNotif }, undefined, 'admin');

  // Customer Notification
  const customerOrderNotif = {
    id: `notif-${Date.now() + 1}`,
    userId,
    type: 'order_status' as const,
    title: 'تم استلام طلبك بنجاح',
    body: `تم استلام طلبك برقم ${orderNumber} وهو قيد المراجعة حالياً من قبل الإدارة.`,
    relatedOrderId: newOrder.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(customerOrderNotif);
  sendRealtimeEvent('new_notification', { userId, notification: customerOrderNotif }, undefined, userId);

  // Associate order with customer's ONE canonical support conversation
  let canonicalConv = db.conversations.find((c) => c.userId === userId);
  const now = new Date().toISOString();

  if (!canonicalConv) {
    canonicalConv = {
      id: `conv-${Date.now()}-${userId.substring(0, 6)}`,
      userId,
      userName: resolvedUserName,
      userEmail,
      orderId: newOrder.id,
      orderNumber,
      lastMessage: `تم تسجيل الطلب برقم ${orderNumber}`,
      lastMessageAt: now,
      unreadByAdmin: 1,
      unreadByUser: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.conversations.unshift(canonicalConv);
  } else {
    // Existing customer canonical conversation: update active order context & last message
    canonicalConv.orderId = newOrder.id;
    canonicalConv.orderNumber = orderNumber;
    canonicalConv.lastMessage = `تم تسجيل الطلب برقم ${orderNumber}`;
    canonicalConv.lastMessageAt = now;
    canonicalConv.updatedAt = now;
    canonicalConv.unreadByAdmin = (canonicalConv.unreadByAdmin || 0) + 1;
  }

  // Idempotently create initial system message in the SAME canonical conversation
  const existingInitialMsg = db.messages.find(
    (m) => m.conversationId === canonicalConv.id && m.orderId === newOrder.id && m.senderId === 'system'
  );
  if (!existingInitialMsg) {
    db.messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: canonicalConv.id,
      senderId: 'system',
      senderName: 'HEMA SERVICES',
      senderRole: 'admin',
      type: 'text',
      text: `مرحباً بك! تم تسجيل طلبك برقم ${orderNumber} بنجاح. يمكنك استخدام هذه المحادثة للتواصل المباشر مع الإدارة بخصوص متطلباتك أو إرسال استفساراتك.`,
      orderId: newOrder.id,
      orderNumber: orderNumber,
      isDeleted: false,
      isEdited: false,
      createdAt: now,
    });
  }

  writeDB(db);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const db = readDB();
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

  const orderStatusNotif = {
    id: `notif-${Date.now()}`,
    userId: order.userId,
    type: 'order_status' as const,
    title: notificationTitle,
    body: notificationBody,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(orderStatusNotif);
  sendRealtimeEvent('new_notification', { userId: order.userId, notification: orderStatusNotif }, undefined, order.userId);

  writeDB(db);
  res.json(order);
});

app.post('/api/orders/:id/cancel', requireAuth, (req, res) => {
  const db = readDB();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  // Ownership verification
  if (order.userId !== req.user!.uid && req.user!.role !== 'admin') {
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
  const adminCancelNotif = {
    id: `notif-${Date.now()}`,
    userId: 'admin',
    type: 'order_status' as const,
    title: 'تم إلغاء طلب من قبل العميل',
    body: `قام العميل ${order.userName} بإلغاء الطلب رقم ${order.orderNumber}.`,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(adminCancelNotif);
  sendRealtimeEvent('new_notification', { userId: 'admin', notification: adminCancelNotif }, undefined, 'admin');

  // Customer Notification
  const customerCancelNotif = {
    id: `notif-${Date.now() + 1}`,
    userId: order.userId,
    type: 'order_status' as const,
    title: 'تم إلغاء الطلب بنجاح',
    body: `تم إلغاء طلبك رقم ${order.orderNumber} بنجاح.`,
    relatedOrderId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(customerCancelNotif);
  sendRealtimeEvent('new_notification', { userId: order.userId, notification: customerCancelNotif }, undefined, order.userId);

  writeDB(db);
  res.json({ success: true, order });
});

// ----------------------------------------------------
// CONVERSATIONS & CHAT ENDPOINTS
// ----------------------------------------------------

// Realtime SSE Stream Endpoint (Authenticated)
app.get('/api/chat/stream', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'غير مصرح بالدخول' });
  }

  const user = await verifyTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة' });
  }

  const conversationId = req.query.convId as string;
  if (conversationId) {
    const db = readDB();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || (conv.userId !== user.uid && user.role !== 'admin')) {
      return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = {
    id: clientId,
    res,
    userId: user.uid,
    role: user.role,
    conversationId,
    connectedAt: new Date().toISOString(),
  };

  const priorCount = getUserActiveConnectionCount(user.uid);
  sseClients.set(clientId, client);

  // If this is the user's first active connection, mark online and broadcast presence
  if (priorCount === 0) {
    updatePresence(user.uid, user.role, true);
    sendRealtimePresence(user.uid, user.role, true);
  }

  res.write(`:connected clientId=${clientId}\n\n`);

  req.on('close', () => {
    handleClientDisconnect(clientId);
  });
});

// Presence & Heartbeat API
app.post('/api/chat/presence', requireAuth, (req, res) => {
  const { isOnline } = req.body;
  updatePresence(req.user!.uid, req.user!.role, isOnline !== false);
  res.json({ success: true });
});

// Get user presence (Admin only)
app.get('/api/chat/presence/:userId', requireAdmin, (req, res) => {
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

  const isActuallyOnline = userP.isOnline || (Date.now() - new Date(userP.lastSeenAt).getTime() < 45000);
  res.json({
    userId,
    isOnline: isActuallyOnline,
    lastSeenAt: userP.lastSeenAt,
  });
});

// Get Admin support status (Public for visitor transparency)
app.get('/api/chat/presence-admin/status', (_req, res) => {
  let adminOnline = false;
  presenceStore.forEach((val) => {
    if (val.role === 'admin') {
      const diff = Date.now() - new Date(val.lastSeenAt).getTime();
      if (val.isOnline || diff < 120000) adminOnline = true;
    }
  });

  res.json({
    isOnline: adminOnline,
    statusText: adminOnline ? 'متصل الآن' : 'خدمة العملاء متاحة للرد',
  });
});

// Typing indicator endpoint (Strictly scoped to conversation participants)
app.post('/api/conversations/:id/typing', requireAuth, (req, res) => {
  const convId = req.params.id;
  const db = readDB();
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }

  if (conv.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح' });
  }

  const { isTyping } = req.body;
  const payload = `event: typing\ndata: ${JSON.stringify({
    conversationId: convId,
    userId: req.user!.uid,
    userName: req.user!.role === 'admin' ? 'إدارة HEMA SERVICES' : (req.user!.name || conv.userName || 'العميل'),
    role: req.user!.role,
    isTyping: Boolean(isTyping),
  })}\n\n`;

  sseClients.forEach((client, id) => {
    try {
      // Don't send back to the typing user's own connections
      if (client.userId === req.user!.uid) return;

      // Scoped recipient routing:
      // If customer typing -> admins only
      // If admin typing -> customer owner (conv.userId) and other admins
      if (req.user!.role === 'admin') {
        if (client.userId === conv.userId || client.role === 'admin') {
          client.res.write(payload);
        }
      } else {
        if (client.role === 'admin') {
          client.res.write(payload);
        }
      }
    } catch {
      handleClientDisconnect(id);
    }
  });

  res.json({ success: true });
});

// List conversations (Admin gets all, Customer gets ONLY their own)
app.get('/api/conversations', requireAuth, (req, res) => {
  const db = readDB();
  if (req.user!.role === 'admin') {
    return res.json(db.conversations);
  }

  // Regular customer: strictly filter by verified req.user.uid
  const userConversations = db.conversations.filter((c) => c.userId === req.user!.uid);
  res.json(userConversations);
});

// Get unread support messages count (Customer gets own unreadByUser, Admin gets total unreadByAdmin)
app.get('/api/conversations/unread-count', requireAuth, (req, res) => {
  const db = readDB();
  if (req.user!.role === 'admin') {
    const totalUnread = db.conversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);
    return res.json({ unreadSupportCount: totalUnread });
  }

  // Canonical customer conversation
  const customerConv = db.conversations.find((c) => c.userId === req.user!.uid);
  const unreadCount = customerConv?.unreadByUser || 0;
  res.json({ unreadSupportCount: unreadCount });
});

// Get single conversation by ID (Requires verified membership or admin)
app.get('/api/conversations/:id', requireAuth, (req, res) => {
  const db = readDB();
  const conv = db.conversations.find((c) => c.id === req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }
  if (conv.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
  }
  res.json(conv);
});

// Find or create CANONICAL support conversation for authenticated customer (Strictly ONE conversation per customer)
app.post('/api/conversations/find-or-create', requireAuth, async (req, res) => {
  const { orderId } = req.body;

  // Identity is strictly the authenticated user (or target userId if caller is admin)
  const targetUserId = req.user!.role === 'admin' && req.body.userId ? req.body.userId : req.user!.uid;
  const targetUserName = req.user!.role === 'admin' && req.body.userName ? req.body.userName : (req.user!.name || 'عميل');
  const targetUserEmail = req.user!.role === 'admin' && req.body.userEmail ? req.body.userEmail : (req.user!.email || '');

  try {
    const conv = await withUserLock(targetUserId, async () => {
      const db = readDB();

      let orderNumber: string | undefined;
      if (orderId) {
        const ord = db.orders.find((o) => o.id === orderId);
        if (!ord) {
          throw { status: 404, message: 'الطلب غير موجود' };
        }
        // Strict ownership check: customer cannot attach another customer's order
        if (ord.userId !== targetUserId && req.user!.role !== 'admin') {
          throw { status: 403, message: 'غير مصرح بالوصول إلى هذا الطلب' };
        }
        orderNumber = ord.orderNumber;
      }

      // Find the ONE canonical support conversation for this customer
      let canonicalConv = db.conversations.find((c) => c.userId === targetUserId);

      if (!canonicalConv) {
        canonicalConv = {
          id: `conv-${Date.now()}-${targetUserId.substring(0, 6)}`,
          userId: targetUserId,
          userName: targetUserName,
          userEmail: targetUserEmail,
          orderId: orderId || undefined,
          orderNumber: orderNumber || undefined,
          lastMessage: 'محادثة دعم فني',
          lastMessageAt: new Date().toISOString(),
          unreadByAdmin: 0,
          unreadByUser: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.conversations.unshift(canonicalConv);
        writeDB(db);
      } else if (orderId) {
        // Customer opens support with specific order context: update active context
        canonicalConv.orderId = orderId;
        canonicalConv.orderNumber = orderNumber;
        canonicalConv.updatedAt = new Date().toISOString();
        writeDB(db);
      }

      return canonicalConv;
    });

    res.json(conv);
  } catch (err: any) {
    if (err?.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error in find-or-create conversation:', err);
    res.status(500).json({ error: 'خطأ في معالجة المحادثة' });
  }
});

// Get messages for conversation (Requires verified membership)
app.get('/api/conversations/:id/messages', requireAuth, (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }

  // Strict ownership check: Customer A cannot read Customer B's messages
  if (conv.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
  }

  let messages = db.messages
    .filter((m) => m.conversationId === convId)
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

  // Pagination support
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const before = req.query.before as string;

  if (before) {
    let beforeIdx = messages.findIndex((m) => m.id === before);
    if (beforeIdx === -1) {
      beforeIdx = messages.findIndex((m) => m.createdAt === before);
    }
    if (beforeIdx !== -1) {
      messages = messages.slice(0, beforeIdx);
    }
  }

  const totalCount = messages.length;
  let returnedMessages = messages;
  if (limit && limit > 0 && messages.length > limit) {
    returnedMessages = messages.slice(messages.length - limit);
  }

  // GET is purely idempotent: do NOT mark messages as read here.
  // Reading messages is explicitly handled by POST /api/conversations/:id/read when user views the chat.

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

// Mark conversation as read (Requires verified membership)
app.post('/api/conversations/:id/read', requireAuth, (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }

  // Strict ownership check
  if (conv.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بتعديل حالة هذه المحادثة' });
  }

  const isAdmin = req.user!.role === 'admin';
  const now = new Date().toISOString();
  let updated = false;

  if (isAdmin) {
    if (conv.unreadByAdmin > 0) {
      conv.unreadByAdmin = 0;
      updated = true;
    }
    db.messages.forEach((m) => {
      if (m.conversationId === convId && m.senderRole === 'user' && !m.readAt) {
        m.readAt = now;
        updated = true;
      }
    });
  } else {
    if (conv.unreadByUser > 0) {
      conv.unreadByUser = 0;
      updated = true;
    }
    db.messages.forEach((m) => {
      if (m.conversationId === convId && m.senderRole === 'admin' && !m.readAt) {
        m.readAt = now;
        updated = true;
      }
    });
  }

  if (updated) {
    writeDB(db);
    sendRealtimeEvent('messages_read', {
      conversationId: convId,
      readAt: now,
      readByRole: isAdmin ? 'admin' : 'user',
    }, convId);
    sendRealtimeEvent('conversation_unread_updated', {
      conversationId: convId,
      userId: conv.userId,
      unreadByUser: conv.unreadByUser,
      unreadByAdmin: conv.unreadByAdmin,
    }, convId);
  }

  res.json({
    success: true,
    unreadByUser: conv.unreadByUser,
    unreadByAdmin: conv.unreadByAdmin,
  });
});

// Send message (Sender identity is derived 100% server-side)
app.post('/api/conversations/:id/messages', requireAuth, (req, res) => {
  const db = readDB();
  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }

  // Strict membership check
  if (conv.userId !== req.user!.uid && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بإرسال رسائل في هذه المحادثة' });
  }

  const {
    type,
    text,
    fileUrl,
    fileName,
    fileSize,
    isImage,
    audioUrl,
    audioDuration,
    replyTo,
    orderId,
  } = req.body;

  // Verify order context if provided (Account isolation: customer can only attach their own orders)
  let verifiedOrderId: string | undefined;
  let verifiedOrderNumber: string | undefined;
  if (orderId) {
    const ord = db.orders.find((o) => o.id === orderId);
    if (!ord) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    if (ord.userId !== conv.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح بالربط بهذا الطلب' });
    }
    verifiedOrderId = ord.id;
    verifiedOrderNumber = ord.orderNumber;
  }

  // Derives sender identity strictly from verified token
  const senderId = req.user!.uid;
  const senderRole = req.user!.role;
  const senderName = req.user!.role === 'admin' ? 'إدارة HEMA SERVICES' : (req.user!.name || 'العميل');

  const determinedType = type === 'image' || isImage ? 'image' : (type as 'text' | 'file' | 'audio' | 'image' || 'text');

  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: convId,
    senderId,
    senderName,
    senderRole,
    type: determinedType,
    text: text ? String(text).trim() : undefined,
    fileUrl,
    fileName,
    fileSize,
    isImage: Boolean(determinedType === 'image'),
    audioUrl,
    audioDuration,
    replyTo: replyTo || undefined,
    orderId: verifiedOrderId,
    orderNumber: verifiedOrderNumber,
    isDeleted: false,
    isEdited: false,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMsg);

  // Update conversation last message & active order context
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
  if (verifiedOrderId) {
    conv.orderId = verifiedOrderId;
    conv.orderNumber = verifiedOrderNumber;
  }

  if (senderRole === 'admin') {
    conv.unreadByUser = (conv.unreadByUser || 0) + 1;
    const notifId = `notif-msg-${newMsg.id}`;
    if (!db.notifications.some((n) => n.id === notifId)) {
      const newNotif = {
        id: notifId,
        userId: conv.userId,
        type: 'new_message',
        title: 'رسالة جديدة من الدعم الفني',
        body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
        relatedConversationId: conv.id,
        relatedOrderId: verifiedOrderId || undefined,
        messageId: newMsg.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.unshift(newNotif);
      sendRealtimeEvent('new_notification', { userId: conv.userId, notification: newNotif }, undefined, conv.userId);
    }
  } else {
    conv.unreadByAdmin = (conv.unreadByAdmin || 0) + 1;
    const notifId = `notif-msg-${newMsg.id}`;
    if (!db.notifications.some((n) => n.id === notifId)) {
      const newNotif = {
        id: notifId,
        userId: 'admin',
        type: 'new_message',
        title: `رسالة جديدة من ${conv.userName}`,
        body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
        relatedConversationId: conv.id,
        relatedOrderId: verifiedOrderId || undefined,
        messageId: newMsg.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.unshift(newNotif);
      sendRealtimeEvent('new_notification', { userId: 'admin', notification: newNotif }, undefined, 'admin');
    }
  }

  writeDB(db);

  // Realtime event dispatched ONLY to conversation participants
  sendRealtimeEvent('message_created', {
    conversationId: convId,
    message: newMsg,
  }, convId);

  // Realtime unread counter update
  sendRealtimeEvent('conversation_unread_updated', {
    conversationId: convId,
    userId: conv.userId,
    unreadByUser: conv.unreadByUser,
    unreadByAdmin: conv.unreadByAdmin,
  }, convId);

  res.status(201).json(newMsg);
});

// Edit message endpoint (Users can edit ONLY their own messages)
app.put('/api/conversations/:convId/messages/:msgId', requireAuth, (req, res) => {
  const db = readDB();
  const { convId, msgId } = req.params;
  const { text } = req.body;

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv || (conv.userId !== req.user!.uid && req.user!.role !== 'admin')) {
    return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
  }

  if (msg.isDeleted) {
    return res.status(400).json({ error: 'لا يمكن تعديل رسالة محذوفة' });
  }

  // Rule: Users can edit ONLY their own messages
  if (msg.senderId !== req.user!.uid) {
    return res.status(403).json({ error: 'يمكنك تعديل رسائلك فقط' });
  }

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'نص الرسالة مطلوب' });
  }

  msg.text = String(text).trim();
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  writeDB(db);

  // Broadcast update ONLY to authorized participants of this conversation
  sendRealtimeEvent('message_updated', {
    conversationId: convId,
    messageId: msgId,
    message: msg,
  }, convId);

  res.json({ success: true, updatedMessage: msg });
});

// Delete message endpoint (Customer and admin can delete ONLY their own messages)
app.delete('/api/conversations/:convId/messages/:msgId', requireAuth, (req, res) => {
  const db = readDB();
  const { convId, msgId } = req.params;

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv || (conv.userId !== req.user!.uid && req.user!.role !== 'admin')) {
    return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
  }

  // Preserved product rule: A customer can delete ONLY their own messages.
  // An admin can delete ONLY their own messages.
  if (msg.senderId !== req.user!.uid) {
    return res.status(403).json({ error: 'لا يمكنك حذف رسائل لم تقم بإرسالها بنفسك' });
  }

  // WhatsApp style: mark as deleted
  msg.isDeleted = true;
  msg.text = 'تم حذف هذه الرسالة';
  msg.fileUrl = undefined;
  msg.fileName = undefined;
  msg.fileSize = undefined;
  msg.audioUrl = undefined;
  msg.audioDuration = undefined;

  conv.lastMessage = 'تم حذف رسالة';
  conv.updatedAt = new Date().toISOString();

  writeDB(db);

  // Broadcast deletion update ONLY to authorized participants of this conversation
  sendRealtimeEvent('message_updated', {
    conversationId: convId,
    messageId: msgId,
    message: msg,
  }, convId);

  sendRealtimeEvent('message_deleted', {
    conversationId: convId,
    messageId: msgId,
    message: msg,
  }, convId);

  res.json({ success: true, message: 'تم حذف الرسالة بنجاح', updatedMessage: msg });
});

// ----------------------------------------------------
// NOTIFICATIONS ENDPOINTS (Strict Isolation & Ownership)
// ----------------------------------------------------

app.get('/api/notifications', requireAuth, (req, res) => {
  const db = readDB();
  if (req.user!.role === 'admin') {
    const adminNotifs = db.notifications.filter((n) => n.userId === 'admin');
    return res.json(adminNotifs);
  }

  // Regular customer receives ONLY their own notifications
  const userNotifs = db.notifications.filter((n) => n.userId === req.user!.uid);
  res.json(userNotifs);
});

app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
  const db = readDB();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }

  // Ownership verification
  const isAuthorized = req.user!.role === 'admin' ? notif.userId === 'admin' : notif.userId === req.user!.uid;
  if (!isAuthorized) {
    return res.status(403).json({ error: 'غير مصرح بتعديل هذا الإشعار' });
  }

  if (!notif.isRead) {
    notif.isRead = true;
    writeDB(db);
    sendRealtimeEvent('notification_read', {
      userId: notif.userId,
      notificationId: notif.id,
    }, undefined, notif.userId);
  }

  res.json({ success: true, notification: notif });
});

app.patch('/api/notifications/read-all', requireAuth, (req, res) => {
  const db = readDB();
  const targetUserId = req.user!.role === 'admin' ? 'admin' : req.user!.uid;
  let count = 0;

  db.notifications.forEach((n) => {
    if (n.userId === targetUserId && !n.isRead) {
      n.isRead = true;
      count++;
    }
  });

  if (count > 0) {
    writeDB(db);
    sendRealtimeEvent('notifications_read', {
      userId: targetUserId,
    }, undefined, targetUserId);
  }

  res.json({ success: true, updatedCount: count });
});

// ----------------------------------------------------
// ADMIN DASHBOARD OVERVIEW & USERS
// ----------------------------------------------------

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const db = readDB();

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

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const db = readDB();
  res.json(db.users);
});

// ----------------------------------------------------
// PRODUCTION / DEVELOPMENT VITE INTEGRATION
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
    console.log(`HEMA SERVICES secure server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
