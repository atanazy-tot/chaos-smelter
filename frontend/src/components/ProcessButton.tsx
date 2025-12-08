interface ProcessButtonProps {
  canProcess: boolean;
  isProcessing: boolean;
  activeMode: 'file' | 'text' | null;
  fileCount: number;
  textLength: number;
  onProcess: () => void;
}

export function ProcessButton({
  canProcess,
  isProcessing,
  activeMode,
  fileCount,
  textLength,
  onProcess,
}: ProcessButtonProps) {
  const bgColor = canProcess
    ? activeMode === 'file'
      ? 'bg-lime'
      : 'bg-lavender'
    : 'bg-gray-200';

  const statusText = canProcess ? 'READY TO PROCESS' : 'WAITING FOR INPUT';

  const inputText =
    activeMode === 'file' && fileCount > 0
      ? `${fileCount} FILE${fileCount > 1 ? 'S' : ''} SELECTED`
      : activeMode === 'text' && textLength > 0
      ? `${textLength} CHARACTERS OF TEXT`
      : 'DROP FILES OR PASTE TEXT TO BEGIN';

  return (
    <div
      className={`
        mt-8 ${bgColor} border-brutal-thick p-8 shadow-brutal
        flex justify-between items-center flex-wrap gap-6
      `}
    >
      <div>
        <p className="text-xs uppercase tracking-widest opacity-70 mb-2">
          {statusText}
        </p>
        <p className="text-xl font-bold">
          {activeMode === 'file' && fileCount > 0 && '>> '}
          {activeMode === 'text' && textLength > 0 && '>> '}
          {inputText}
        </p>
      </div>

      <button
        onClick={onProcess}
        disabled={isProcessing || !canProcess}
        className={`
          ${isProcessing ? 'bg-gray-600' : canProcess ? 'bg-black' : 'bg-gray-400'}
          text-cream border-none px-16 py-6
          text-xl font-bold uppercase tracking-widest
          ${isProcessing || !canProcess ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          shadow-brutal btn-press transition-all duration-100
        `}
      >
        {isProcessing ? (
          <span className="flex items-center gap-3">
            <span className="animate-spin-slow inline-block">@</span>
            PROCESSING...
          </span>
        ) : (
          'SMELT IT >>'
        )}
      </button>
    </div>
  );
}
