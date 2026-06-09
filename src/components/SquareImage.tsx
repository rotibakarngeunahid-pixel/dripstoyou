import Image from 'next/image';

interface SquareImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  unoptimized?: boolean;
  priority?: boolean;
  style?: React.CSSProperties;
}

/**
 * Renders a Next.js Image inside a 1:1 aspect-ratio container.
 * Wrap in a div to control width.
 */
export default function SquareImage({
  src,
  alt,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px',
  className,
  unoptimized,
  priority,
  style,
}: SquareImageProps) {
  return (
    <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', width: '100%', ...style }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        unoptimized={unoptimized}
        priority={priority}
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
