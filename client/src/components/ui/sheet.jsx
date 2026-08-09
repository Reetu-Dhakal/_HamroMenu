import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { scrollLock, cx } from '../../lib/format';

export function Sheet({ open, onClose, title, children, tall = false, padded = true }) {
  useEffect(() => {
    scrollLock(open);
    return () => scrollLock(false);
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className={cx(
              'absolute inset-x-0 bottom-0 mx-auto flex w-full flex-col rounded-t-3xl bg-paper shadow-sheet',
              tall ? 'h-[92dvh]' : 'max-h-[88dvh]'
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="mx-auto absolute left-1/2 -translate-x-1/2 top-2 h-1.5 w-10 rounded-full bg-cream-200" />
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100 text-ink-soft hover:bg-cream-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain', padded && 'px-5 pb-8')}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Sheet;