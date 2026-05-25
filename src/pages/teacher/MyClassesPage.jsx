import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import EmptyState from '../../components/ui/EmptyState';

const MyClassesPage = () => {
  const navigate = useNavigate();
  const { classes, students } = useData();
  const { currentUser } = useAppContext();

  const assignedClasses = classes.filter(cls => 
    (currentUser?.assignedClasses || []).some(id => String(id) === String(cls.id)) || 
    String(cls.teacherId) === String(currentUser?.id)
  );

  return (
    <PageLayout role="teacher" title="My Classes">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-heading text-slate-900 dark:text-white">Assigned Classes</h2>
          <p className="text-label text-slate-500 dark:text-slate-400 mt-1">
            Manage attendance, exams, and students for your assigned classes.
          </p>
        </div>

        {assignedClasses.length === 0 ? (
          <EmptyState 
            icon="school" 
            message="No Assigned Classes" 
            description="You are not currently assigned to any classes. Please contact the administrator." 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedClasses.map(cls => {
              const classStudents = students.filter(s => String(s.classId) === String(cls.id));
              const teacherSubjects = (cls.subjects || []).filter(s => s.teacherId === currentUser?.id);

              return (
                <div 
                  key={cls.id}
                  className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-display">groups</span>
                    </div>
                    
                    <h3 className="text-section text-slate-900 dark:text-white mb-1">{cls.name}</h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded-md">
                        {classStudents.length} Students
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-bold uppercase tracking-wider text-blue-600 rounded-md">
                        {teacherSubjects.length} Subjects
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">My Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {teacherSubjects.length > 0 ? (
                          teacherSubjects.map((sub, idx) => (
                            <span key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                              {sub.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-label text-slate-400 italic">No specific subjects assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => navigate(`/teacher/students?classId=${cls.id}`)}
                        className="w-full py-2.5 text-label font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-section">person</span>
                        View Students
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => navigate(`/teacher/attendance?classId=${cls.id}`)}
                          className="py-2.5 text-label font-bold text-primary hover:bg-primary/5 rounded-xl transition-all border border-primary/10 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-section">fact_check</span>
                          Attendance
                        </button>
                        <button 
                          onClick={() => navigate(`/teacher/exams?classId=${cls.id}`)}
                          className="py-2.5 text-label font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl transition-all border border-amber-200 dark:border-amber-900/30 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-section">edit_document</span>
                          Exams
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MyClassesPage;
