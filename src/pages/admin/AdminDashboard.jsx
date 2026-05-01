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
 grades, calculateRankings
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

  // 2. Calculate Top Performing Students using the new exams data
  const topStudents = useMemo(() => {
    // Get all classes to calculate averages
    const allRankings = classes.flatMap(c => {
      const classRankings = calculateRankings(c.id);
      return classRankings.map(r => ({ ...r, className: c.name }));
    });
    
    return allRankings
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }, [classes, calculateRankings]);

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
 <h2 className="text-heading text-on-surface">{t('dashboard')}</h2>
 <p className="text-label text-on-surface-variant mt-1">{t('dashboardSubtitle')}</p>
 </div>

 {/* Welcome Section */}
 <div className="mb-8 p-6 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary/20">
 <h1 className="text-display mb-1 text-on-primary">{t(greetingKey)}, {currentUser?.name || 'Admin'}!</h1>
 <p className="text-on-primary/80 text-label font-bold uppercase tracking-wider">Here is what is happening in your school today.</p>
 </div>

 {/* 1. KPI CARDS (TOP SECTION) */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard 
      title={t('totalStudents')} 
      value={students.length} 
      icon="person" 
      trend="+12%" 
      trendUp={true} 
      cardColorClass="bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/50"
      iconColorClass="text-sky-600 bg-sky-100 dark:bg-sky-900/30" 
    />
    <StatCard 
      title={t('totalTeachers')} 
      value={teachers.length} 
      icon="badge" 
      trend="Stable" 
      trendUp={false} 
      cardColorClass="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50"
      iconColorClass="text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" 
    />
    <StatCard 
      title={t('totalClasses')} 
      value={classes.length} 
      icon="class" 
      cardColorClass="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50"
      iconColorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" 
    />
    <StatCard 
      title={t('totalSubjects')} 
      value={subjects.length} 
      icon="auto_stories" 
      cardColorClass="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/50"
      iconColorClass="text-amber-600 bg-amber-100 dark:bg-amber-900/30" 
    />
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
    <div className="relative group">
      <select 
        value={attendanceRange} 
        onChange={(e) => setAttendanceRange(e.target.value)}
        className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-10 text-label text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer shadow-sm group-hover:border-primary/30"
      >
        <option value="weekly">Weekly View</option>
        <option value="monthly">Monthly View</option>
        <option value="year">Yearly View</option>
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors pointer-events-none text-[20px]">
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
  <tr key={s.studentId} className="group">
  <td className="py-3 text-primary font-bold"># {i + 1}</td>
  <td className="py-3 text-on-surface font-bold">{s.name}</td>
  <td className="py-3 text-on-surface-variant font-bold">{s.className}</td>
  <td className="py-3 text-right">
  <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-label font-bold">
  {s.averageScore.toFixed(1)}%
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
 <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
 <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-section">history</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-label text-on-surface">{log.message}</p>
 <p className="text-label text-on-surface-variant mt-0.5">{new Date(log.date).toLocaleString()}</p>
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
  <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm transition-all h-[420px] flex flex-col">
    <div className="flex justify-between items-center mb-6 shrink-0">
      <h2 className="text-headline text-on-surface">Calendar</h2>
      <div className="bg-primary/5 dark:bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-label font-bold border border-primary/10">
        {monthName} {currentYear}
      </div>
    </div>
    
    <div className="grid grid-cols-7 gap-1 text-center mb-4 shrink-0">
      {['S','M','T','W','T','F','S'].map(d => (
        <span key={d} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{d}</span>
      ))}
    </div>
    
    <div className="grid grid-cols-7 gap-1 flex-1">
      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
        <div key={`empty-${i}`} className="flex items-center justify-center"></div>
      ))}
      {Array.from({length: daysInMonth}).map((_, i) => {
        const day = i + 1;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = day === today.getDate();
        
        return (
          <div 
            key={i} 
            className={`flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-all relative
              ${isToday 
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 z-10' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-on-surface-variant'
              }`}
          >
            {day}
            {hasEvent && (
              <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`}></span>
            )}
          </div>
        );
      })}
    </div>
    
    {/* Upcoming event hint if any today */}
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
      <div className="flex items-center justify-between text-label">
        <span className="text-on-surface-variant">Events</span>
        <button className="text-primary font-bold hover:underline">View All</button>
      </div>
    </div>
  </section>

 {/* GENDER DISTRIBUTION */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-on-surface mb-6">{t('studentGenders')}</h2>
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
 <span className="text-section text-on-surface">{maleCount + femaleCount}</span>
 <span className="text-label text-on-surface-variant">Total</span>
 </div>
 </div>
 <div className="w-full space-y-2">
 <div className="flex justify-between items-center text-label">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-primary"></span>
 <span className="text-on-surface-variant">Male Students</span>
 </div>
 <span className="text-on-surface">{maleCount}</span>
 </div>
 <div className="flex justify-between items-center text-label">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
 <span className="text-on-surface-variant">Female Students</span>
 </div>
 <span className="text-on-surface">{femaleCount}</span>
 </div>
 </div>
 </div>
 </section>

 {/* UPCOMING EVENTS */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-on-surface mb-6">{t('upcomingEvents')}</h2>
 <div className="space-y-4">
 {(!events || events.length === 0) ? (
 <EmptyState icon="event_busy" message="No Events" description="There are no upcoming events." />
 ) : (
 events.slice().sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)).slice(0, 3).map((event) => (
 <div key={event.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-100/50 dark:bg-slate-800/30">
 <div className="flex justify-between items-start mb-1">
 <h4 className="text-label text-on-surface">{event.title}</h4>
 </div>
 <p className="text-primary text-label mt-1">{event.date}</p>
 </div>
 ))
 )}
 </div>
 </section>

 {/* ANNOUNCEMENTS */}
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-on-surface mb-6">{t('announcements')}</h2>
 <div className="space-y-4">
 {(!announcements || announcements.length === 0) ? (
 <EmptyState icon="campaign" message="No Announcements" description="No active announcements at this time." />
 ) : (
 announcements.slice().reverse().slice(0, 3).map((ann) => (
 <div key={ann.id} className={`relative pl-4 border-l-2 ${ann.priority === 'urgent' ? 'border-rose-500' : 'border-primary/30'}`}>
 <h4 className="text-label text-on-surface">{ann.title}</h4>
 <p className="text-label text-on-surface-variant mt-1 line-clamp-2">{ann.content || ann.message || ''}</p>
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
