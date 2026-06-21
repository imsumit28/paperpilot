'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Image as ImageIcon, Link as LinkIcon, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { useAuthStore, DEFAULT_SCHOOL_LOGO } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const MAX_LOGO_BYTES = 1024 * 1024;

export default function SettingsPage() {
  const router = useRouter();
  const teacherName = useAuthStore((s) => s.teacherName);
  const schoolName = useAuthStore((s) => s.schoolName);
  const schoolAddress = useAuthStore((s) => s.schoolAddress);
  const schoolLogo = useAuthStore((s) => s.schoolLogo);
  const updateSchool = useAuthStore((s) => s.updateSchool);
  const resetSchoolLogo = useAuthStore((s) => s.resetSchoolLogo);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="Settings" />

      <div className="flex flex-col gap-4">
        <ProfileSection
          initial={{ teacherName, schoolName, schoolAddress }}
          onSave={(next) => {
            updateSchool(next);
            toast.success('Profile updated');
          }}
        />

        <LogoSection
          currentLogo={schoolLogo}
          schoolName={schoolName}
          onSave={(url) => {
            updateSchool({ schoolLogo: url });
            toast.success('Logo updated');
          }}
          onReset={() => {
            resetSchoolLogo();
            toast.success('Logo reset to default');
          }}
        />

        <AccountSection
          onLogout={() => {
            logout();
            router.push('/auth');
          }}
        />
      </div>
    </div>
  );
}

interface ProfileInitial {
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
}

function ProfileSection({
  initial,
  onSave,
}: {
  initial: ProfileInitial;
  onSave: (next: ProfileInitial) => void;
}) {
  const [teacherName, setTeacherName] = useState(initial.teacherName);
  const [schoolName, setSchoolName] = useState(initial.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(initial.schoolAddress);

  useEffect(() => {
    setTeacherName(initial.teacherName);
    setSchoolName(initial.schoolName);
    setSchoolAddress(initial.schoolAddress);
  }, [initial.teacherName, initial.schoolName, initial.schoolAddress]);

  const dirty =
    teacherName !== initial.teacherName ||
    schoolName !== initial.schoolName ||
    schoolAddress !== initial.schoolAddress;

  return (
    <Card className="p-5 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <SectionHeader
          title="School profile"
          description="Shown on generated papers and in the sidebar."
        />
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="teacherName">Teacher name</Label>
              <Input
                id="teacherName"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <Label htmlFor="schoolName">School name</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Delhi Public School"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="schoolAddress">School address</Label>
            <Input
              id="schoolAddress"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              placeholder="e.g. Bokaro Steel City"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              size="sm"
              disabled={!dirty}
              onClick={() => onSave({ teacherName, schoolName, schoolAddress })}
              className="w-full sm:w-auto"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LogoSection({
  currentLogo,
  schoolName,
  onSave,
  onReset,
}: {
  currentLogo: string;
  schoolName: string;
  onSave: (url: string) => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDefault = currentLogo === DEFAULT_SCHOOL_LOGO;

  function handleUrlPreview() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setPreviewError('Enter an image URL');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setPreviewError('Invalid URL');
      return;
    }
    setPreviewError(null);
    setPreview(trimmed);
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Image too large — max 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string') {
        setPreview(dataUrl);
        setPreviewError(null);
      }
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  }

  function commit() {
    if (!preview) return;
    onSave(preview);
    setPreview(null);
    setUrlInput('');
  }

  function discard() {
    setPreview(null);
    setUrlInput('');
    setPreviewError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <Card className="p-5 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <SectionHeader
          title="School logo"
          description="Appears in the sidebar and on exported papers."
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-brand-100">
              <UserAvatar size={64} src={preview ?? currentLogo} alt={schoolName} />
            </div>
            <div className="min-w-0 flex-1 text-sm text-ink-muted">
              {preview ? 'Preview — save to apply' : isDefault ? 'Using default logo' : 'Custom logo'}
            </div>
            {!isDefault && !preview && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<RotateCcw className="h-4 w-4" />}
                onClick={onReset}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full bg-surface-alt p-1 w-fit">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold tracking-[-0.02em]',
                mode === 'url' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted',
              )}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold tracking-[-0.02em]',
                mode === 'upload' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted',
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          </div>

          {mode === 'url' ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlPreview()}
                />
                {previewError && <p className="mt-1 text-xs text-rose-600">{previewError}</p>}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUrlPreview}
                className="w-full sm:w-auto"
              >
                Preview
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload school logo"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ImageIcon className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                Choose image
              </Button>
              <p className="mt-2 text-xs text-ink-muted">PNG, JPG, or SVG — up to 1MB.</p>
            </div>
          )}

          {preview && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={discard}
                className="w-full sm:w-auto"
              >
                Discard
              </Button>
              <Button size="sm" onClick={commit} className="w-full sm:w-auto">
                Save logo
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function AccountSection({ onLogout }: { onLogout: () => void }) {
  return (
    <Card className="p-5 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <SectionHeader title="Account" description="Sign out of this device." />
        <div>
          <Button
            variant="danger"
            size="sm"
            iconLeft={<LogOut className="h-4 w-4" />}
            onClick={() => {
              if (confirm('Log out?')) onLogout();
            }}
            className="w-full sm:w-auto"
          >
            Log out
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="lg:pr-4">
      <h2 className="text-lg font-bold text-ink tracking-[-0.02em]">{title}</h2>
      <p className="text-sm text-ink-muted mt-0.5">{description}</p>
    </div>
  );
}
