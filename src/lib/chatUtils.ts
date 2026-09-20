import { MessageItem, MessageStatus } from '../types';

/**
 * Status priority weights ensuring state transitions are strictly forward:
 * sent (1) -> delivered (2) -> read (3). A message must never transition backward.
 */
const STATUS_WEIGHTS: Record<MessageStatus, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
};

/**
 * Derives the canonical status of a message from its explicit fields.
 */
export function getMessageStatus(msg: MessageItem): MessageStatus {
  if (msg.readAt || msg.status === 'read') return 'read';
  if (msg.deliveredAt || msg.status === 'delivered') return 'delivered';
  return msg.status || 'sent';
}

/**
 * Merges two MessageItem objects idempotently, enforcing forward-only status progression.
 */
function mergeSingleMessage(existing: MessageItem, incoming: MessageItem): MessageItem {
  const existingStatus = getMessageStatus(existing);
  const incomingStatus = getMessageStatus(incoming);

  const highestWeight = Math.max(
    STATUS_WEIGHTS[existingStatus],
    STATUS_WEIGHTS[incomingStatus]
  );

  let finalStatus: MessageStatus = 'sent';
  if (highestWeight === 3) finalStatus = 'read';
  else if (highestWeight === 2) finalStatus = 'delivered';

  const readAt = incoming.readAt || existing.readAt;
  const deliveredAt = incoming.deliveredAt || existing.deliveredAt;

  return {
    ...existing,
    ...incoming,
    // Preserve edits and text if incoming is newer or explicitly edited
    isEdited: Boolean(existing.isEdited || incoming.isEdited),
    isDeleted: Boolean(existing.isDeleted || incoming.isDeleted),
    status: finalStatus,
    readAt: finalStatus === 'read' ? (readAt || new Date().toISOString()) : undefined,
    deliveredAt: deliveredAt || (finalStatus !== 'sent' ? incoming.createdAt : undefined),
  };
}

/**
 * Merges two arrays of MessageItems, deduplicates strictly by ID,
 * enforces forward-only status progression, and sorts chronologically.
 */
export function mergeAndSortMessages(
  current: MessageItem[],
  incoming: MessageItem[]
): MessageItem[] {
  const map = new Map<string, MessageItem>();

  // Add existing messages
  for (const m of current) {
    if (m && m.id) {
      map.set(m.id, m);
    }
  }

  // Add or merge incoming messages
  for (const m of incoming) {
    if (m && m.id) {
      const existing = map.get(m.id);
      if (existing) {
        map.set(m.id, mergeSingleMessage(existing, m));
      } else {
        // Ensure status field is consistently initialized
        map.set(m.id, {
          ...m,
          status: getMessageStatus(m),
        });
      }
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  return result;
}

/**
 * Safely copy text to clipboard with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}

/**
 * Check if the scroll container is near the bottom
 */
export function isNearBottom(container: HTMLElement, threshold = 120): boolean {
  const { scrollTop, scrollHeight, clientHeight } = container;
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

/**
 * Format bytes into human-readable Arabic/English size (e.g., 2.4 ميجابايت / 450 كيلوبايت)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 بايت';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

/**
 * Format timestamp into friendly Arabic relative or clock time
 */
export function formatArabicRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;

    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Extract lower-case extension with leading dot (e.g. '.pdf')
 */
export function getFileExtension(filename?: string): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Allowed and dangerous extension definitions
 */
export const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
export const ALLOWED_DOC_EXTS = new Set(['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.md']);
export const ALLOWED_SHEET_EXTS = new Set(['.xls', '.xlsx', '.csv']);
export const ALLOWED_PRESENTATION_EXTS = new Set(['.ppt', '.pptx']);
export const ALLOWED_ARCHIVE_EXTS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz']);
export const ALLOWED_CODE_DATA_EXTS = new Set(['.json', '.xml', '.sql', '.yaml', '.yml', '.env.example', '.ini', '.toml', '.log']);
export const ALLOWED_AUDIO_EXTS = new Set(['.webm', '.ogg', '.mp3', '.m4a', '.wav', '.aac']);

export const DANGEROUS_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.mjs', '.cjs',
  '.ts', '.py', '.rb', '.pl', '.cgi', '.jar', '.vbs', '.ps1', '.msi',
  '.apk', '.com', '.scr', '.pif', '.hta', '.html', '.htm', '.asp', '.aspx',
  '.jsp', '.svg',
]);

/**
 * Check if a file is an image based on name and/or mime type
 */
export function isImageFile(filename?: string, mimetype?: string): boolean {
  if (mimetype && (mimetype.startsWith('image/jpeg') || mimetype.startsWith('image/png') || mimetype.startsWith('image/webp') || mimetype.startsWith('image/gif'))) {
    return true;
  }
  const ext = getFileExtension(filename);
  return ALLOWED_IMAGE_EXTS.has(ext);
}

/**
 * Categorize a file for visual icon display
 */
export function getFileCategory(filename?: string): 'image' | 'pdf' | 'doc' | 'sheet' | 'archive' | 'code' | 'audio' | 'generic' {
  const ext = getFileExtension(filename);
  if (ALLOWED_IMAGE_EXTS.has(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (ALLOWED_DOC_EXTS.has(ext)) return 'doc';
  if (ALLOWED_SHEET_EXTS.has(ext)) return 'sheet';
  if (ALLOWED_ARCHIVE_EXTS.has(ext)) return 'archive';
  if (ALLOWED_CODE_DATA_EXTS.has(ext)) return 'code';
  if (ALLOWED_AUDIO_EXTS.has(ext)) return 'audio';
  return 'generic';
}

/**
 * Client-side file validation (Max size up to 200MB, reject dangerous exts)
 */
export function validateAttachmentFile(file: File, maxSizeMB = 200): { valid: boolean; error?: string; isImage: boolean } {
  const ext = getFileExtension(file.name);

  if (DANGEROUS_EXTS.has(ext)) {
    return {
      valid: false,
      error: 'نوع الملف محظور أمنياً لحماية الخادم والأجهزة (الملفات التنفيذية والسكربتات المباشرة غير مسموح بها، يرجى ضغط المشروع في ملف ZIP)',
      isImage: false,
    };
  }

  const isImg = isImageFile(file.name, file.type);
  const isDoc = ALLOWED_DOC_EXTS.has(ext);
  const isSheet = ALLOWED_SHEET_EXTS.has(ext);
  const isPres = ALLOWED_PRESENTATION_EXTS.has(ext);
  const isArch = ALLOWED_ARCHIVE_EXTS.has(ext);
  const isCodeData = ALLOWED_CODE_DATA_EXTS.has(ext);
  const isAudio = ALLOWED_AUDIO_EXTS.has(ext);

  if (!isImg && !isDoc && !isSheet && !isPres && !isArch && !isCodeData && !isAudio) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى إرسال ملفات المشاريع بصيغة (ZIP, RAR, 7Z, TAR.GZ) أو المستندات وقواعد البيانات',
      isImage: false,
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى المسموح به وهو ${maxSizeMB} ميجابايت`,
      isImage: isImg,
    };
  }

  return { valid: true, isImage: isImg };
}

/**
 * Trigger secure download of an attachment with token if available
 */
export async function downloadAttachment(fileUrl: string, fileName?: string): Promise<void> {
  if (!fileUrl) return;

  try {
    const downloadUrl = fileUrl.includes('?') ? `${fileUrl}&download=1` : `${fileUrl}?download=1`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'attachment';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('Download error, opening directly', err);
    window.open(fileUrl, '_blank');
  }
}
