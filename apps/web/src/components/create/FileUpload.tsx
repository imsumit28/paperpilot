'use client';

import { useCallback, useRef, useState } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
}

const ACCEPTED = '.pdf,.txt,text/plain,application/pdf';
const MAX_BYTES = 10 * 1024 * 1024;

export function FileUpload({ file, onFile }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      setError(null);
      const f = files?.[0];
      if (!f) return;
      if (f.size > MAX_BYTES) {
        setError('File too large (max 10MB)');
        return;
      }
      const okType = /\.(pdf|txt)$/i.test(f.name) || /^(text\/|application\/pdf)/.test(f.type);
      if (!okType) {
        setError('Only PDF or text files are supported');
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-[202px] flex-col items-center justify-center gap-4 rounded-[24px] border-[1.75px] border-dashed px-4 py-6 text-center transition-colors lg:px-8',
          dragging ? 'border-brand bg-brand/5' : 'border-black/20 bg-white',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div className="flex max-w-full items-center justify-center gap-3">
            <FileText className="h-5 w-5 text-ink-muted" />
            <span className="max-w-[60%] truncate text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="h-7 w-7 rounded-full hover:bg-surface-alt flex items-center justify-center"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white">
              <CloudUpload className="h-6 w-6 text-[#1E1E1E]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="max-w-[253px] text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] lg:max-w-none">
                Choose a file or drag &amp; drop it here
              </div>
              <div className="max-w-[253px] text-[14px] leading-[140%] tracking-[-0.04em] text-[#A9A9A9] lg:max-w-none">
                JPEG, PNG, upto 10MB
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 rounded-full bg-[#F6F6F6] px-6 text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]"
            >
              Continue
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="max-w-[317px] text-center text-[16px] leading-[140%] tracking-[-0.04em] text-[rgba(48,48,48,0.6)]">
        Upload images of your preferred document/image
      </p>
    </div>
  );
}
