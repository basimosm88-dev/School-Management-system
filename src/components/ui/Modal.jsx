import React from 'react';

const Modal = ({ isOpen, onClose, title, children, onSave, saveText = 'Save Changes' }) => {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
 
 {/* Header */}
 <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
 <h3 className="text-slate-900 dark:text-slate-100 text-section-title">{title}</h3>
 <button 
 onClick={onClose} 
 className="p-2 text-slate-400/80 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
 >
 <span className="material-symbols-outlined text-kpi-value">close</span>
 </button>
 </div>

 {/* Content */}
 <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
 {children}
 </div>

 {/* Footer */}
 <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
 <button 
 onClick={onClose} 
 className="px-6 py-2.5 text-body-sm text-slate-500/80 hover:text-slate-700 dark:text-slate-400/80 dark:hover:text-slate-200 transition-all"
 >
 Cancel
 </button>
 <button 
 onClick={onSave} 
 className="px-8 py-2.5 text-body-sm text-white bg-primary hover:bg-blue-700 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95"
 >
 {saveText}
 </button>
 </div>
 </div>
 </div>
 );
};

export default Modal;
