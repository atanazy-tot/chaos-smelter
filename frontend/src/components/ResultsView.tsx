import { useState } from 'react';
import type { ProcessResult } from '../types';
import { Icons } from './Icons';

interface ResultsViewProps {
  results: ProcessResult[];
  onReset: () => void;
}

export function ResultsView({ results, onReset }: ResultsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentResult = results[currentIndex];

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(currentResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([currentResult.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentResult.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    // Combined file for MVP
    const combined = results
      .map((r) => `${'='.repeat(60)}\n${r.name}\n${'='.repeat(60)}\n\n${r.content}\n\n`)
      .join('\n');
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smelt_output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold uppercase flex items-center gap-4">
          <span className="bg-mint px-4 py-2 border-brutal">OK</span>
          {results.length} OUTPUT{results.length > 1 ? 'S' : ''} READY
        </h2>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={copyToClipboard}
            className="bg-cream border-brutal px-6 py-3 text-sm font-bold uppercase shadow-brutal-sm btn-press flex items-center gap-2"
          >
            {Icons.copy}
            {copied ? 'COPIED!' : 'COPY'}
          </button>

          <button
            onClick={downloadFile}
            className="bg-cyan border-brutal px-6 py-3 text-sm font-bold uppercase shadow-brutal-sm btn-press flex items-center gap-2"
          >
            {Icons.download}
            DOWNLOAD
          </button>

          {results.length > 1 && (
            <button
              onClick={downloadAll}
              className="bg-lavender border-brutal px-6 py-3 text-sm font-bold uppercase shadow-brutal-sm btn-press"
            >
              ALL FILES
            </button>
          )}

          <button
            onClick={onReset}
            className="bg-coral border-brutal px-6 py-3 text-sm font-bold uppercase shadow-brutal-sm btn-press"
          >
            NEW
          </button>
        </div>
      </div>

      {/* Navigation for multiple results */}
      {results.length > 1 && (
        <div className="flex items-center justify-center gap-6 mb-6 bg-lime border-brutal p-4 shadow-brutal-sm">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className={`bg-black text-cream p-3 ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'btn-press'
            }`}
          >
            {Icons.arrowLeft}
          </button>

          <div className="text-center">
            <p className="text-sm font-bold uppercase">
              {currentIndex + 1} / {results.length}
            </p>
            <p className="text-xs opacity-70 max-w-[300px] truncate">
              {currentResult.sourceName}
            </p>
          </div>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(results.length - 1, i + 1))}
            disabled={currentIndex === results.length - 1}
            className={`bg-black text-cream p-3 ${
              currentIndex === results.length - 1 ? 'opacity-30 cursor-not-allowed' : 'btn-press'
            }`}
          >
            {Icons.arrowRight}
          </button>
        </div>
      )}

      {/* Result content */}
      <div
        className="
          bg-[#1a1a1a] text-lime border-brutal-thick p-12
          shadow-brutal-lg font-mono text-base leading-relaxed
          whitespace-pre-wrap overflow-auto max-h-[600px]
        "
      >
        {currentResult.content}
      </div>
    </div>
  );
}
