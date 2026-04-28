import React from 'react';

const StatCard = ({ title, value, icon, iconColorClass = 'text-primary bg-blue-50', trend, trendUp }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 dark:hover:border-primary/40 transition-all duration-300 h-full">
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColorClass.replace('bg-', 'dark:bg-opacity-20 bg-')}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${
            trendUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
          }`}>
            <span className="material-symbols-outlined text-[14px]">
              {trendUp ? 'trending_up' : 'horizontal_rule'}
            </span>
            {trend}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mb-1.5 uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
