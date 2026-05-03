import React from 'react';

const StatCard = ({ title, value, icon, cardColorClass = 'bg-white dark:bg-slate-900', iconColorClass = 'text-primary bg-blue-50', trend, trendUp }) => {
  return (
    <div className={`${cardColorClass} p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden group`}>
      {/* Background Decorative Element */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 dark:bg-black/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColorClass.replace('bg-', 'dark:bg-opacity-20 bg-')} shadow-sm`}>
          <span className="material-symbols-outlined text-display">{icon}</span>
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm border ${trendUp
            ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
            : 'text-slate-500 bg-slate-100/50 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
            }`}>
            <span className="material-symbols-outlined text-[14px] font-bold">
              {trendUp ? 'trending_up' : 'horizontal_rule'}
            </span>
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-on-surface-variant text-label font-bold mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-[28px] font-bold text-on-surface leading-none">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
