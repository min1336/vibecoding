export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_UNZIP_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_ZIP_ENTRIES = 500;
export const MAX_INLINE_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
export const PAGE_SIZE = 12;

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export const ALLOWED_FILE_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
];

export const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".sh", ".php", ".py", ".rb", ".cmd", ".com", ".msi",
];

export const TOOLS = [
  "v0",
  "bolt.new",
  "Cursor",
  "Claude Code",
  "Lovable",
  "기타",
] as const;

export type ToolType = (typeof TOOLS)[number];
