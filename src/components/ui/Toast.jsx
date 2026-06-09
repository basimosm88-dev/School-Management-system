import React, { useEffect } from 'react';

const toastConfig = {
  success: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    icon: 'check_circle',
    shadow: 'shadow-emerald-100/50 dark:shadow-none'
  },
  error: {
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/40',
    text: 'text-rose-800 dark:text-rose-300',
    bar: 'bg-rose-500',
    icon: 'error',
    shadow: 'shadow-rose-100/50 dark:shadow-none'
  },
  warning: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/40',
    text: 'text-amber-800 dark:text-amber-300',
    bar: 'bg-amber-500',
    icon: 'warning',
    shadow: 'shadow-amber-100/50 dark:shadow-none'
  },
  info: {
    bg: 'bg-blue-50/90 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/40',
    text: 'text-blue-800 dark:text-blue-300',
    bar: 'bg-blue-500',
    icon: 'info',
    shadow: 'shadow-blue-100/50 dark:shadow-none'
  }
};

export const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  const config = toastConfig[type] || toastConfig.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`relative flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg ${config.bg} ${config.border} ${config.text} ${config.shadow} animate-toast-in overflow-hidden w-80 md:w-96 max-w-full`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl flex-shrink-0 select-none">
          {config.icon}
        </span>
        <p className="text-sm font-semibold leading-snug break-words">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
      >
        <span className="material-symbols-outlined text-lg select-none">close</span>
      </button>

      {/* Visual Progress Bar Countdown */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div
          className={`h-full animate-toast-progress ${config.bar}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};
