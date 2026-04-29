import React from 'react';
import { Navigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const StudentDashboard = () => {
 const { grades, subjects, attendance, announcements, events } = useData();
 const { currentUser } = useAppContext();
 const { t } = useSettings();

 const currentHour = new Date().getHours();
 let greetingKey = 'goodEvening';
 if (currentHour < 12) greetingKey = 'goodMorning';
 else if (currentHour < 17) greetingKey = 'goodAfternoon';

 // Redirect if not logged in or not a student
 if (!currentUser || currentUser.role !== 'student') {
 return <Navigate to="/login" replace />;
 }

 // Filter data for the current student
 const studentGrades = grades.filter(g => g.studentId === currentUser.id && (g.status === 'APPROVED' || g.status === 'PUBLISHED'));
 const studentAttendance = attendance.find(a => a.studentId === currentUser.id) || { present: 95, absent: 5 }; // Fallback for demo
 
 // Calculate stats
 const averageGrade = studentGrades.length > 0 ? "A-" : "N/A"; // Logic can be more complex

 return (
 <PageLayout role="student" title={t('dashboard')}>
 {/* Welcome Section */}
 <div className="mb-8 p-6 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary/20">
 <h1 className="text-kpi-value mb-1">{t(greetingKey)}, {currentUser.name}!</h1>
 <p className="text-white/80 text-body-sm">Here is your academic progress for the current semester.</p>
 
 {currentUser.isDefaultPassword && (
 <div className="mt-4 p-3 bg-white/20 backdrop-blur-md rounded-xl flex items-center gap-3 border border-white/30 animate-pulse">
 <span className="material-symbols-outlined">security</span>
 <p className="text-body-sm">Security Alert: You are using a default password. Please change it in settings.</p>
 </div>
 )}
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-4 gap-6 mb-8">
 <StatCard title="My Attendance" value={`${studentAttendance.present}%`} icon="event_available" iconColorClass="bg-emerald-50 text-emerald-600" trend="Good" trendUp={true} />
 <StatCard title="GPA (Current)" value={averageGrade} icon="grade" iconColorClass="bg-blue-50 text-primary" />
 <StatCard title="Enrolled Subjects" value={subjects.length} icon="auto_stories" iconColorClass="bg-indigo-50 text-indigo-600" />
 <StatCard title="Exams Pending" value="2" icon="quiz" iconColorClass="bg-amber-50 text-amber-600" />
 </div>

 <div className="bento-grid">
 {/* Left Main Column */}
 <div className="col-span-8 flex flex-col gap-6">
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-section-title text-slate-900 dark:text-slate-100">My Released Grades</h2>
 <button 
 onClick={() => alert("Navigate to Timetable")}
 className="bg-primary text-white px-4 py-2 rounded-lg text-body-sm hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-section-title">calendar_today</span>
 My Timetable
 </button>
 </div>
 <div className="space-y-3">
 {(!studentGrades || studentGrades.length === 0) ? (
 <EmptyState icon="grading" message="No Grades Released" description="Your academic grades will appear here once released." />
 ) : (
 studentGrades.map((grade) => (
 <div key={grade.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary/20 dark:hover:border-primary/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors
 ${grade.grade.startsWith('A') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/30 text-primary'}
 `}>
 <span className="text-section-title">{grade.grade}</span>
 </div>
 <div>
 <h4 className="text-slate-900 dark:text-slate-100 text-body-sm">{grade.subject} - {grade.type}</h4>
 <p className="text-body-sm text-slate-500/80 dark:text-slate-400/80">Released on {grade.releaseDate ? new Date(grade.releaseDate).toLocaleDateString() : 'N/A'}</p>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </section>
 </div>

 {/* Right Sidebar Column */}
 <div className="col-span-4 flex flex-col gap-6">
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section-title text-slate-900 dark:text-slate-100 mb-6">School Notices</h2>
 <div className="space-y-4">
 {(!announcements || announcements.filter(a => a.audience === 'all' || a.audience === 'students' || a.audience === `class_${currentUser.classId}`).length === 0) ? (
 <EmptyState icon="campaign" message="No Notices" description="No school notices for you." />
 ) : (
 announcements.filter(a => a.audience === 'all' || a.audience === 'students' || a.audience === `class_${currentUser.classId}`).slice(0, 3).map(ann => (
 <div key={ann.id} className={`p-3 border-l-4 rounded-r-xl ${ann.priority === 'urgent' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-500' : 'bg-slate-50/50 dark:bg-slate-800/50 border-primary/20'}`}>
 <h4 className={`text-body-sm  ${ann.priority === 'urgent' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{ann.title}</h4>
 <p className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mt-1 line-clamp-2">{ann.content || ann.message || ''}</p>
 </div>
 ))
 )}
 
 <h3 className="text-body-sm text-slate-400/80 mt-6">Upcoming Events</h3>
 {(!events || events.filter(e => e.audience === 'all' || e.audience === 'students' || e.audience === `class_${currentUser.classId}`).length === 0) ? (
 <EmptyState icon="event_busy" message="No Events" description="No upcoming events." />
 ) : (
 events.filter(e => e.audience === 'all' || e.audience === 'students' || e.audience === `class_${currentUser.classId}`).slice(0, 2).map(event => (
 <div key={event.id} className="flex gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
 <div className="flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
 <span className="text-body-sm text-primary">{event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : 'N/A'}</span>
 <span className="text-section-title text-slate-900 dark:text-slate-100">{event.date ? new Date(event.date).getDate() : '-'}</span>
 </div>
 <div className="flex-1">
 <h4 className="text-body-sm text-slate-900 dark:text-white">{event.title}</h4>
 <p className="text-body-sm text-slate-500/80 dark:text-slate-400/80">{event.location || 'N/A'}</p>
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
