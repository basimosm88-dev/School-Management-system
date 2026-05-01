import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const EmptyState = ({ icon = 'inbox', message, description }) => {
 const { t } = useSettings();
 
 return (
 <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
 <span className="material-symbols-outlined text-display text-slate-400/80 dark:text-slate-500/80">{icon}</span>
 </div>
 <h3 className="text-section text-slate-800 dark:text-slate-200 mb-1">{message || t('noData')}</h3>
 {description && <p className="text-label text-slate-500/80 dark:text-slate-400/80 max-w-sm mx-auto">{description}</p>}
 </div>
 );
};

export default EmptyState;
