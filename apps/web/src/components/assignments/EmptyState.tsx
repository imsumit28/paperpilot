import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-[486px] mx-auto">
      {/* Illustration + text block */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Clip SVG to show only the illustration (hide embedded text/button) */}
        <div className="w-[300px] h-[256px] overflow-hidden">
          <Image
            src="/assignments/empty-state.svg"
            alt=""
            width={373}
            height={657}
            className="w-[300px] object-cover object-top"
            priority
          />
        </div>

        {/* Text block */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <h2 className="text-[20px] font-bold tracking-[-0.04em] leading-[1.4] text-[#303030] text-center">
            No assignments yet
          </h2>
          <p className="text-[16px] font-normal tracking-[-0.04em] leading-[1.4] text-[rgba(94,94,94,0.8)] text-center w-full">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
        </div>
      </div>

      {/* Button */}
      <Link
        href="/assignments/new"
        className="inline-flex items-center justify-center gap-1 w-[277px] h-[46px] px-6 rounded-[48px] bg-[#181818] text-white text-[16px] font-medium tracking-[-0.04em] hover:bg-black active:scale-[0.98] transition-all"
      >
        <Plus className="h-5 w-5 shrink-0" />
        Create Your First Assignment
      </Link>
    </div>
  );
}
