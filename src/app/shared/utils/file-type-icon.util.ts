const SUPPORTED_FILE_TYPE_ICONS = new Set([
  'aac',
  'avi',
  'doc',
  'gif',
  'jpg',
  'mp3',
  'mpg',
  'pdf',
  'png',
  'ppt',
  'txt',
  'xls',
  'xml',
  'zip',
]);

const FILE_TYPE_ALIASES: Record<string, string> = {
  docx: 'doc',
  xlsx: 'xls',
  pptx: 'ppt',
  jpeg: 'jpg',
};

export function getFileExtension(fileName: string): string {
  const normalized = (fileName ?? '').trim().toLowerCase();
  const parts = normalized.split('.');

  return parts.length > 1
    ? (parts.pop() ?? 'txt')
    : 'txt';
}

export function getFileTypeIconPath(fileName: string): string {
  const extension = getFileExtension(fileName);

  const normalizedExtension =
    FILE_TYPE_ALIASES[extension] ?? extension;

  const icon =
    SUPPORTED_FILE_TYPE_ICONS.has(normalizedExtension)
      ? normalizedExtension
      : 'txt';

  return `/images/file-types/${icon}.svg`;
}