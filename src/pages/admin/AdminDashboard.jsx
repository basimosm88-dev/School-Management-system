import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabase';
import { useData } from '../../contexts/DataContext';

const AdminDashboard = () => {
  const { 
    students, teachers, classes, subjects, 
    attendance, events, announcements, systemLogs,
    grades 
  } = useData();

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

  return (
    <PageLayout role="admin" title="Admin Dashboard">
      {/* 1. KPI CARDS (TOP SECTION) */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={students.length} icon="person" trend="+12%" trendUp={true} iconColorClass="bg-blue-50 text-primary" />
        <StatCard title="Total Teachers" value={teachers.length} icon="badge" trend="Stable" trendUp={false} iconColorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Total Classes" value={classes.length} icon="class" iconColorClass="bg-rose-50 text-rose-600" />
        <StatCard title="Total Subjects" value={subjects.length} icon="auto_stories" iconColorClass="bg-amber-50 text-amber-600" />
      </div>

      <div className="bento-grid">
        {/* LEFT COLUMN (8 Units) */}
        <div className="col-span-8 flex flex-col gap-6">
          
          {/* 2. ATTENDANCE REPORT (LAST 7 DAYS) */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-8 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Report</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily presence vs absence across the last 7 days</p>
              </div>
              <div className="flex items-center gap-6 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/20"></span> 
                  <span className="text-slate-700 dark:text-slate-300">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-rose-400 to-rose-500 shadow-sm shadow-rose-500/20"></span> 
                  <span className="text-slate-700 dark:text-slate-300">Absent</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64 w-full">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 dark:opacity-20">
                <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                <div className="border-t border-slate-300 dark:border-slate-600 w-full"></div>
                <div className="border-t border-slate-300 dark:border-slate-600 w-full mt-auto"></div>
              </div>

              {/* Bars */}
              <div className="h-full flex items-end justify-between gap-4 px-6 relative z-10">
                {attendance.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                    <div className="w-12 flex items-end justify-center gap-1.5 h-[85%] border-b border-transparent">
                      <div className="bg-gradient-to-t from-emerald-400 to-emerald-500 w-full transition-all duration-700 ease-out shadow-sm rounded-t-md" style={{ height: `${day.present}%` }}></div>
                      <div className="bg-gradient-to-t from-rose-400 to-rose-500 w-full transition-all duration-700 ease-out shadow-sm rounded-t-md opacity-90" style={{ height: `${day.absent === 0 ? 1 : day.absent}%` }}></div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{day.date.split('-').slice(1).join('/')}</span>
                    
                    {/* Advanced Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-black text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 whitespace-nowrap z-20 shadow-xl border border-slate-800 pointer-events-none">
                      <p className="font-bold mb-1 border-b border-slate-700 pb-1">{day.date}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-400 font-medium">Present: {day.present}%</span>
                        <span className="text-rose-400 font-medium">Absent: {day.absent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>



          {/* 4. TOP PERFORMING STUDENTS */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Top Performers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Class</th>
                    <th className="pb-3 font-medium text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {topStudents.map((s, i) => (
                    <tr key={s.id} className="group">
                      <td className="py-3 font-bold text-primary"># {i + 1}</td>
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="py-3 text-slate-500">{classes.find(c => c.id === s.classId)?.name}</td>
                      <td className="py-3 text-right">
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                          {s.average.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. UPCOMING EVENTS */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Upcoming Events</h2>
            <div className="space-y-4">
              {events.slice().sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.title}</h4>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{event.audience}</span>
                  </div>
                  <p className="text-[10px] text-primary font-bold mt-1 uppercase">{new Date(event.date).toLocaleDateString()} @ {event.start_time}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{event.description}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (4 Units) */}
        <div className="col-span-4 flex flex-col gap-6">

          {/* 5. GENDER DISTRIBUTION */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Student Genders</h2>
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
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{maleCount + femaleCount}</span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-slate-500">Male Students</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{maleCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span className="text-slate-500">Female Students</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{femaleCount}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 6. REAL-TIME CALENDAR */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Calendar</h2>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">April 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 30}).map((_, i) => {
                const day = i + 1;
                const hasEvent = events.some(e => e.date.endsWith(`-04-${day < 10 ? '0' + day : day}`));
                return (
                  <div key={i} className={`h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-all
                    ${day === 25 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}
                    ${hasEvent ? 'ring-2 ring-primary/20 ring-offset-1 dark:ring-offset-slate-900' : ''}
                  `}>
                    {day}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. ANNOUNCEMENTS */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Announcements</h2>
            <div className="space-y-4">
              {announcements.slice().reverse().slice(0, 3).map((ann) => (
                <div key={ann.id} className={`relative pl-4 border-l-2 ${ann.priority === 'urgent' ? 'border-rose-500' : ann.priority === 'important' ? 'border-amber-500' : 'border-primary/30'}`}>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ann.content || ann.message}</p>
                  <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-tighter">{ann.date}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. RECENT ACTIVITY FEED (Moved here) */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {systemLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{log.message}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(log.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
