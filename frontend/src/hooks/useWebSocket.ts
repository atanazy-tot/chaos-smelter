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
  const pendingFilesRef = useRef<FileData[]>([]);
  const currentFileIndexRef = useRef<number>(0);
  const totalFilesRef = useRef<number>(0);

  // Send next file in queue
  const sendNextFile = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[WS] Cannot send - connection not open');
      return;
    }

    const index = currentFileIndexRef.current;
    const files = pendingFilesRef.current;

    if (index >= files.length) {
      console.log('[WS] All files sent');
      return;
    }

    const file = files[index];
    console.log(`[WS] Sending file ${index + 1}/${files.length}: ${file.name}`);

    const message = JSON.stringify({
      type: 'process',
      files: [file], // Send ONE file at a time
      text: null,
    });

    console.log(`[WS] Message size: ${(message.length / 1024 / 1024).toFixed(2)} MB`);
    ws.send(message);
  }, []);

  // Handle incoming messages
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
        // One file batch complete - send next file
        currentFileIndexRef.current += 1;
        const nextIndex = currentFileIndexRef.current;
        const total = totalFilesRef.current;

        console.log(`[WS] Batch done. ${nextIndex}/${total}`);

        if (nextIndex < total) {
          // More files - send next
          sendNextFile();
        } else {
          // All done!
          console.log('[WS] All complete:', resultsRef.current.length, 'results');
          setResults([...resultsRef.current]);
          setIsProcessing(false);

          // Close connection
          if (wsRef.current) {
            wsRef.current.close(1000, 'Complete');
          }
        }
        break;
    }
  }, [sendNextFile]);

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

  // Process multiple files (sent one at a time)
  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setProgress([]);
    setResults([]);
    resultsRef.current = [];
    pendingFilesRef.current = [];
    currentFileIndexRef.current = 0;
    totalFilesRef.current = files.length;
    setIsProcessing(true);

    // Initialize progress for all files
    setProgress(files.map((f) => ({ name: f.name, percent: 0, status: 'QUEUED' })));

    try {
      console.log('[WS] Converting', files.length, 'files...');

      // Convert all files to base64
      const fileData: FileData[] = await Promise.all(files.map(fileToFileData));
      pendingFilesRef.current = fileData;

      // Connect and send first file
      await connect();
      sendNextFile();
    } catch (e) {
      console.error('[WS] Error:', e);
      setIsProcessing(false);
      setError('FAILED TO PROCESS. TRY AGAIN.');
    }
  }, [connect, sendNextFile]);

  // Process text
  const processText = useCallback(async (text: string) => {
    setError(null);
    setProgress([]);
    setResults([]);
    resultsRef.current = [];
    pendingFilesRef.current = [];
    currentFileIndexRef.current = 0;
    totalFilesRef.current = 1;
    setIsProcessing(true);

    setProgress([{ name: 'pasted_text', percent: 0, status: 'QUEUED' }]);

    try {
      const ws = await connect();
      ws.send(JSON.stringify({ type: 'process', files: [], text }));
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

    pendingFilesRef.current = [];
    currentFileIndexRef.current = 0;
    totalFilesRef.current = 0;
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
