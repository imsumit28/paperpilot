interface BrandLogoProps {
  /** 'full' = stacked wordmark + tagline (logo.png). 'mark' = icon only (mark.png). */
  variant?: 'full' | 'mark';
  className?: string;
}

// Brand assets live in apps/web/public/brand/:
//   logo.png  — full wordmark (icon + "Paper Pilot" + tagline)
//   mark.png  — icon mark only
const FULL_SRC = '/brand/logo.png';
const MARK_SRC = '/brand/mark.png';

export function BrandLogo({ variant = 'mark', className }: BrandLogoProps) {
  const isFull = variant === 'full';
  return (
    <img
      src={isFull ? FULL_SRC : MARK_SRC}
      alt="Paper Pilot"
      className={className ?? (isFull ? 'h-16 w-auto object-contain' : 'h-9 w-9 object-contain')}
    />
  );
}
