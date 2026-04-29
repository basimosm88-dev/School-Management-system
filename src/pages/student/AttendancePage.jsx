import React, { useMemo, useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const StudentAttendancePage = () => {
 const { getStudentAttendanceSummary, classes } = useData();
 const { currentUser } = useAppContext();

 const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'session'

 const summary = useMemo(() => 
 getStudentAttendanceSummary(currentUser?.id), 
 [currentUser]
 );

 const formatTime = (t) => {
 if (!t) return 'N/A';
 const [h, m] = t.split(':');
 const hNum = parseInt(h);
 const suffix = hNum >= 12 ? 'PM' : 'AM';
 const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
 return `${h12}:${m} ${suffix}`;
 };

 return (
 <PageLayout role="student" title="My Attendance Tracker">
 <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* SUMMARY CARDS */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-all flex flex-col items-center text-center">
 <div className="relative w-24 h-24 mb-4">
 <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
 <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800" />
 <circle cx="18" cy="18" r="16" fill="transparent" stroke="#0ea5e9" strokeWidth="3"
 strokeDasharray={`${summary.rate} 100`}
 strokeLinecap="round"
 className="transition-all duration-1000"
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="text-section text-slate-900 dark:text-slate-100">{summary.rate}%</span>
 </div>
 </div>
 <p className="text-label text-slate-400/80">Attendance Rate</p>
 </div>

 <SummaryStat label="Present Marks" value={summary.present} color="emerald" icon="check_circle" />
 <SummaryStat label="Late Counts" value={summary.late} color="amber" icon="schedule" />
 <SummaryStat label="Absent Marks" value={summary.absent} color="rose" icon="cancel" />
 </div>

 {/* TABS & LISTS */}
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
 <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30 dark:bg-slate-800/10">
 <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl">
 <button 
 onClick={() => setActiveTab('daily')}
 className={`px-8 py-3 rounded-lg text-label  transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
 >Daily Summaries</button>
 <button 
 onClick={() => setActiveTab('session')}
 className={`px-8 py-3 rounded-lg text-label  transition-all ${activeTab === 'session' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
 >Session Breakdown</button>
 </div>
 <div className="flex items-center gap-3">
 <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
 <span className="text-label text-slate-400/80">Real-time Performance Data</span>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left text-label">
 <thead className="bg-white dark:bg-slate-900 text-label text-slate-400/80 border-b border-slate-100 dark:border-slate-800">
 {activeTab === 'daily' ? (
 <tr>
 <th className="px-10 py-6">Calendar Date</th>
 <th className="px-10 py-6 text-center">Status</th>
 <th className="px-10 py-6 text-right">Academic Standing</th>
 </tr>
 ) : (
 <tr>
 <th className="px-10 py-6">Subject</th>
 <th className="px-10 py-6">Session Time</th>
 <th className="px-10 py-6">Date</th>
 <th className="px-10 py-6 text-right">Attendance</th>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {activeTab === 'daily' ? (
 summary.dailySummary.map(day => (
 <tr key={day.date} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
 <td className="px-10 py-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
 <span className="text-label text-slate-400/80">{new Date(day.date).toLocaleString('default', { month: 'short' })}</span>
 <span className="text-body text-slate-900 dark:text-slate-100">{new Date(day.date).getDate()}</span>
 </div>
 <div>
 <span className="text-slate-800 dark:text-slate-200 block leading-tight">
 {new Date(day.date).toLocaleDateString('default', { weekday: 'long' })}
 </span>
 <span className="text-label text-slate-400/80">{day.date}</span>
 </div>
 </div>
 </td>
 <td className="px-10 py-6 text-center">
 <span className={`px-5 py-1.5 rounded-full text-label  border shadow-sm ${
 day.status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/10' :
 day.status === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/10' :
 day.status === 'Late' ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/10' :
 'bg-sky-500 text-white border-sky-500 shadow-sky-500/10'
 }`}>
 {day.status}
 </span>
 </td>
 <td className="px-10 py-6 text-right">
 <span className="text-label text-slate-400/80 italic">
 {day.status === 'Present' ? 'Full Day Attended' : 
 day.status === 'Partial' ? 'Mixed Participation' : 
 day.status === 'Late' ? 'Late Arrivals' : 'Not Present'}
 </span>
 </td>
 </tr>
 ))
 ) : (
 summary.sessionHistory.map(session => (
 <tr key={session.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
 <td className="px-10 py-6">
 <div>
 <span className="text-label text-slate-800 dark:text-slate-100 block mb-1">{session.subjectName}</span>
 <span className="text-label text-primary bg-primary/5 px-2 py-0.5 rounded">{classes.find(c => c.id === session.classId)?.name}</span>
 </div>
 </td>
 <td className="px-10 py-6">
 <span className="text-label font-mono text-slate-500/80">
 {formatTime(session.startTime)} - {formatTime(session.endTime)}
 </span>
 </td>
 <td className="px-10 py-6 text-label text-slate-400/80">{session.date}</td>
 <td className="px-10 py-6 text-right">
 <span className={`px-3 py-1 rounded-lg text-label  ${
 session.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
 session.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
 'bg-amber-50 text-amber-600 border border-amber-100'
 }`}>
 {session.status}
 </span>
 </td>
 </tr>
 ))
 )}
 {(activeTab === 'daily' ? summary.dailySummary : summary.sessionHistory).length === 0 && (
 <tr>
 <td colSpan="4" className="px-10 py-32 text-center text-slate-300">
 <div className="flex flex-col items-center opacity-20">
 <span className="material-symbols-outlined text-display mb-4">history_toggle_off</span>
 <p className="text-label">No records available for display</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </PageLayout>
 );
};

const SummaryStat = ({ label, value, color, icon }) => {
 const colors = {
 emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 shadow-emerald-500/5',
 amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 shadow-amber-500/5',
 rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 shadow-rose-500/5',
 };

 return (
 <div className={`p-8 rounded-xl border transition-all flex flex-col items-center text-center shadow-sm ${colors[color]}`}>
 <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center mb-4 border border-white/50 dark:border-white/5">
 <span className="material-symbols-outlined text-display">{icon}</span>
 </div>
 <p className="text-display mb-1 leading-none">{value}</p>
 <p className="text-label opacity-60">{label}</p>
 </div>
 );
};

export default StudentAttendancePage;
