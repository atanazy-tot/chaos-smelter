import { ClipboardText } from '@phosphor-icons/react';

interface TextZoneProps {
  text: string;
  onTextChange: (text: string) => void;
  isActive: boolean;
}

export function TextZone({ text, onTextChange, isActive }: TextZoneProps) {
  const bgColor = isActive ? 'bg-lavender' : 'bg-cream';
  const shadow = isActive ? 'shadow-brutal-lg' : 'shadow-brutal';
  const textareaBg = isActive ? 'bg-cream' : 'bg-gray-100';

  return (
    <div
      className={`
        flex-1 min-w-[400px] min-h-[320px]
        ${bgColor} border-brutal-thick p-8
        flex flex-col transition-all duration-150
        ${shadow}
      `}
    >
      <div className="flex items-center gap-4 mb-4">
        <ClipboardText size={64} weight="duotone" />
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            PASTE TEXT
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            From Miro, Notion, anywhere
          </p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your messy notes here..."
        className={`
          flex-1 w-full ${textareaBg} border-brutal p-4
          text-base font-mono resize-none outline-none
          min-h-[150px]
        `}
      />

      {text && (
        <p className="text-xs text-gray-600 mt-3 uppercase tracking-wider">
          {text.length} CHARACTERS
        </p>
      )}
    </div>
  );
}
