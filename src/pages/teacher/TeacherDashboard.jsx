import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const TeacherDashboard = () => {
  const { currentUser } = useAppContext();
  const { t } = useSettings();
  const { classes, students, exams, events, announcements, timetables, attendance } = useData();

  const currentHour = new Date().getHours();
  let greetingKey = 'goodEvening';
  if (currentHour < 12) greetingKey = 'goodMorning';
  else if (currentHour < 17) greetingKey = 'goodAfternoon';

  // --- DATA CALCULATIONS ---
  
  // Assigned Classes
  const myClasses = useMemo(() => 
    classes.filter(c => (currentUser?.assignedClasses || []).includes(c.id) || c.teacherId === currentUser?.id),
    [classes, currentUser]
  );

  // My Students
  const myStudents = useMemo(() => 
    students.filter(s => (currentUser?.assignedClasses || []).includes(s.classId)),
    [students, currentUser]
  );

  // Attendance % (Teacher's classes)
  const myAttendanceRate = useMemo(() => {
    const myClassIds = myClasses.map(c => c.id);
    const relevantRecords = attendance.filter(a => myClassIds.includes(a.classId));
    if (relevantRecords.length === 0) return "100%";
    const present = relevantRecords.filter(r => r.status === 'Present').length;
    return `${Math.round((present / relevantRecords.length) * 100)}%`;
  }, [attendance, myClasses]);

  // Subjects Count
  const mySubjectsCount = useMemo(() => {
    const subjects = new Set();
    myClasses.forEach(c => {
      (c.subjects || []).forEach(s => {
        if (s.teacherId === currentUser?.id) subjects.add(s.name);
      });
    });
    return subjects.size;
  }, [myClasses, currentUser]);

  // Upcoming Classes Today
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todayClasses = useMemo(() => 
    timetables.filter(t => t.teacherId === currentUser?.id && t.day === todayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [timetables, currentUser, todayName]
  );

  // Upcoming Exams
  const upcomingExams = useMemo(() => {
    const now = new Date();
    return exams.filter(e => e.teacherId === currentUser?.id && e.date && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [exams, currentUser]);

  // --- CALENDAR LOGIC (Same as Admin) ---
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <PageLayout role="teacher" title={t('dashboard')}>
      {/* Page Header (Synced with Admin) */}
      <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-heading text-slate-900 dark:text-white">{t('dashboard')}</h2>
        <p className="text-label text-slate-500/80 mt-1">{t('dashboardSubtitle')}</p>
      </div>

      {/* Welcome Section (Synced with Admin) */}
      <div className="mb-8 p-6 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary/20">
        <h1 className="text-display mb-1 text-on-primary">{t(greetingKey)}, {currentUser?.name || 'Teacher'}!</h1>
        <p className="text-on-primary/80 text-label font-bold uppercase tracking-wider">Here is your professional summary and schedule for today.</p>
      </div>

      {/* KPI Cards (Synced with Admin Colors/Icons) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="My Classes" 
          value={myClasses.length} 
          icon="class" 
          cardColorClass="bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/50"
          iconColorClass="text-sky-600 bg-sky-100 dark:bg-sky-900/30" 
        />
        <StatCard 
          title="My Students" 
          value={myStudents.length} 
          icon="person" 
          cardColorClass="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50"
          iconColorClass="text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" 
        />
        <StatCard 
          title="Attendance Rate" 
          value={myAttendanceRate} 
          icon="event_available" 
          cardColorClass="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50"
          iconColorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" 
        />
        <StatCard 
          title="Subjects Count" 
          value={mySubjectsCount} 
          icon="auto_stories" 
          cardColorClass="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/50"
          iconColorClass="text-amber-600 bg-amber-100 dark:bg-amber-900/30" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Today's Schedule */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">Today's Schedule</h2>
            
            {todayClasses.length === 0 ? (
              <EmptyState icon="event_busy" message="No Classes Today" description="You have no sessions scheduled for this day." />
            ) : (
              <div className="space-y-4">
                {todayClasses.map((session, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black leading-none">{session.startTime.split(':')[0]}</span>
                      <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Hrs</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-label font-bold text-slate-900 dark:text-white">{session.subjectName}</h4>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                          {classes.find(c => c.id === session.classId)?.name}
                        </span>
                      </div>
                      <p className="text-label text-on-surface-variant mt-1">
                        Session: {session.startTime} - {session.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Notices */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">Recent Notices</h2>
            <div className="space-y-4">
              {announcements.filter(a => a.audience === 'all' || a.audience === 'teachers').length === 0 ? (
                <EmptyState icon="campaign" message="No Announcements" description="No active announcements at this time." />
              ) : (
                announcements.filter(a => a.audience === 'all' || a.audience === 'teachers').slice(0, 3).map((ann, idx) => (
                  <div key={idx} className={`relative pl-4 border-l-2 ${ann.priority === 'urgent' ? 'border-rose-500' : 'border-primary/30'}`}>
                    <h4 className="text-label text-slate-900 dark:text-white font-bold">{ann.title}</h4>
                    <p className="text-label text-slate-500/80 mt-1 line-clamp-2">{ann.content || ann.message || ''}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Exams */}
          {upcomingExams.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-label font-bold text-slate-400 uppercase tracking-widest mb-6">Upcoming Assessment Sessions</h2>
              <div className="space-y-3">
                {upcomingExams.slice(0, 3).map((exam, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="text-label font-bold text-slate-900 dark:text-white">{exam.subjectName} - {exam.examType}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                          Class: {classes.find(c => c.id === exam.classId)?.name} | {exam.date}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      In {Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24))} Days
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column (Calendar & Notices) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* CALENDAR (Synced with Admin) */}
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
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between text-label">
                <span className="text-on-surface-variant">Academic Events</span>
                <button className="text-primary font-bold hover:underline">View All</button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </PageLayout>
  );
};

export default TeacherDashboard;
