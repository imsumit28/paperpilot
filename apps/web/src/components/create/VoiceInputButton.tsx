'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface VoiceInputButtonProps {
  /** Called with the running transcript (final + interim joined) — caller chooses how to merge. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Fired when a recognition session starts. */
  onStart?: () => void;
  /** Fired when recognition stops (manual stop, error, or browser-ended). */
  onStop?: () => void;
  /** BCP-47 language tag. Defaults to en-US. */
  lang?: string;
  className?: string;
  /** Optional title override; falls back to default. */
  title?: string;
}

export function VoiceInputButton({
  onTranscript,
  onStart,
  onStop,
  lang = 'en-US',
  className,
  title,
}: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Voice input not supported in this browser.');
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        if (finalText) onTranscript(finalText, true);
        else if (interim) onTranscript(interim, false);
      };
      rec.onerror = (e: any) => {
        const code = e?.error ?? 'unknown';
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setError('Microphone permission denied.');
        } else if (code !== 'aborted' && code !== 'no-speech') {
          setError(`Voice input error: ${code}`);
        }
        setListening(false);
        onStop?.();
      };
      rec.onend = () => {
        setListening(false);
        onStop?.();
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      onStart?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start mic.');
      setListening(false);
    }
  }

  function stop() {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }

  if (!supported) return null;

  const Icon = listening ? MicOff : Mic;
  const defaultTitle = listening ? 'Stop voice input' : 'Speak to add to additional information';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => (listening ? stop() : start())}
        aria-pressed={listening}
        aria-label={defaultTitle}
        title={title ?? defaultTitle}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
          listening
            ? 'border-red-500 bg-red-500 text-white animate-pulse'
            : 'border-[#DADADA] bg-white text-[#303030] hover:bg-[#F0F0F0]',
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      {error && (
        <span className="text-[12px] leading-[140%] tracking-[-0.04em] text-red-600">{error}</span>
      )}
    </div>
  );
}
