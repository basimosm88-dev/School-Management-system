import React, { useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const StudentExamsPage = () => {
 const { exams, getReportCardData } = useData();
 const { currentUser } = useAppContext();

 const data = useMemo(() => getReportCardData(currentUser?.id), [currentUser?.id, getReportCardData, exams]);

 const examTypes = ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

 return (
 <PageLayout role="student" title="Academic Results">
 <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* SUMMARY HEADER */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="md:col-span-2 bg-primary p-10 rounded-2xl shadow-xl shadow-primary/20 flex flex-col justify-between relative overflow-hidden">
 <div className="relative z-10">
 <p className="text-white/60 text-label mb-2">Annual Academic Standing</p>
 <h3 className="text-white text-display">{data.promotion}</h3>
 </div>
 <div className="mt-8 flex items-center gap-6 relative z-10">
 <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
 <p className="text-white/40 text-label mb-1">Class Rank</p>
 <p className="text-white text-section">#{data.rank}</p>
 </div>
 <button 
 onClick={() => window.open(`/print-report/${currentUser?.id}`, '_blank')}
 className="px-8 py-3 bg-white text-primary text-label rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-section">print</span>
 Download Report
 </button>
 </div>
 <span className="material-symbols-outlined text-white/5 text-display absolute -right-10 -bottom-10 rotate-12">workspace_premium</span>
 </div>

 <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 dark:border-emerald-800/50">
 <span className="material-symbols-outlined text-display">trending_up</span>
 </div>
 <p className="text-slate-400/80 text-label mb-1">Total Average</p>
 <h4 className="text-slate-900 dark:text-white text-display">
 {(Object.values(data.results).reduce((acc, curr) => acc + parseFloat(curr.average), 0) / Object.keys(data.results).length || 0).toFixed(1)}%
 </h4>
 </div>

 <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 mb-4 border border-amber-100 dark:border-amber-800/50">
 <span className="material-symbols-outlined text-display">menu_book</span>
 </div>
 <p className="text-slate-400/80 text-label mb-1">Total Subjects</p>
 <h4 className="text-slate-900 dark:text-white text-display">{Object.keys(data.results).length}</h4>
 </div>
 </div>

 {/* RESULTS GRID */}
 <div className="grid grid-cols-1 gap-6">
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
 <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
 <h3 className="text-label text-slate-800 dark:text-slate-200">Academic Breakdown</h3>
 <div className="flex gap-4">
 {examTypes.map(type => (
 <div key={type} className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-primary/30"></div>
 <span className="text-label text-slate-400/80">{type}</span>
 </div>
 ))}
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label">
 <thead className="bg-white dark:bg-slate-900 text-slate-400/80 text-label border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-8 py-6">Subject</th>
 {examTypes.map(t => (
 <th key={t} className="px-4 py-6 text-center">{t}</th>
 ))}
 <th className="px-8 py-6 text-right">Subject Avg.</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {Object.keys(data.results).length === 0 ? (
 <tr>
 <td colSpan="6" className="px-8 py-20 text-center text-slate-400/80">
 <span className="material-symbols-outlined text-display mb-4 opacity-20">hourglass_empty</span>
 <p className="text-label">No published results available yet</p>
 </td>
 </tr>
 ) : (
 Object.keys(data.results).map(subject => (
 <tr key={subject} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-6">
 <span className="text-slate-800 dark:text-slate-200 text-label">{subject}</span>
 </td>
 {examTypes.map(t => (
 <td key={t} className="px-4 py-6 text-center">
 <span className={` text-label ${data.results[subject][t] === '-' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400/80'}`}>
 {data.results[subject][t]}
 </span>
 </td>
 ))}
 <td className="px-8 py-6 text-right">
 <span className={`px-4 py-2 rounded-lg text-label  shadow-sm ${
 parseFloat(data.results[subject].average) >= 50 
 ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
 : 'bg-rose-500 text-white shadow-rose-500/20'
 }`}>
 {data.results[subject].average}%
 </span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* PRINT NOTICE */}
 <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-6">
 <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-amber-600">
 <span className="material-symbols-outlined">info</span>
 </div>
 <div>
 <h5 className="text-amber-900 dark:text-amber-100 text-label mb-1">Official Academic Notice</h5>
 <p className="text-label text-amber-800/70 dark:text-amber-200/70 leading-relaxed max-w-2xl">
 Printed report cards from the student portal are for informational purposes only and do not contain official school signatures or seals. 
 For official transcripts, please visit the Academic Records office.
 </p>
 </div>
 </div>
 </div>
 </PageLayout>
 );
};

export default StudentExamsPage;
