interface UserAvatarProps {
  size?: number;
  className?: string;
  src?: string;
  alt?: string;
}

export function UserAvatar({ size = 36, className, src, alt }: UserAvatarProps) {
  return (
    <img
      src={src || '/avatars/delhi-public-school.svg'}
      alt={alt || 'School avatar'}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'cover' }}
    />
  );
}
