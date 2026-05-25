import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const AdminAttendancePage = () => {
 const { attendance, students, classes, teachers, getAttendanceStats } = useData();
 const { t } = useSettings();

 const [viewType, setViewType] = useState('session'); // 'session' or 'daily'

 // Filter State
 const [filters, setFilters] = useState({
 classId: '',
 studentId: '',
 startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
 endDate: new Date().toISOString().split('T')[0],
 status: ''
 });

 // Calculate Global Stats
 const stats = useMemo(() => getAttendanceStats(filters), [attendance, filters]);

 // Filtered Session Logs
 const filteredAttendance = useMemo(() => {
 return attendance.filter(a => {
 const matchesClass = !filters.classId || String(a.classId) === String(filters.classId);
 const matchesStudent = !filters.studentId || String(a.studentId) === String(filters.studentId);
 const matchesStatus = !filters.status || a.status === filters.status;
 const matchesDate = a.date >= filters.startDate && a.date <= filters.endDate;
 return matchesClass && matchesStudent && matchesStatus && matchesDate;
 }).sort((a, b) => new Date(b.date) - new Date(a.date) || b.startTime.localeCompare(a.startTime));
 }, [attendance, filters]);

 // Calculated Daily Summaries
 const dailySummaries = useMemo(() => {
 const groups = {};
 filteredAttendance.forEach(s => {
 const key = `${s.studentId}_${s.date}`;
 if (!groups[key]) groups[key] = [];
 groups[key].push(s.status);
 });

 return Object.keys(groups).map(key => {
 const [studentId, date] = key.split('_');
 const statuses = groups[key];
 let dailyStatus = 'Present';
 
 if (statuses.every(s => s === 'Present')) dailyStatus = 'Present';
 else if (statuses.every(s => s === 'Absent')) dailyStatus = 'Absent';
 else if (statuses.some(s => s === 'Late')) dailyStatus = 'Late';
 else if (statuses.some(s => s === 'Absent')) dailyStatus = 'Partial';

 return {
 id: key,
 studentId: studentId,
 date,
 status: dailyStatus,
 sessionCount: statuses.length
 };
 }).sort((a, b) => new Date(b.date) - new Date(a.date));
 }, [filteredAttendance]);

 // Student Performance Analytics
 const studentPerformance = useMemo(() => {
 const map = {};
 dailySummaries.forEach(a => {
 if (!map[a.studentId]) map[a.studentId] = { id: a.studentId, present: 0, total: 0 };
 map[a.studentId].total++;
 if (a.status === 'Present' || a.status === 'Late' || a.status === 'Partial') map[a.studentId].present++;
 });

 return Object.values(map)
 .map(s => ({
 ...s,
 name: students.find(std => std.id === s.id)?.name || 'Unknown',
 rate: Math.round((s.present / s.total) * 100)
 }))
 .sort((a, b) => b.rate - a.rate);
 }, [dailySummaries, students]);

 const formatTime = (t) => {
 if (!t) return 'N/A';
 const [h, m] = t.split(':');
 const hNum = parseInt(h);
 const suffix = hNum >= 12 ? 'PM' : 'AM';
 const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
 return `${h12}:${m} ${suffix}`;
 };

 return (
 <PageLayout role="admin" title={t('attendance')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-heading text-slate-900 dark:text-white">{t('attendance')}</h2>
 <p className="text-label text-slate-500/80 mt-1">{t('attendanceSubtitle')}</p>
 </div>

 {/* STATS OVERVIEW */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <StatCard label="Overall Rate" value={`${stats.rate}%`} icon="analytics" color="blue" />
 <StatCard label="Present" value={stats.present} icon="check_circle" color="emerald" />
 <StatCard label="Late Sessions" value={stats.late} icon="schedule" color="amber" />
 <StatCard label="Absent Sessions" value={stats.absent} icon="cancel" color="rose" />
 </div>

 {/* FILTERS & TOGGLE */}
 <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors space-y-8">
 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
 <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full md:w-auto">
 <button 
 onClick={() => setViewType('session')}
 className={`flex-1 md:w-48 py-3 rounded-lg text-label  transition-all ${viewType === 'session' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
 >Session Details</button>
 <button 
 onClick={() => setViewType('daily')}
 className={`flex-1 md:w-48 py-3 rounded-lg text-label  transition-all ${viewType === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
 >Daily Summaries</button>
 </div>
 
 <div className="flex gap-2 w-full md:w-auto">
 <button 
 onClick={() => setFilters({
 classId: '',
 studentId: '',
 startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
 endDate: new Date().toISOString().split('T')[0],
 status: ''
 })}
 className="btn-secondary"
 >Reset Filters</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">Class Filter</label>
 <select 
 value={filters.classId}
 onChange={e => setFilters({...filters, classId: e.target.value})}
 className="form-input-custom w-full"
 >
 <option value="">All Classes</option>
 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">Start Date</label>
 <input 
 type="date"
 value={filters.startDate}
 onChange={e => setFilters({...filters, startDate: e.target.value})}
 className="form-input-custom w-full"
 />
 </div>
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">End Date</label>
 <input 
 type="date"
 value={filters.endDate}
 onChange={e => setFilters({...filters, endDate: e.target.value})}
 className="form-input-custom w-full"
 />
 </div>
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">Session Status</label>
 <select 
 value={filters.status}
 onChange={e => setFilters({...filters, status: e.target.value})}
 className="form-input-custom w-full"
 >
 <option value="">Any Status</option>
 <option value="Present">Present</option>
 <option value="Absent">Absent</option>
 <option value="Late">Late</option>
 </select>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* MAIN DATA TABLE */}
 <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
 <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-100/30 dark:bg-slate-800/20">
 <h4 className="text-label text-slate-800 dark:text-slate-200">
 {viewType === 'session' ? 'Subject Session Logs' : 'Auto-Calculated Daily Summaries'}
 </h4>
 <span className="text-label text-primary bg-primary/10 px-3 py-1 rounded-full">
 {viewType === 'session' ? filteredAttendance.length : dailySummaries.length} Records
 </span>
 </div>
 <div className="overflow-x-auto max-h-[600px]">
 <table className="w-full text-left text-label">
 <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-label text-slate-400/80 border-b border-slate-100 dark:border-slate-800">
 {viewType === 'session' ? (
 <tr>
 <th className="px-8 py-4">Student</th>
 <th className="px-8 py-4">Subject & Time</th>
 <th className="px-8 py-4">Date</th>
 <th className="px-8 py-4">Status</th>
 <th className="px-8 py-4">Teacher</th>
 </tr>
 ) : (
 <tr>
 <th className="px-8 py-4">Student Name</th>
 <th className="px-8 py-4 text-center">Sessions</th>
 <th className="px-8 py-4">Date</th>
 <th className="px-8 py-4">Daily Summary</th>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {viewType === 'session' ? (
 filteredAttendance.map(a => (
 <tr key={a.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-5">
 <span className="text-slate-700 dark:text-slate-200 block truncate max-w-[150px]">
 {students.find(s => s.id === a.studentId)?.name || 'Unknown'}
 </span>
 </td>
 <td className="px-8 py-5">
 <div>
 <span className="text-label text-slate-800 dark:text-slate-100 block mb-1">{a.subjectName}</span>
 <span className="text-label text-slate-400/80">{formatTime(a.startTime)} - {formatTime(a.endTime)}</span>
 </div>
 </td>
 <td className="px-8 py-5 text-label font-mono text-slate-400/80">{a.date}</td>
 <td className="px-8 py-5">
 <span className={`px-3 py-1 rounded-lg text-label  ${
 a.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
 a.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
 'bg-amber-50 text-amber-600 border border-amber-100'
 }`}>
 {a.status}
 </span>
 </td>
 <td className="px-8 py-5 text-label text-slate-400/80 truncate max-w-[120px]">
 {teachers.find(t => t.id === a.teacherId)?.name || 'Admin'}
 </td>
 </tr>
 ))
 ) : (
 dailySummaries.map(s => (
 <tr key={s.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-5">
 <span className="text-slate-700 dark:text-slate-200">
 {students.find(std => std.id === s.studentId)?.name || 'Unknown'}
 </span>
 </td>
 <td className="px-8 py-5 text-center">
 <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-label text-slate-500/80">{s.sessionCount}</span>
 </td>
 <td className="px-8 py-5 text-label font-mono text-slate-400/80">{s.date}</td>
 <td className="px-8 py-5">
 <span className={`px-4 py-1 rounded-full text-label  border ${
 s.status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' :
 s.status === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' :
 s.status === 'Late' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20'
 }`}>
 {s.status}
 </span>
 </td>
 </tr>
 ))
 )}
 {(viewType === 'session' ? filteredAttendance : dailySummaries).length === 0 && (
 <tr>
 <td colSpan="5" className="px-8 py-24 text-center">
 <div className="flex flex-col items-center opacity-20">
 <span className="material-symbols-outlined text-display mb-4">search_off</span>
 <p className="text-label">No records matching filters</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* PERFORMANCE RANKING */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors">
 <div className="flex items-center gap-3 mb-8">
 <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
 <span className="material-symbols-outlined text-display">stars</span>
 </div>
 <div>
 <h4 className="text-label text-slate-800 dark:text-slate-200">Attendance Rankings</h4>
 <p className="text-label text-slate-400/80">Based on daily averages</p>
 </div>
 </div>
 
 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
 {studentPerformance.map((s, idx) => (
 <div key={s.id} className="group relative">
 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-700/50 hover:border-primary/30 transition-all">
 <div className="flex items-center gap-4">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-label  ${
 idx === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
 idx === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-300/20' :
 idx === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/20' :
 'bg-white dark:bg-slate-800 text-slate-400/80 border border-slate-100 dark:border-slate-700'
 }`}>
 {idx + 1}
 </div>
 <div>
 <span className="text-label text-slate-800 dark:text-slate-200 block leading-none mb-1 line-clamp-1">{s.name}</span>
 <div className="flex items-center gap-2">
 <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
 <div className={`h-full rounded-full ${s.rate > 90 ? 'bg-emerald-500' : s.rate < 75 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{width: `${s.rate}%`}}></div>
 </div>
 <span className="text-label text-slate-400/80">{s.rate}%</span>
 </div>
 </div>
 </div>
 <span className={`text-label  ${s.rate > 90 ? 'text-emerald-500' : s.rate < 75 ? 'text-rose-500' : 'text-amber-500'}`}>
 {s.rate > 90 ? 'EXCELLENT' : s.rate < 75 ? 'POOR' : 'GOOD'}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </PageLayout>
 );
};

const StatCard = ({ label, value, icon, color }) => {
 const colors = {
 blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
 emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
 amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
 rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
 };

 return (
 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors flex items-center gap-5">
 <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors[color]} shadow-sm`}>
 <span className="material-symbols-outlined text-display">{icon}</span>
 </div>
 <div>
 <p className="text-label text-slate-400/80 mb-1">{label}</p>
 <p className="text-display text-slate-900 dark:text-slate-100">{value}</p>
 </div>
 </div>
 );
};

export default AdminAttendancePage;
