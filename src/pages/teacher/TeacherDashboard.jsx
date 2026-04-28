import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';
import { useData } from '../../contexts/DataContext';

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
  const { submitGrade, classes, students, grades, addNotification, events, announcements } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

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
    <PageLayout role="teacher" title={`Welcome, ${currentUser?.name || 'Teacher'}`}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="My Classes" value={myClasses.length} icon="class" iconColorClass="bg-blue-50 text-primary" />
        <StatCard title="My Students" value={myStudents.length} icon="person" iconColorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Grades Submitted" value={myGradesCount} icon="grade" iconColorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Attendance Today" value="98%" icon="event_available" iconColorClass="bg-emerald-50 text-emerald-600" trend="2%" trendUp={true} />
      </div>

      <div className="bento-grid">
        {/* Left Main Column */}
        <div className="col-span-8 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Tasks</h2>
              <button 
                onClick={() => setModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Grades
              </button>
            </div>
            <div className="space-y-3">
              <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary/20 dark:hover:border-primary/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined">grade</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Enter Grades</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Submit new grades for review</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(true)} className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 transition-all">Enter Grades</button>
              </div>
              <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary/20 dark:hover:border-primary/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined">how_to_reg</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Mark Attendance</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Grade 11 Physics</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Mark Now</button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar Column */}
        <div className="col-span-4 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Events & Notices</h2>
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Events</h3>
              {(events || []).filter(e => e.audience === 'all' || e.audience === 'teachers').slice(0, 2).map(event => (
                <div key={event.id} className="flex gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-primary uppercase">{event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : 'N/A'}</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{event.date ? new Date(event.date).getDate() : '-'}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{event.location || 'N/A'}</p>
                  </div>
                </div>
              ))}
              
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">Announcements</h3>
              {(announcements || []).filter(a => a.audience === 'all' || a.audience === 'teachers').slice(0, 2).map(ann => (
                <div key={ann.id} className={`p-3 border-l-4 rounded-r-xl bg-slate-50/50 dark:bg-slate-800/50 ${ann.priority === 'urgent' ? 'border-rose-500' : 'border-primary/20'}`}>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ann.content || ann.message || ''}</p>
                </div>
              ))}
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

