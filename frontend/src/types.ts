/** File data for upload */
export interface FileData {
  name: string;
  data: string; // base64
  mime: string;
  size: number;
}

/** Progress update from server */
export interface ProgressUpdate {
  type: 'progress';
  file: string;
  percent: number;
  status: string;
}

/** Completion message from server */
export interface CompleteMessage {
  type: 'complete';
  file: string;
  content: string;
}

/** Error message from server */
export interface ErrorMessage {
  type: 'error';
  file: string;
  message: string;
  code: string;
}

/** Done message from server */
export interface DoneMessage {
  type: 'done';
}

/** All possible server messages */
export type ServerMessage = ProgressUpdate | CompleteMessage | ErrorMessage | DoneMessage;

/** Processing result */
export interface ProcessResult {
  name: string;
  sourceName: string;
  content: string;
}

/** File processing state */
export interface FileProgress {
  name: string;
  percent: number;
  status: string;
  error?: string;
}

/** App state */
export type AppState = 'empty' | 'input' | 'processing' | 'results';

/** Maximum file size in bytes (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum number of files */
export const MAX_FILE_COUNT = 10;

/** Supported audio extensions */
export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg'];

/** Check if file is a supported audio format */
export function isSupportedFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/** Get MIME type for audio file */
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/** Convert File to FileData */
export async function fileToFileData(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        name: file.name,
        data: base64,
        mime: getMimeType(file.name),
        size: file.size,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
