'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M0 2.71698C0 1.21643 1.21643 0 2.71698 0H5.77359C7.27413 0 8.49057 1.21643 8.49057 2.71698V5.77359C8.49057 7.27413 7.27413 8.49057 5.77358 8.49057H2.71698C1.21643 8.49057 0 7.27413 0 5.77358V2.71698Z" fill="white" fillOpacity="0.25" />
      <path d="M9.50928 2.71698C9.50928 1.21643 10.7257 0 12.2263 0H15.2829C16.7834 0 17.9998 1.21643 17.9998 2.71698V5.77359C17.9998 7.27413 16.7834 8.49057 15.2829 8.49057H12.2263C10.7257 8.49057 9.50928 7.27413 9.50928 5.77358V2.71698Z" fill="white" fillOpacity="0.25" />
      <path d="M0 12.2265C0 10.726 1.21643 9.50952 2.71698 9.50952H5.77359C7.27413 9.50952 8.49057 10.726 8.49057 12.2265V15.2831C8.49057 16.7837 7.27413 18.0001 5.77358 18.0001H2.71698C1.21643 18.0001 0 16.7837 0 15.2831V12.2265Z" fill="white" fillOpacity="0.25" />
      <path d="M9.50928 12.2265C9.50928 10.726 10.7257 9.50952 12.2263 9.50952H15.2829C16.7834 9.50952 17.9998 10.726 17.9998 12.2265V15.2831C17.9998 16.7837 16.7834 18.0001 15.2829 18.0001H12.2263C10.7257 18.0001 9.50928 16.7837 9.50928 15.2831V12.2265Z" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

function ToolkitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.63783 8.63783L6.18377 4H7.13246L8.6784 8.63783L13.3162 10.1838V11.1325L8.6784 12.6784L7.13246 17.3162H6.18377L4.63783 12.6784L0 11.1325V10.1838L4.63783 8.63783Z"
        fill="white"
        fillOpacity="0.25"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3878 2.38783L14.1838 0H15.1325L15.9284 2.38783L18.3162 3.18377V4.13246L15.9284 4.9284L15.1325 7.31623H14.1838L13.3878 4.9284L11 4.13246V3.18377L13.3878 2.38783Z"
        fill="white"
        fillOpacity="0.25"
      />
    </svg>
  );
}

function AssignmentsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.66663 1.66663C7.12686 1.66663 7.49996 2.03972 7.49996 2.49996H12.5C12.5 2.03972 12.8731 1.66663 13.3333 1.66663C13.7935 1.66663 14.1666 2.03972 14.1666 2.49996C16.4678 2.49996 18.3333 4.36544 18.3333 6.66663V14.1666C18.3333 16.4678 16.4678 18.3333 14.1666 18.3333H5.83329C3.53211 18.3333 1.66663 16.4678 1.66663 14.1666V6.66663C1.66663 4.36544 3.53211 2.49996 5.83329 2.49996C5.83329 2.03972 6.20639 1.66663 6.66663 1.66663ZM4.99996 8.33329C4.99996 7.87306 5.37306 7.49996 5.83329 7.49996H14.1666C14.6269 7.49996 15 7.87306 15 8.33329C15 8.79353 14.6269 9.16663 14.1666 9.16663H5.83329C5.37306 9.16663 4.99996 8.79353 4.99996 8.33329ZM12.5 14.1666C12.5 13.7064 12.8731 13.3333 13.3333 13.3333H14.1666C14.6269 13.3333 15 13.7064 15 14.1666C15 14.6269 14.6269 15 14.1666 15H13.3333C12.8731 15 12.5 14.6269 12.5 14.1666Z"
        fill={active ? 'white' : 'rgba(255, 255, 255, 0.25)'}
      />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="14" height="17" viewBox="0 0 14 17" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.66667 0.416667C6.66667 0.186548 6.48012 0 6.25 0H3.33333C1.49238 0 0 1.49238 0 3.33333V13.3333C0 15.1743 1.49238 16.6667 3.33333 16.6667H10C11.8409 16.6667 13.3333 15.1743 13.3333 13.3333V7.08333C13.3333 6.85321 13.1468 6.66667 12.9167 6.66667H10.8333C8.53215 6.66667 6.66667 4.80119 6.66667 2.5V0.416667ZM12.6829 5C12.96 5 13.1591 4.73244 13.026 4.48942C12.913 4.28308 12.7704 4.09194 12.6011 3.92259L9.41074 0.732233C9.2414 0.562886 9.05026 0.420344 8.84391 0.307336C8.60089 0.174239 8.33333 0.373371 8.33333 0.650457V2.5C8.33333 3.88071 9.45262 5 10.8333 5H12.6829ZM6.66667 7.5C7.1269 7.5 7.5 7.8731 7.5 8.33333V10H9.16667C9.6269 10 10 10.3731 10 10.8333C10 11.2936 9.6269 11.6667 9.16667 11.6667H7.5V13.3333C7.5 13.7936 7.1269 14.1667 6.66667 14.1667C6.20643 14.1667 5.83333 13.7936 5.83333 13.3333V11.6667H4.16667C3.70643 11.6667 3.33333 11.2936 3.33333 10.8333C3.33333 10.3731 3.70643 10 4.16667 10H5.83333V8.33333C5.83333 7.8731 6.20643 7.5 6.66667 7.5Z"
        fill="white"
        fillOpacity="0.25"
      />
    </svg>
  );
}

const ITEMS = [
  { href: '/home', label: 'Home' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/library', label: 'Library' },
  { href: '/toolkit', label: 'AI Toolkit' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[373px] max-w-[calc(100vw-20px)]">
      <div className="bottom-nav-shadow bg-[#181818] rounded-[24px] h-[72px] flex items-center justify-between px-6 gap-[43px]">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1"
            >
              {item.href === '/assignments' ? (
                <AssignmentsIcon active={active} />
              ) : item.href === '/home' ? (
                <HomeIcon />
              ) : item.href === '/library' ? (
                <LibraryIcon />
              ) : item.href === '/toolkit' ? (
                <ToolkitIcon />
              ) : (
                <HomeIcon />
              )}
              <span
                className={cn(
                  'text-[12px] font-semibold leading-[1.4] tracking-[-0.04em] whitespace-nowrap',
                  active ? 'text-white' : 'text-white/25',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
