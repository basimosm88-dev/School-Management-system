import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const StudentDashboard = () => {
    const { classes, attendance, announcements, events, getReportCardData } = useData();
    const { currentUser } = useAppContext();
    const { t } = useSettings();
    const navigate = useNavigate();

    // 0. Safety Checks & Redirects
    if (!currentUser || currentUser.role !== 'student') {
        return <Navigate to="/login" replace />;
    }

    const sId = parseInt(currentUser.id);
    const cId = parseInt(currentUser.classId);

    // 1. Greet logic
    const currentHour = new Date().getHours();
    let greetingKey = 'goodEvening';
    if (currentHour < 12) greetingKey = 'goodMorning';
    else if (currentHour < 17) greetingKey = 'goodAfternoon';

    // 2. Data Fetching via specialized helper
    const reportData = getReportCardData(sId, cId);
    
    // 3. Performance Metrics
    const subjects = Object.keys(reportData.results);
    const totalPoints = subjects.reduce((acc, sub) => acc + (parseFloat(reportData.results[sub].average) || 0), 0);
    const overallAverage = subjects.length > 0 ? (totalPoints / subjects.length).toFixed(1) : "0.0";
    
    // 4. Attendance Stats
    const studentAttendanceRecords = attendance.filter(a => parseInt(a.studentId) === sId);
    const attendanceCount = studentAttendanceRecords.length;
    const presentCount = studentAttendanceRecords.filter(a => a.status === 'Present').length;
    const lateCount = studentAttendanceRecords.filter(a => a.status === 'Late').length;
    const attendanceRate = attendanceCount === 0 ? 0 : Math.round(((presentCount + lateCount) / attendanceCount) * 100);

    return (
        <PageLayout role="student" title={t('dashboard')}>
            {/* Premium Welcome Header - Standardized Rounding */}
            <div className="mb-8 p-10 bg-slate-900 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-50"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">Academic Session</span>
                        </div>
                        <h1 className="text-[32px] md:text-[40px] leading-tight font-black mb-2">{t(greetingKey)}, {currentUser.name}!</h1>
                        <p className="text-slate-400 text-label font-bold uppercase tracking-[0.2em]">Class: {classes.find(c => c.id === cId)?.name || 'N/A'}</p>
                    </div>
                    
                    {currentUser.isDefaultPassword && (
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl backdrop-blur-sm">
                            <span className="material-symbols-outlined text-rose-500">lock_reset</span>
                            <div className="text-[10px]">
                                <p className="font-bold text-rose-100">Security Alert</p>
                                <p className="text-rose-100/70">Update your password</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Attendance" value={`${attendanceRate}%`} icon="event_available" iconColorClass="bg-emerald-50 text-emerald-600" trend="Real-time" trendUp={true} />
                <StatCard title="Average" value={`${overallAverage}%`} icon="grade" iconColorClass="bg-blue-50 text-primary" />
                <StatCard title="Subjects" value={subjects.length} icon="auto_stories" iconColorClass="bg-indigo-50 text-indigo-600" />
                <StatCard title="Session" value="2026" icon="schedule" iconColorClass="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {/* Attendance Pulse - Standardized Rounding */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-section text-on-surface font-black tracking-tight">Attendance Tracking</h2>
                                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mt-0.5">Last 7 days activity</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-4">
                            {[...Array(7)].map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (6 - i));
                                const dateStr = date.toISOString().split('T')[0];
                                const dayRecord = studentAttendanceRecords.find(a => a.date === dateStr);

                                return (
                                    <div key={i} className="flex flex-col items-center gap-3">
                                        <div className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all duration-300
                                            ${!dayRecord ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' :
                                                dayRecord.status === 'Present' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                dayRecord.status === 'Late' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                'bg-rose-50 border-rose-200 text-rose-600'}
                                        `}>
                                            {dayRecord ? (
                                                <span className="material-symbols-outlined text-[24px]">
                                                    {dayRecord.status === 'Present' ? 'check_circle' : dayRecord.status === 'Late' ? 'schedule' : 'cancel'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-black">---</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-tighter">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div 
                            onClick={() => navigate('/student/results')}
                            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-display">bar_chart</span>
                            </div>
                            <h3 className="text-section font-black text-on-surface">Academic Results</h3>
                            <p className="text-label text-on-surface-variant mt-1">View your full marksheet and performance analytics.</p>
                        </div>
                        <div 
                            onClick={() => navigate('/student/timetable')}
                            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-display">calendar_view_day</span>
                            </div>
                            <h3 className="text-section font-black text-on-surface">Class Schedule</h3>
                            <p className="text-label text-on-surface-variant mt-1">Check your daily lesson plan and room assignments.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Announcements/Events */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="text-section font-black uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">campaign</span>
                            Notices
                        </h3>
                        
                        <div className="space-y-4">
                            {(!announcements || announcements.filter(a => a.audience === 'all' || a.audience === 'students' || a.audience === `class_${cId}`).length === 0) ? (
                                <EmptyState icon="campaign" message="All Caught Up" description="No new notices today." />
                            ) : (
                                announcements.filter(a => a.audience === 'all' || a.audience === 'students' || a.audience === `class_${cId}`).slice(0, 3).map(ann => (
                                    <div key={ann.id} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-label font-black text-on-surface mb-1">{ann.title}</h4>
                                        <p className="text-[10px] text-on-surface-variant line-clamp-2">{ann.content || ann.message}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <h3 className="text-section font-black uppercase tracking-widest text-on-surface-variant mb-6 mt-10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">event</span>
                            Events
                        </h3>
                        
                        <div className="space-y-4">
                            {(!events || events.filter(e => e.audience === 'all' || e.audience === 'students' || e.audience === `class_${cId}`).length === 0) ? (
                                <EmptyState icon="event_busy" message="Empty Calendar" description="No upcoming events." />
                            ) : (
                                events.filter(e => e.audience === 'all' || e.audience === 'students' || e.audience === `class_${cId}`).slice(0, 3).map(event => (
                                    <div key={event.id} className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/5 rounded-xl border border-primary/10">
                                            <span className="text-[8px] text-primary font-black uppercase">{event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : 'N/A'}</span>
                                            <span className="text-section text-primary font-black">{event.date ? new Date(event.date).getDate() : '-'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-label text-on-surface font-black truncate">{event.title}</h4>
                                            <p className="text-[10px] text-on-surface-variant truncate">{event.location || 'Campus'}</p>
                                        </div>
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

export default StudentDashboard;
