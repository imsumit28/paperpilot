'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { DEFAULT_SCHOOL_LOGO, useAuthStore } from '@/store/useAuthStore';
import { VedaLogo } from '@/components/layout/VedaLogo';
import { UserAvatar } from '@/components/layout/UserAvatar';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginOrRegister = useAuthStore((s) => s.loginOrRegister);
  const [hydrated, setHydrated] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    router.replace(searchParams.get('next') || '/home');
  }, [hydrated, isAuthenticated, router, searchParams]);

  function onLogoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSchoolLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const finalLogo = schoolLogo || schoolLogoUrl.trim() || DEFAULT_SCHOOL_LOGO;
    loginOrRegister({
      teacherName,
      schoolName,
      schoolAddress,
      schoolLogo: finalLogo,
    });
    router.replace(searchParams.get('next') || '/home');
  }

  function applyLogoFromLink() {
    const trimmed = schoolLogoUrl.trim();
    if (!trimmed) return;
    setSchoolLogo(trimmed);
  }

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#EDEDED] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid w-full max-w-[1240px] overflow-hidden rounded-[30px] border border-border/40 bg-white shadow-[0px_24px_64px_rgba(0,0,0,0.12)] lg:min-h-[88vh] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-[#1F1F1F] p-6 text-white lg:p-10">
          <div className="pointer-events-none absolute -left-20 -top-24 h-[260px] w-[260px] rounded-full bg-[#FF7A2D]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-[260px] w-[260px] rounded-full bg-[#FFFFFF]/10 blur-3xl" />
          <div className="relative z-10">
            <VedaLogo variant="light" />
            <p className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-white/90">
              AI ASSESSMENT CREATOR
            </p>
            <h1 className="mt-4 max-w-[540px] text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] lg:text-[42px]">
              Build, generate, and publish classroom-ready assessments with AI.
            </h1>
            <p className="mt-4 max-w-[560px] text-sm leading-[1.6] text-white/80 lg:text-base">
              Create assignments from structured inputs, trigger background generation, and deliver polished question papers
              with section hierarchy and difficulty-based marking.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm font-semibold tracking-[-0.02em]">Assignment Workflow</p>
                <p className="mt-1 text-sm text-white/80">Due date, question types, marks, instructions, and optional source upload.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm font-semibold tracking-[-0.02em]">AI Generation Pipeline</p>
                <p className="mt-1 text-sm text-white/80">Prompt structuring, sectioned output, difficulty tags, and marks mapping.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm font-semibold tracking-[-0.02em]">Verification and Delivery</p>
                <p className="mt-1 text-sm text-white/80">Queue-backed processing, real-time updates, and exam-style output formatting.</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#FFB486]/50 bg-[#2A2A2A] p-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#FFD8B8]">SYSTEM VERIFICATION IDEA</p>
              <p className="mt-2 text-sm text-white/85">
                Profile binding links teacher identity + school branding so generated papers stay institution-specific across sessions.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 lg:p-10">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A2A2A2]">Welcome</p>
                <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] text-[#232323]">Enter your details</h2>
              </div>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="teacherName">Teacher Name</Label>
                <Input
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter school name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="schoolAddress">School Address</Label>
                <Input
                  id="schoolAddress"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="Enter school address"
                />
              </div>

              <div>
                <Label htmlFor="schoolLogo">School Logo</Label>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full bg-[#F6F6F6]">
                    <UserAvatar size={44} src={schoolLogo || DEFAULT_SCHOOL_LOGO} alt={schoolName || 'School logo'} />
                  </div>
                  <input
                    id="schoolLogo"
                    type="file"
                    accept="image/*"
                    onChange={onLogoSelect}
                    className="block w-full text-sm text-[#5E5E5E] file:mr-3 file:rounded-full file:border-0 file:bg-[#303030] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    id="schoolLogoUrl"
                    value={schoolLogoUrl}
                    onChange={(e) => setSchoolLogoUrl(e.target.value)}
                    placeholder="Paste school logo image URL"
                  />
                  <Button type="button" variant="outline" onClick={applyLogoFromLink}>
                    Use Link
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continue
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
