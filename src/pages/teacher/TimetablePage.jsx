import React, { useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const TeacherTimetablePage = () => {
 const { timetables, classes } = useData();
 const { currentUser } = useAppContext();
 const [activePeriod, setActivePeriod] = React.useState('morning');

 const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

 // Filter sessions for this teacher
 const teacherSchedule = useMemo(() => {
 return timetables.filter(t => t.teacherId === currentUser?.id)
 .sort((a, b) => a.startTime.localeCompare(b.startTime));
 }, [timetables, currentUser]);

 const morningHours = [7, 8, 9, 10, 11, 12];
 const afternoonHours = [13, 14, 15, 16, 17];

 const renderGridBlock = (title, hoursRange) => (
 <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
 <div className="flex items-center gap-4 mb-4">
 <h3 className="text-label text-slate-800 dark:text-slate-200">{title}</h3>
 <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
 </div>
 
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden overflow-x-auto transition-colors">
 <div className="min-w-[900px]">
 <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20">
 <div className="p-4"></div>
 {days.map(day => (
 <div key={day} className="p-4 text-center text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800 text-label">
 {day}
 </div>
 ))}
 </div>
 
 {hoursRange.map(hour => {
 const ampm = hour >= 12 ? 'PM' : 'AM';
 const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
 const timeLabel = `${displayHour}:00 ${ampm}`;
 
 return (
 <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 dark:border-slate-800 min-h-[130px]">
 <div className="p-4 text-label text-slate-400/80 text-center pt-8">
 {timeLabel}
 </div>
 
 {days.map(day => {
 const sessions = teacherSchedule.filter(t => {
 const [h] = t.startTime.split(':');
 return parseInt(h) === hour && t.day === day;
 });
 
 return (
 <div key={`${day}-${hour}`} className="border-l border-slate-100 dark:border-slate-800 p-2 relative flex flex-col gap-2">
 {sessions.map(slot => {
 const colors = [
 'bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100 border-sky-100 dark:border-sky-800/50',
 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 border-amber-100 dark:border-amber-800/50',
 'bg-purple-50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100 border-purple-100 dark:border-purple-800/50',
 'bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:text-fuchsia-100 border-fuchsia-100 dark:border-fuchsia-800/50',
 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border-emerald-100 dark:border-emerald-800/50'
 ];
 let hash = 0;
 const str = slot.subjectName || 'Break';
 for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
 const colorClass = slot.isBreak 
 ? 'bg-slate-100 text-slate-500/80 dark:bg-slate-800/50 dark:text-slate-400/80 border-slate-100 dark:border-slate-700/50' 
 : colors[Math.abs(hash) % colors.length];
 
 const formatSlotTime = (time24) => {
 const [h, m] = time24.split(':');
 const hNum = parseInt(h);
 const suffix = hNum >= 12 ? 'PM' : 'AM';
 const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
 return `${h12}:${m} ${suffix}`;
 };
 
 const classObj = classes.find(c => String(c.id) === String(slot.classId));
 const classNameDisplay = classObj?.name.split('-')[1]?.trim() || classObj?.name || 'Class';
 
 return (
 <div key={slot.id} className={`w-full rounded-xl p-4 relative group transition-all border shadow-sm ${colorClass}`}>
 <div className="text-label opacity-40 mb-2">
 {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
 </div>
 
 <div className="text-label leading-relaxed">
 {classNameDisplay} - {slot.subjectName}
 </div>
 </div>
 );
 })}
 </div>
 );
 })}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );

 return (
 <PageLayout role="teacher" title="My Teaching Schedule">
 <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* SUMMARY BAR */}
 <div className="bg-primary/5 p-8 rounded-xl border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6">
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
 <span className="material-symbols-outlined text-display">schedule</span>
 </div>
 <div>
 <h3 className="text-slate-900 dark:text-slate-100 text-section">Weekly Planner</h3>
 <p className="text-label text-slate-500/80 mt-1 opacity-60">Synchronized with Academic Administration</p>
 </div>
 </div>
 <div className="flex gap-4">
 <div className="px-8 py-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
 <p className="text-label text-slate-400/80 mb-1">Total Periods</p>
 <p className="text-display text-primary">{teacherSchedule.length}</p>
 </div>
 </div>
 </div>

 {/* PERIOD TOGGLE */}
 <div className="flex justify-center">
 <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-2 w-full max-w-md">
 <button
 onClick={() => setActivePeriod('morning')}
 className={`flex-1 py-3 rounded-lg text-label  transition-all flex items-center justify-center gap-2 ${
 activePeriod === 'morning' 
 ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
 : 'text-slate-400/80'
 }`}
 >
 <span className="material-symbols-outlined text-section">wb_sunny</span>
 Morning Period
 </button>
 <button
 onClick={() => setActivePeriod('afternoon')}
 className={`flex-1 py-3 rounded-lg text-label  transition-all flex items-center justify-center gap-2 ${
 activePeriod === 'afternoon' 
 ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
 : 'text-slate-400/80'
 }`}
 >
 <span className="material-symbols-outlined text-section">dark_mode</span>
 Afternoon Period
 </button>
 </div>
 </div>

 {/* WEEKLY GRID */}
 <div className="animate-in fade-in zoom-in-95 duration-500">
 {activePeriod === 'morning' ? (
 renderGridBlock("Morning Sessions (7:00 AM - 12:30 PM)", morningHours)
 ) : (
 renderGridBlock("Afternoon Sessions (1:00 PM - 5:30 PM)", afternoonHours)
 )}
 </div>
 </div>
 </PageLayout>
 );
};

export default TeacherTimetablePage;

