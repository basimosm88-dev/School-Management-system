import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const LoadingState = ({ message }) => {
 const { t } = useSettings();

 return (
 <div className="flex flex-col items-center justify-center py-12 px-4 text-center w-full h-full min-h-[200px]">
 <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-primary dark:border-t-primary rounded-full animate-spin mb-4"></div>
 <p className="text-body-sm text-slate-500/80 dark:text-slate-400/80 animate-pulse">{message || t('loading')}</p>
 </div>
 );
};

export default LoadingState;
