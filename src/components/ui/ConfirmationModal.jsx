import React, { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const modalTranslations = {
  en: {
    deleteTitle: "Confirm Deletion",
    deleteButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmDeleteGeneric: "Are you sure you want to delete this item? This action cannot be undone.",
    submitTitle: "Submit Exam Results",
    submitButtonText: "Submit",
    submitConfirmMessage: "Are you sure you want to submit these exam results for approval? You will not be able to edit them after submitting."
  },
  ar: {
    deleteTitle: "تأكيد الحذف",
    deleteButtonText: "حذف",
    cancelButtonText: "إلغاء",
    confirmDeleteGeneric: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
    submitTitle: "تقديم نتائج الاختبار",
    submitButtonText: "تقديم",
    submitConfirmMessage: "هل أنت متأكد من تقديم نتائج هذا الاختبار للموافقة؟ لن تتمكن من تعديلها بعد التقديم."
  },
  so: {
    deleteTitle: "Hubi Tirtirista",
    deleteButtonText: "Tirtir",
    cancelButtonText: "Ka noqo",
    confirmDeleteGeneric: "Ma hubtaa inaad rabto inaad tirtirto shaygan? Tani dib looma soo celin karo.",
    submitTitle: "Gudbi Natiijooyinka Imtixaanka",
    submitButtonText: "Gudbi",
    submitConfirmMessage: "Ma hubtaa inaad rabto inaad u gudbiso natiijooyinkan imtixaanka ansixinta? Ma awoodi doonto inaad wax ka bedesho ka dib marka aad gudbiso."
  }
};

export const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText,
  cancelText,
  type = 'danger' // 'danger' or 'primary'
}) => {
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

  // Resolve message/title/button translations
  const translatedMessage = t(message) !== message ? t(message) : (translations[message] || message || translations.confirmDeleteGeneric);
  const modalTitle = title ? (t(title) !== title ? t(title) : title) : (translations[title] || translations.deleteTitle);
  
  const finalConfirmText = confirmText 
    ? (t(confirmText) !== confirmText ? t(confirmText) : (translations[confirmText] || confirmText))
    : translations.deleteButtonText;
    
  const finalCancelText = cancelText
    ? (t(cancelText) !== cancelText ? t(cancelText) : (translations[cancelText] || cancelText))
    : translations.cancelButtonText;

  const isRtl = language === 'ar';
  const isDanger = type === 'danger';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-modal-fade"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 transition-all animate-modal-zoom flex flex-col p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {isDanger ? (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4 animate-pulse">
            <span className="material-symbols-outlined text-4xl select-none">warning</span>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400 mb-4 animate-pulse">
            <span className="material-symbols-outlined text-4xl select-none">info</span>
          </div>
        )}

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
            {finalCancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold transition-all shadow-lg active:scale-95 text-sm ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                : 'bg-primary hover:bg-blue-700 shadow-primary/20'
            }`}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
