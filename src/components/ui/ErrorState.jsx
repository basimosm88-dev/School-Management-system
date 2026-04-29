import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const ErrorState = ({ title, message, onRetry }) => {
 const { t } = useSettings();

 return (
 <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
 <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-4">
 <span className="material-symbols-outlined text-3xl">error</span>
 </div>
 <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-1">{title || t('error')}</h3>
 {message && <p className="text-sm text-rose-600/80 dark:text-rose-300/80 max-w-sm mx-auto mb-6">{message}</p>}
 
 {onRetry && (
 <button 
 onClick={onRetry}
 className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
 >
 Try Again
 </button>
 )}
 </div>
 );
};

export default ErrorState;
