import { MessageItem } from '../types';

/**
 * Merges two arrays of MessageItems, deduplicates by ID,
 * and sorts strictly in chronological order (oldest first).
 */
export function mergeAndSortMessages(
  current: MessageItem[],
  incoming: MessageItem[]
): MessageItem[] {
  const map = new Map<string, MessageItem>();

  // Add existing
  for (const m of current) {
    if (m && m.id) {
      map.set(m.id, m);
    }
  }

  // Add/overwrite with incoming
  for (const m of incoming) {
    if (m && m.id) {
      map.set(m.id, m);
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
export const ALLOWED_DOC_EXTS = new Set(['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']);
export const ALLOWED_SHEET_EXTS = new Set(['.xls', '.xlsx', '.csv']);
export const ALLOWED_PRESENTATION_EXTS = new Set(['.ppt', '.pptx']);
export const ALLOWED_ARCHIVE_EXTS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz']);
export const ALLOWED_AUDIO_EXTS = new Set(['.webm', '.ogg', '.mp3', '.m4a', '.wav', '.aac']);

export const DANGEROUS_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.mjs', '.cjs',
  '.ts', '.py', '.rb', '.pl', '.cgi', '.jar', '.vbs', '.ps1', '.msi',
  '.apk', '.com', '.scr', '.pif', '.hta', '.html', '.htm', '.asp', '.aspx',
  '.jsp', '.svg', '.xml',
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
export function getFileCategory(filename?: string): 'image' | 'pdf' | 'doc' | 'sheet' | 'archive' | 'audio' | 'generic' {
  const ext = getFileExtension(filename);
  if (ALLOWED_IMAGE_EXTS.has(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (ALLOWED_DOC_EXTS.has(ext)) return 'doc';
  if (ALLOWED_SHEET_EXTS.has(ext)) return 'sheet';
  if (ALLOWED_ARCHIVE_EXTS.has(ext)) return 'archive';
  if (ALLOWED_AUDIO_EXTS.has(ext)) return 'audio';
  return 'generic';
}

/**
 * Client-side file validation (Size max 15MB, reject dangerous exts)
 */
export function validateAttachmentFile(file: File, maxSizeMB = 15): { valid: boolean; error?: string; isImage: boolean } {
  const ext = getFileExtension(file.name);

  if (DANGEROUS_EXTS.has(ext)) {
    return {
      valid: false,
      error: 'نوع الملف غير مسموح به لأسباب أمنية (الملفات التنفيذية والبرمجية محظورة)',
      isImage: false,
    };
  }

  const isImg = isImageFile(file.name, file.type);
  const isDoc = ALLOWED_DOC_EXTS.has(ext);
  const isSheet = ALLOWED_SHEET_EXTS.has(ext);
  const isPres = ALLOWED_PRESENTATION_EXTS.has(ext);
  const isArch = ALLOWED_ARCHIVE_EXTS.has(ext);
  const isAudio = ALLOWED_AUDIO_EXTS.has(ext);

  if (!isImg && !isDoc && !isSheet && !isPres && !isArch && !isAudio) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى اختيار صورة، مستند (PDF/Word)، جدول بيانات، أرشيف أو ملف صوتي',
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
