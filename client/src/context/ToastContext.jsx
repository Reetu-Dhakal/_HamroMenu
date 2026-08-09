import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const push = useCallback(
    (message, type = 'success', duration = 3200) => {
      const id = ++counter;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: (message, type) => push(message, type),
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 safe-bottom">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-cream-50 shadow-sheet"
              >
                <Icon
                  size={20}
                  className={
                    t.type === 'success' ? 'text-leaf-light' : t.type === 'error' ? 'text-red-400' : 'text-saffron'
                  }
                />
                <p className="flex-1 text-[14px] font-medium leading-snug">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-cream-50/50 hover:text-cream-50" aria-label="Dismiss">
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export default ToastProvider;