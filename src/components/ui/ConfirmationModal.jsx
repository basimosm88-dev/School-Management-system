import React, { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const modalTranslations = {
  en: {
    deleteTitle: "Confirm Deletion",
    deleteButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmDeleteGeneric: "Are you sure you want to delete this item? This action cannot be undone."
  },
  ar: {
    deleteTitle: "تأكيد الحذف",
    deleteButtonText: "حذف",
    cancelButtonText: "إلغاء",
    confirmDeleteGeneric: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
  },
  so: {
    deleteTitle: "Hubi Tirtirista",
    deleteButtonText: "Tirtir",
    cancelButtonText: "Ka noqo",
    confirmDeleteGeneric: "Ma hubtaa inaad rabto inaad tirtirto shaygan? Tani dib looma soo celin karo."
  }
};

export const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { language = 'en', t } = useSettings();
  const translations = modalTranslations[language] || modalTranslations.en;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // If the message is a translation key, try to translate it, else use it as the message
  const translatedMessage = t(message) !== message ? t(message) : (translations[message] || message || translations.confirmDeleteGeneric);
  const modalTitle = title ? (t(title) !== title ? t(title) : title) : translations.deleteTitle;

  const isRtl = language === 'ar';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-modal-fade"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 transition-all animate-modal-zoom flex flex-col p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4 animate-pulse">
          <span className="material-symbols-outlined text-4xl select-none">warning</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {modalTitle}
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {translatedMessage}
        </p>

        {/* Buttons */}
        <div className={`flex flex-col-reverse sm:flex-row gap-3 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
          >
            {translations.cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all shadow-lg shadow-rose-600/20 active:scale-95 text-sm"
          >
            {translations.deleteButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
