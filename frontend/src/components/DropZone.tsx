import { useCallback, useRef, useState } from 'react';
import { Waveform } from '@phosphor-icons/react';
import { MAX_FILE_SIZE, MAX_FILE_COUNT, isSupportedFile } from '../types';

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  isActive: boolean;
}

export function DropZone({ files, onFilesChange, isActive }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((newFiles: File[]) => {
    setError(null);
    const validFiles: File[] = [];

    // Check total file count
    const remainingSlots = MAX_FILE_COUNT - files.length;
    if (remainingSlots <= 0) {
      setError(`MAX ${MAX_FILE_COUNT} FILES. REMOVE SOME FIRST.`);
      return;
    }

    for (const file of newFiles.slice(0, remainingSlots)) {
      if (!isSupportedFile(file.name)) {
        setError(`CAN'T READ THAT: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`FILE TOO CHUNKY: ${file.name} (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (newFiles.length > remainingSlots) {
      setError(`MAX ${MAX_FILE_COUNT} FILES. SOME WERE SKIPPED.`);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  }, [validateAndAddFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(selectedFiles);
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [validateAndAddFiles]);

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const bgColor = isDragging ? 'bg-yellow' : isActive ? 'bg-lime' : 'bg-cream';
  const shadow = isDragging || isActive ? 'shadow-brutal-lg' : 'shadow-brutal';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        flex-1 min-w-full md:min-w-[400px] min-h-[320px]
        ${bgColor} border-brutal-thick p-12
        flex flex-col justify-center items-center
        cursor-pointer transition-all duration-150
        ${shadow}
        ${isDragging ? '-translate-x-1 -translate-y-1' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.ogg"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mb-6">
        <Waveform size={64} weight={isDragging ? "fill" : "duotone"} />
      </div>

      <h2 className="text-2xl font-bold uppercase tracking-tight mb-3">
        {isDragging ? 'RELEASE!' : files.length > 0 ? `${files.length} AUDIO${files.length > 1 ? 'S' : ''}` : 'DROP AUDIO'}
      </h2>

      <p className="text-sm text-gray-600">
        {files.length > 0 ? 'Click to add more' : '.MP3 / .WAV / .M4A / .OGG'}
      </p>

      {error && (
        <p className="text-sm text-coral font-bold mt-4 uppercase">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-5 w-full max-h-[120px] overflow-y-auto"
        >
          {files.map((file, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-cream border-brutal p-2 mb-1.5 text-xs"
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(i)}
                className="bg-coral border-2 border-black px-2 py-0.5 font-bold hover:bg-red-400 btn-press"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
