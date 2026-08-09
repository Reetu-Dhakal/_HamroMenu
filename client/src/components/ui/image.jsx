import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cx } from '../../lib/format';

export default function SmartImage({ src, alt = '', ratio = '4/3', className, imgClassName, rounded = 'rounded-2xl', eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const show = src && !failed;

  return (
    <div className={cx('relative overflow-hidden', rounded, className)} style={{ aspectRatio: ratio }}>
      {show && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cx(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
        />
      )}
      {!loaded && <div className="absolute inset-0 skeleton" />}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-cream-100 text-ink-faint">
          <ImageOff size={22} />
          <span className="text-[11px] font-medium">{alt || 'Image unavailable'}</span>
        </div>
      )}
    </div>
  );
}