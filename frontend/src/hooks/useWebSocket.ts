import { useCallback, useRef, useState } from 'react';
import type {
  FileData,
  FileProgress,
  ProcessResult,
  ServerMessage,
} from '../types';
import { fileToFileData } from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  isProcessing: boolean;
  progress: FileProgress[];
  results: ProcessResult[];
  error: string | null;
  processFiles: (files: File[]) => Promise<void>;
  processText: (text: string) => Promise<void>;
  reset: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<FileProgress[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // All refs declared together at the top
  const wsRef = useRef<WebSocket | null>(null);
  const resultsRef = useRef<ProcessResult[]>([]);

  // Handle incoming messages - parallel processing version
  const handleMessage = useCallback((msg: ServerMessage) => {
    console.log('[WS] Received:', msg.type);

    switch (msg.type) {
      case 'progress':
        setProgress((prev) =>
          prev.map((p) =>
            p.name === msg.file ? { ...p, percent: msg.percent, status: msg.status } : p
          )
        );
        break;

      case 'complete': {
        const newResult: ProcessResult = {
          name: msg.file.replace(/\.[^/.]+$/, '_smelt.md'),
          sourceName: msg.file,
          content: msg.content,
        };
        resultsRef.current = [...resultsRef.current, newResult];
        console.log('[WS] Result added:', resultsRef.current.length);

        setProgress((prev) =>
          prev.map((p) =>
            p.name === msg.file ? { ...p, percent: 100, status: 'DONE' } : p
          )
        );
        break;
      }

      case 'error':
        console.error('[WS] Error:', msg.file, msg.message);
        setProgress((prev) =>
          prev.map((p) =>
            p.name === msg.file ? { ...p, error: msg.message } : p
          )
        );
        break;

      case 'done':
        // ALL files complete - backend sends this after all parallel tasks finish
        console.log('[WS] All complete:', resultsRef.current.length, 'results');
        setResults([...resultsRef.current]);
        setIsProcessing(false);

        // Close connection
        if (wsRef.current) {
          wsRef.current.close(1000, 'Complete');
        }
        break;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = import.meta.env.DEV
        ? 'ws://localhost:8000/ws/process'
        : `${protocol}//${window.location.host}/ws/process`;

      console.log('[WS] Connecting:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        resolve(ws);
      };

      ws.onerror = (e) => {
        console.error('[WS] Error:', e);
        setError('CONNECTION FAILED. IS THE SERVER RUNNING?');
        setIsProcessing(false);
        reject(e);
      };

      ws.onclose = (e) => {
        console.log('[WS] Closed:', e.code, e.reason);
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      wsRef.current = ws;
    });
  }, [handleMessage]);

  // Process multiple files in parallel
  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setProgress([]);
    setResults([]);
    resultsRef.current = [];
    setIsProcessing(true);

    // Initialize progress for all files
    setProgress(files.map((f) => ({ name: f.name, percent: 0, status: 'QUEUED' })));

    try {
      console.log('[WS] Converting', files.length, 'files...');

      // Convert all files to base64
      const fileData: FileData[] = await Promise.all(files.map(fileToFileData));

      // Connect to WebSocket
      const ws = await connect();

      // 1. Send start message with file count
      console.log('[WS] Sending start with count:', files.length);
      ws.send(JSON.stringify({ type: 'start', count: files.length }));

      // 2. Send all files immediately (one message per file, but all at once)
      for (const file of fileData) {
        console.log(`[WS] Sending file: ${file.name}`);
        ws.send(JSON.stringify({
          type: 'process',
          files: [file],
          text: null,
        }));
      }

      // 3. Send end signal - backend will process all in parallel and respond with 'done' when ALL complete
      console.log('[WS] Sending end signal');
      ws.send(JSON.stringify({ type: 'end' }));

    } catch (e) {
      console.error('[WS] Error:', e);
      setIsProcessing(false);
      setError('FAILED TO PROCESS. TRY AGAIN.');
    }
  }, [connect]);

  // Process text
  const processText = useCallback(async (text: string) => {
    setError(null);
    setProgress([]);
    setResults([]);
    resultsRef.current = [];
    setIsProcessing(true);

    setProgress([{ name: 'pasted_text', percent: 0, status: 'QUEUED' }]);

    try {
      const ws = await connect();

      // Use same protocol: start -> process -> end
      ws.send(JSON.stringify({ type: 'start', count: 1 }));
      ws.send(JSON.stringify({ type: 'process', files: [], text }));
      ws.send(JSON.stringify({ type: 'end' }));
    } catch (e) {
      console.error('[WS] Error:', e);
      setIsProcessing(false);
      setError('FAILED TO CONNECT. TRY AGAIN.');
    }
  }, [connect]);

  // Reset state
  const reset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Reset');
      wsRef.current = null;
    }

    resultsRef.current = [];
    setIsConnected(false);
    setIsProcessing(false);
    setProgress([]);
    setResults([]);
    setError(null);
  }, []);

  return {
    isConnected,
    isProcessing,
    progress,
    results,
    error,
    processFiles,
    processText,
    reset,
  };
}
