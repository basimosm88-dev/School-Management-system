import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const gradeFields = [
 { name: 'subject', label: 'Subject', type: 'select', options: [
 { value: 'Mathematics', label: 'Mathematics' },
 { value: 'Physics', label: 'Physics' }
 ]},
 { name: 'type', label: 'Exam Type', type: 'select', options: [
 { value: 'Midterm', label: 'Midterm' },
 { value: 'Final Exam', label: 'Final Exam' },
 { value: 'Quiz', label: 'Quiz' }
 ]},
 { name: 'studentId', label: 'Student ID', placeholder: 'Enter Student ID (e.g., 1)' },
 { name: 'grade', label: 'Grade (e.g. A, B+, 85)', placeholder: 'A' }
];

const TeacherDashboard = () => {
 const { currentUser } = useAppContext();
 const { t } = useSettings();
 const { submitGrade, classes, students, grades, addNotification, events, announcements } = useData();
 const [modalOpen, setModalOpen] = useState(false);
 const [formData, setFormData] = useState({});

 const currentHour = new Date().getHours();
 let greetingKey = 'goodEvening';
 if (currentHour < 12) greetingKey = 'goodMorning';
 else if (currentHour < 17) greetingKey = 'goodAfternoon';

 // Data Isolation: Filter by assigned classes
 const assignedClassesIds = currentUser?.assignedClasses || [];
 const myClasses = classes.filter(c => assignedClassesIds.includes(c.id));
 const myStudents = students.filter(s => assignedClassesIds.includes(s.classId));
 const myGradesCount = grades.filter(g => g.teacherId === currentUser?.id).length;

 const handleSaveGrade = () => {
 if (formData.subject && formData.grade && formData.studentId) {
 submitGrade({
 ...formData,
 studentId: parseInt(formData.studentId, 10),
 teacherId: currentUser.id,
 status: 'SUBMITTED'
 });
 addNotification('Grade submitted successfully', 'success');
 setModalOpen(false);
 setFormData({});
 }
 };

 return (
 <PageLayout role="teacher" title={t('dashboard')}>
 {/* Welcome Section */}
 <div className="mb-8 p-6 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary/20">
 <h1 className="text-heading mb-1">{t(greetingKey)}, {currentUser?.name || 'Teacher'}!</h1>
 <p className="text-white/80 text-label">Here is your schedule and tasks for today.</p>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <StatCard title={t('myClasses')} value={myClasses.length} icon="class" iconColorClass="bg-blue-50 text-primary" />
 <StatCard title={t('myStudents')} value={myStudents.length} icon="person" iconColorClass="bg-indigo-50 text-indigo-600" />
 <StatCard title={t('grades')} value={myGradesCount} icon="grade" iconColorClass="bg-amber-50 text-amber-600" />
 <StatCard title={t('attendance')} value="98%" icon="event_available" iconColorClass="bg-emerald-50 text-emerald-600" trend="2%" trendUp={true} />
 </div>

 <div className="bento-grid">
 {/* Left Main Column */}
 <div className="col-span-8 flex flex-col gap-6">
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-section text-slate-900 dark:text-slate-100">{t('myTasks')}</h2>
 <button 
 onClick={() => setModalOpen(true)}
 className="bg-primary text-white px-4 py-2 rounded-lg text-label hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-section">add</span>
 Add Grades
 </button>
 </div>
 <div className="space-y-3">
 <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary/20 dark:hover:border-primary/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400/80 border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
 <span className="material-symbols-outlined">grade</span>
 </div>
 <div>
 <h4 className="text-slate-900 dark:text-slate-100 text-label">{t('enterGrades')}</h4>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80">Submit new grades for review</p>
 </div>
 </div>
 <button onClick={() => setModalOpen(true)} className="px-4 py-1.5 text-label text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 transition-all">{t('enterGrades')}</button>
 </div>
 <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary/20 dark:hover:border-primary/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400/80 border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
 <span className="material-symbols-outlined">how_to_reg</span>
 </div>
 <div>
 <h4 className="text-slate-900 dark:text-slate-100 text-label">{t('markAttendance')}</h4>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80">Grade 11 Physics</p>
 </div>
 </div>
 <button className="px-4 py-1.5 text-label text-slate-500/80 dark:text-slate-400/80 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Mark Now</button>
 </div>
 </div>
 </section>
 </div>

 {/* Right Sidebar Column */}
 <div className="col-span-4 flex flex-col gap-6">
 <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
 <h2 className="text-section text-slate-900 dark:text-slate-100 mb-6">{t('schoolNotices')}</h2>
 <div className="space-y-4">
 <h3 className="text-label text-slate-400/80">{t('upcomingEvents')}</h3>
 {(!events || events.filter(e => e.audience === 'all' || e.audience === 'teachers').length === 0) ? (
 <EmptyState icon="event_busy" message="No Events" description="No upcoming events." />
 ) : (
 events.filter(e => e.audience === 'all' || e.audience === 'teachers').slice(0, 2).map(event => (
 <div key={event.id} className="flex gap-4 p-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
 <div className="flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
 <span className="text-label text-primary">{event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : 'N/A'}</span>
 <span className="text-section text-slate-900 dark:text-slate-100">{event.date ? new Date(event.date).getDate() : '-'}</span>
 </div>
 <div className="flex-1">
 <h4 className="text-label text-slate-900 dark:text-slate-100">{event.title}</h4>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80">{event.location || 'N/A'}</p>
 </div>
 </div>
 ))
 )}
 
 <h3 className="text-label text-slate-400/80 mt-6">{t('announcements')}</h3>
 {(!announcements || announcements.filter(a => a.audience === 'all' || a.audience === 'teachers').length === 0) ? (
 <EmptyState icon="campaign" message="No Announcements" description="No active announcements." />
 ) : (
 announcements.filter(a => a.audience === 'all' || a.audience === 'teachers').slice(0, 2).map(ann => (
 <div key={ann.id} className={`p-3 border-l-4 rounded-r-xl bg-slate-100/50 dark:bg-slate-800/50 ${ann.priority === 'urgent' ? 'border-rose-500' : 'border-primary/20'}`}>
 <h4 className="text-label text-slate-800 dark:text-slate-200">{ann.title}</h4>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80 mt-1 line-clamp-1">{ann.content || ann.message || ''}</p>
 </div>
 ))
 )}
 </div>
 </section>
 </div>
 </div>

 <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit New Grade" onSave={handleSaveGrade}>
 <DynamicForm fields={gradeFields} onChange={setFormData} />
 </Modal>
 </PageLayout>
 );
};

export default TeacherDashboard;

