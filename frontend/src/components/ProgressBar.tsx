import type { FileProgress } from '../types';

interface ProgressBarProps {
  progress: FileProgress[];
}

/** Single 10-block progress indicator */
function ProgressBlocks({ percent, status, error }: { percent: number; status: string; error?: string }) {
  const blocks = 10;
  const filled = Math.floor(percent / 10);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: blocks }).map((_, i) => (
            <div
              key={i}
              className={`w-3 md:w-4 h-5 md:h-6 border-2 border-black transition-colors duration-150 ${
                i < filled
                  ? error
                    ? 'bg-coral'
                    : percent === 100
                    ? 'bg-mint'
                    : 'bg-lime'
                  : 'bg-cream'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-bold w-12">{percent}%</span>
      </div>
      <span className={`text-xs uppercase tracking-wider truncate ${error ? 'text-coral' : 'text-gray-600'}`}>
        {error || status}
      </span>
    </div>
  );
}

export function ProgressDisplay({ progress }: ProgressBarProps) {
  if (progress.length === 0) return null;

  return (
    <div className="mt-8 bg-cream border-brutal-thick p-6 shadow-brutal">
      <h3 className="text-lg font-bold uppercase mb-4 tracking-tight">PROCESSING...</h3>
      <div className="space-y-4">
        {progress.map((file) => (
          <div key={file.name} className="flex flex-col gap-2">
            <span className="text-sm font-bold truncate max-w-[300px]">{file.name}</span>
            <ProgressBlocks percent={file.percent} status={file.status} error={file.error} />
          </div>
        ))}
      </div>
    </div>
  );
}
