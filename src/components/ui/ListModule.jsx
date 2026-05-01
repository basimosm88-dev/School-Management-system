import React from 'react';
import PageLayout from '../layout/PageLayout';

const ListModule = ({ role, title, primaryActionText, onPrimaryAction, children }) => {
 return (
 <PageLayout role={role} title={title}>
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-section text-slate-900 dark:text-slate-100">{title} Directory</h2>
 <div className="flex gap-2">
 <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400/80 rounded-lg text-label hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
 <span className="material-symbols-outlined text-section">filter_list</span>
 Filter
 </button>
 {primaryActionText && onPrimaryAction && (
 <button 
 onClick={onPrimaryAction}
 className="bg-primary text-white px-5 py-2.5 rounded-lg text-label hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-section">add</span>
 {primaryActionText}
 </button>
 )}
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label text-slate-600 dark:text-slate-400/80">
 <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500/80 dark:text-slate-400/80 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-4 py-3 rounded-tl-lg">ID</th>
 <th className="px-4 py-3">Name</th>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {children || (
 <tr>
 <td className="px-4 py-4" colSpan="4">
 <div className="flex flex-col items-center justify-center py-8 text-slate-400/80">
 <span className="material-symbols-outlined text-display mb-2 opacity-50">inbox</span>
 <p>No records found in this module yet.</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </PageLayout>
 );
};

export default ListModule;
