import { useState, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { TextZone } from './components/TextZone';
import { ProcessButton } from './components/ProcessButton';
import { ProgressDisplay } from './components/ProgressBar';
import { ResultsView } from './components/ResultsView';
import { useWebSocket } from './hooks/useWebSocket';
import type { AppState } from './types';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [activeMode, setActiveMode] = useState<'file' | 'text' | null>(null);

  const {
    isProcessing,
    progress,
    results,
    error,
    processFiles,
    processText,
    reset: wsReset,
  } = useWebSocket();

  // Determine app state
  const appState: AppState = results.length > 0
    ? 'results'
    : isProcessing
    ? 'processing'
    : activeMode
    ? 'input'
    : 'empty';

  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setActiveMode('file');
      setTextInput('');
    } else {
      setActiveMode(null);
    }
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setTextInput(text);
    if (text.trim()) {
      setActiveMode('text');
      setFiles([]);
    } else {
      setActiveMode(null);
    }
  }, []);

  const handleProcess = useCallback(() => {
    if (activeMode === 'file' && files.length > 0) {
      processFiles(files);
    } else if (activeMode === 'text' && textInput.trim()) {
      processText(textInput);
    }
  }, [activeMode, files, textInput, processFiles, processText]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setTextInput('');
    setActiveMode(null);
    wsReset();
  }, [wsReset]);

  const canProcess =
    (activeMode === 'file' && files.length > 0) ||
    (activeMode === 'text' && textInput.trim().length > 0);

  return (
    <div className="min-h-screen bg-cream font-mono">
      {/* Header */}
      <header className="bg-black text-cream px-12 py-6 border-b-[6px] border-black">
        <h1 className="text-5xl font-bold tracking-tighter uppercase">
          SMELT
        </h1>
        <p className="text-sm mt-2 opacity-70 uppercase tracking-[4px]">
          RAW NOTES IN. CLEAN MARKDOWN OUT.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-12">
        {/* Error display */}
        {error && (
          <div className="mb-8 bg-coral border-brutal-thick p-6 shadow-brutal">
            <p className="text-lg font-bold uppercase">{error}</p>
          </div>
        )}

        {appState !== 'results' ? (
          <>
            {/* Dual Input Zone */}
            <div className="flex items-stretch flex-wrap">
              {/* Drop Zone */}
              <DropZone
                files={files}
                onFilesChange={handleFilesChange}
                isActive={activeMode === 'file'}
              />

              {/* OR Divider */}
              <div className="flex items-center justify-center px-6 z-10">
                <span className="bg-black text-cream px-5 py-4 text-lg font-bold uppercase tracking-widest writing-mode-vertical">
                  OR
                </span>
              </div>

              {/* Text Zone */}
              <TextZone
                text={textInput}
                onTextChange={handleTextChange}
                isActive={activeMode === 'text'}
              />
            </div>

            {/* Process Button */}
            <ProcessButton
              canProcess={canProcess}
              isProcessing={isProcessing}
              activeMode={activeMode}
              fileCount={files.length}
              textLength={textInput.length}
              onProcess={handleProcess}
            />

            {/* Progress Display */}
            {isProcessing && <ProgressDisplay progress={progress} />}
          </>
        ) : (
          /* Results View */
          <ResultsView results={results} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-cream px-12 py-6 mt-16 border-t-[6px] border-black text-center">
        <p className="text-xs uppercase tracking-[4px] opacity-70">
          BUILT FOR CLARITY / NO BS / JUST RESULTS
        </p>
      </footer>
    </div>
  );
}

export default App;
