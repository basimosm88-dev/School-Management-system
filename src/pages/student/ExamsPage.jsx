import React, { useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const StudentExamsPage = () => {
  const { exams } = useData();
  const { currentUser } = useAppContext();

  // Filter exams for this student
  const studentExams = useMemo(() => {
    return exams.filter(e => e.studentId === currentUser?.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [exams, currentUser]);

  const getStatus = (exam) => {
    const examDate = new Date(exam.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (examDate < today) return 'Completed';
    return 'Upcoming';
  };

  return (
    <PageLayout role="student" title="Exam Schedule">
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        
        {/* Info Header */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 dark:border-amber-800/50 shadow-sm">
              <span className="material-symbols-outlined text-display">event_note</span>
            </div>
            <div>
              <h1 className="text-display text-slate-900 dark:text-white">Academic Calendar</h1>
              <p className="text-label text-slate-500/80 mt-1">Review your upcoming and completed exam dates. Results are available in the Results module.</p>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Subject</th>
                  <th className="px-8 py-5">Exam Type</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentExams.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <span className="material-symbols-outlined text-display mb-4">calendar_today</span>
                        <p className="text-label">No exams scheduled at this time</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studentExams.map((exam) => {
                    const status = getStatus(exam);
                    return (
                      <tr key={exam.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-label text-slate-800 dark:text-slate-100 font-bold">{exam.subjectName}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-label text-slate-500 dark:text-slate-400">{exam.examType}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-section text-slate-400">calendar_month</span>
                            <span className="text-label text-slate-600 dark:text-slate-400">{exam.date}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                            status === 'Upcoming' 
                              ? 'bg-blue-50 text-primary border-blue-100 dark:bg-primary/10 dark:border-primary/20' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice Card */}
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-6">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <h5 className="text-indigo-900 dark:text-indigo-100 text-label font-bold uppercase mb-1">Schedule Policy</h5>
            <p className="text-label text-indigo-800/70 dark:text-indigo-200/70 leading-relaxed max-w-2xl">
              Exam dates are subject to change by the administration. Please ensure you arrive at the designated location at least 15 minutes before the start time. 
              Results will only be displayed in the <strong>Results</strong> module after official release.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentExamsPage;
