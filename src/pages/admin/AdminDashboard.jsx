import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const AdminDashboard = () => {
 const { 
 students, teachers, classes, subjects, 
 attendance, events, announcements, systemLogs,
 grades 
 } = useData();
 const { currentUser } = useAppContext();
 const { t } = useSettings();

 const [attendanceRange, setAttendanceRange] = useState('weekly');

 const filteredAttendance = useMemo(() => {
 const sorted = [...attendance].filter(day => day.date).sort((a, b) => new Date(a.date) - new Date(b.date));
 if (attendanceRange === 'weekly') return sorted.slice(-7);
 if (attendanceRange === 'monthly') return sorted.slice(-30);
 return sorted;
 }, [attendance, attendanceRange]);

 const currentHour = new Date().getHours();
 let greetingKey = 'goodEvening';
 if (currentHour < 12) greetingKey = 'goodMorning';
 else if (currentHour < 17) greetingKey = 'goodAfternoon';

 // 1. Calculate Gender Distribution
 const maleCount = students.filter(s => s.gender === 'Male').length;
 const femaleCount = students.filter(s => s.gender === 'Female').length;
 const totalStudents = students.length;
 const malePercentage = totalStudents > 0 ? (maleCount / totalStudents) * 100 : 0;

 // 2. Calculate Top Performing Students
 const topStudents = students.map(student => {
 const studentGrades = grades.filter(g => g.studentId === student.id && g.status === 'PUBLISHED');
 const avg = studentGrades.length > 0 
 ? studentGrades.reduce((acc, curr) => acc + (curr.grade === 'A' ? 95 : curr.grade === 'B+' ? 85 : 75), 0) / studentGrades.length
 : 0;
 return { ...student, average: avg };
 }).sort((a, b) => b.average - a.average).slice(0, 5);

 // 3. Dynamic Calendar
 const today = new Date();
 const currentMonth = today.getMonth();
 const currentYear = today.getFullYear();
 const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
 const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
 const monthName = today.toLocaleString('default', { month: 'long' });

 return (
 <PageLayout role="admin" title={t('dashboard')}>
 {/* Page Header */}
 <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-heading text-slate-900 dark:text-white">{t('dashboard')}</h2>
 <p className="text-label text-slate-500/80 mt-1">{t('dashboardSubtitle')}</p>
 </div>

 {/* Welcome Section */}
 <div className="mb-8 p-6 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary/20">
 <h1 className="text-display mb-1">{t(greetingKey)}, {currentUser?.name || 'Admin'}!</h1>
 <p className="text-white/80 text-label">Here is what is happening in your school today.</p>
 </div>

 {/* 1. KPI CARDS (TOP SECTION) */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <StatCard title={t('totalStudents')} value={students.length} icon="person" trend="+12%" trendUp={true} iconColorClass="bg-blue-50 text-primary" />
 <StatCard title={t('totalTeachers')} value={teachers.length} icon="badge" trend="Stable" trendUp={false} iconColorClass="bg-indigo-50 text-indigo-600" />
 <StatCard title={t('totalClasses')} value={classes.length} icon="class" iconColorClass="bg-rose-50 text-rose-600" />
 <StatCard title={t('totalSubjects')} value={subjects.length} icon="auto_stories" iconColorClass="bg-amber-50 text-amber-600" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* LEFT COLUMN: Reports & Activity */}
 <div className="lg:col-span-8 flex flex-col gap-8">
 {/* 2. ATTENDANCE REPORT */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4 md:p-8 shadow-sm transition-colors relative overflow-hidden">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
 <div>
 <h2 className="text-section text-slate-900 dark:text-slate-100">Attendance Report</h2>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80 mt-1">Daily presence vs absence tracking</p>
 </div>
 
 <div className="flex items-center gap-4">
 <div className="relative">
 <select 
 value={attendanceRange} 
 onChange={(e) => setAttendanceRange(e.target.value)}
 className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-10 text-label text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
 >
 <option value="weekly">Weekly View</option>
 <option value="monthly">Monthly View</option>
 <option value="year">Yearly View</option>
 </select>
 <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400/80 pointer-events-none text-section">
 expand_more
 </span>
 </div>
 </div>
 </div>
 
 <div className="relative h-64 w-full">
 <div className="h-full flex items-end justify-between gap-1 px-2 relative z-10">
 {filteredAttendance.map((day, i) => (
 <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
 <div className={`flex items-end justify-center gap-1 h-[85%] border-b border-slate-100 dark:border-slate-800 ${attendanceRange === 'weekly' ? 'w-16' : 'w-full px-0.5'}`}>
 <div 
 className="bg-gradient-to-t from-emerald-400 to-emerald-500 w-full rounded-t-md shadow-sm transition-all animate-bar-grow" 
 style={{ height: `${day.present || 0}%`, animationDelay: `${i * 50}ms` }}
 title={`Present: ${day.present}%`}
 ></div>
 <div 
 className="bg-gradient-to-t from-rose-400 to-rose-500 w-full rounded-t-md shadow-sm opacity-90 transition-all animate-bar-grow" 
 style={{ height: `${day.absent === 0 ? 1 : day.absent}%`, animationDelay: `${i * 50 + 100}ms` }}
 title={`Absent: ${day.absent}%`}
 ></div>
 </div>
 {attendanceRange === 'weekly' && (
 <span className="text-label text-slate-400/80">{day.date?.split('-').slice(1).join('/')}</span>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* TOP PERFORMERS */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('topPerformers')}</h2>
 <div className="overflow-x-auto">
 {topStudents.length === 0 ? (
 <EmptyState icon="emoji_events" message="No Performers Found" description="Not enough graded data yet." />
 ) : (
 <table className="w-full text-left text-label">
 <thead>
 <tr className="text-slate-400/80 border-b border-slate-100 dark:border-slate-800">
 <th className="pb-3">Rank</th>
 <th className="pb-3">Student</th>
 <th className="pb-3">Class</th>
 <th className="pb-3 text-right">Avg Score</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
 {topStudents.map((s, i) => (
 <tr key={s.id} className="group">
 <td className="py-3 text-primary"># {i + 1}</td>
 <td className="py-3 text-slate-800 dark:text-slate-200">{s.name}</td>
 <td className="py-3 text-slate-500/80">{classes.find(c => c.id === s.classId)?.name}</td>
 <td className="py-3 text-right">
 <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-label">
 {s.average.toFixed(1)}%
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </section>

 {/* RECENT ACTIVITY */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('recentActivity')}</h2>
 <div className="space-y-4">
 {(!systemLogs || systemLogs.length === 0) ? (
 <EmptyState icon="history" message="No Activity" description="No recent system activities found." />
 ) : (
 systemLogs.map((log) => (
 <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
 <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-section">history</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-label text-slate-800 dark:text-slate-200">{log.message}</p>
 <p className="text-label text-slate-400/80 mt-0.5">{new Date(log.date).toLocaleString()}</p>
 </div>
 </div>
 ))
 )}
 </div>
 </section>
 </div>

 {/* RIGHT COLUMN: Calendar & Info */}
 <div className="lg:col-span-4 flex flex-col gap-8">
 {/* CALENDAR */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-section text-slate-900 dark:text-slate-100">Calendar</h2>
 <span className="text-label bg-blue-50 dark:bg-blue-900/30 text-primary px-2 py-1 rounded">{monthName} {currentYear}</span>
 </div>
 <div className="grid grid-cols-7 gap-1 text-center mb-2">
 {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-label text-slate-400/80">{d}</span>)}
 </div>
 <div className="grid grid-cols-7 gap-1">
 {Array.from({ length: firstDayOfMonth }).map((_, i) => (
 <div key={`empty-${i}`} className="h-8"></div>
 ))}
 {Array.from({length: daysInMonth}).map((_, i) => {
 const day = i + 1;
 const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
 const hasEvent = events.some(e => e.date === dateStr);
 const isToday = day === today.getDate();
 
 return (
 <div key={i} className={`h-8 flex items-center justify-center rounded-lg text-label  cursor-pointer transition-all
 ${isToday ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400/80'}
 ${hasEvent && !isToday ? 'ring-2 ring-primary/20 ring-offset-1 dark:ring-offset-slate-900' : ''}
 `}>
 {day}
 </div>
 );
 })}
 </div>
 </section>

 {/* GENDER DISTRIBUTION */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('studentGenders')}</h2>
 <div className="flex flex-col items-center gap-6">
 <div className="relative w-32 h-32">
 <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
 <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-slate-800" />
 <circle cx="18" cy="18" r="16" fill="transparent" stroke="#3b82f6" strokeWidth="4" 
 strokeDasharray={`${malePercentage} 100`} 
 strokeLinecap="round"
 className="transition-all duration-1000"
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-section text-slate-900 dark:text-slate-100">{maleCount + femaleCount}</span>
 <span className="text-label text-slate-400/80">Total</span>
 </div>
 </div>
 <div className="w-full space-y-2">
 <div className="flex justify-between items-center text-label">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-primary"></span>
 <span className="text-slate-500/80">Male Students</span>
 </div>
 <span className="text-slate-900 dark:text-slate-100">{maleCount}</span>
 </div>
 <div className="flex justify-between items-center text-label">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
 <span className="text-slate-500/80">Female Students</span>
 </div>
 <span className="text-slate-900 dark:text-slate-100">{femaleCount}</span>
 </div>
 </div>
 </div>
 </section>

 {/* UPCOMING EVENTS */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('upcomingEvents')}</h2>
 <div className="space-y-4">
 {(!events || events.length === 0) ? (
 <EmptyState icon="event_busy" message="No Events" description="There are no upcoming events." />
 ) : (
 events.slice().sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)).slice(0, 3).map((event) => (
 <div key={event.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
 <div className="flex justify-between items-start mb-1">
 <h4 className="text-label text-slate-900 dark:text-slate-100">{event.title}</h4>
 </div>
 <p className="text-primary text-label mt-1">{event.date}</p>
 </div>
 ))
 )}
 </div>
 </section>

 {/* ANNOUNCEMENTS */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('announcements')}</h2>
 <div className="space-y-4">
 {(!announcements || announcements.length === 0) ? (
 <EmptyState icon="campaign" message="No Announcements" description="No active announcements at this time." />
 ) : (
 announcements.slice().reverse().slice(0, 3).map((ann) => (
 <div key={ann.id} className={`relative pl-4 border-l-2 ${ann.priority === 'urgent' ? 'border-rose-500' : 'border-primary/30'}`}>
 <h4 className="text-label text-slate-800 dark:text-slate-200">{ann.title}</h4>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80 mt-1 line-clamp-2">{ann.content || ann.message || ''}</p>
 </div>
 ))
 )}
 </div>
 </section>
 </div>
 </div>
 </PageLayout>
 );
};

export default AdminDashboard;
