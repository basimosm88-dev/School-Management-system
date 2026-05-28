import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const AdminExamsPage = () => {
  const { 
    classes, subjects, students, teachers, exams, 
    updateExamStatus, calculateRankings, calculatePromotion,
    promotionSettings, setPromotionSettings, promotions,
    saveExamReleaseSchedule
  } = useData();
  const { t, academicSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('review');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Midterm');
  const [viewingSubmission, setViewingSubmission] = useState(null);

  const [examReleaseSettings, setExamReleaseSettings] = useState({
    Midterm: { date: '', time: '', isApproved: false },
    Final: { date: '', time: '', isApproved: false }
  });

  useEffect(() => {
    const midtermExam = exams.find(e => e.examType === 'Midterm');
    const finalExam = exams.find(e => e.examType === 'Final');

    const midtermSchedule = midtermExam?.details?.releaseSchedule || { date: '', time: '', isApproved: false };
    const finalSchedule = finalExam?.details?.releaseSchedule || { date: '', time: '', isApproved: false };

    setExamReleaseSettings({
      Midterm: {
        date: midtermSchedule.date || '',
        time: midtermSchedule.time || '',
        isApproved: !!midtermSchedule.isApproved
      },
      Final: {
        date: finalSchedule.date || '',
        time: finalSchedule.time || '',
        isApproved: !!finalSchedule.isApproved
      }
    });
  }, [exams]);

  const examTypes = ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

  // 1. Group submitted exams for review
  const pendingSubmissions = useMemo(() => {
    const grouped = [];
    const submissions = exams.filter(e => e.status === 'SUBMITTED');
    
    submissions.forEach(e => {
      const existing = grouped.find(g => 
        g.examType === e.examType && 
        g.classId === e.classId && 
        g.subjectName === e.subjectName
      );
      
      if (!existing) {
        grouped.push({
          examType: e.examType,
          classId: e.classId,
          subjectId: e.subjectId,
          subjectName: e.subjectName,
          teacherId: e.teacherId,
          className: classes.find(c => c.id === e.classId)?.name,
          teacherName: teachers.find(t => t.id === e.teacherId)?.name,
          count: 1
        });
      } else {
        existing.count++;
      }
    });
    return grouped;
  }, [exams, classes, teachers]);

  // 2. Approved exams ready for admin release (Midterm / Final only) - Grouped by Class
  const releasableExams = useMemo(() => {
    const grouped = [];
    const approved = exams.filter(e => e.status === 'APPROVED' && ['Midterm', 'Final'].includes(e.examType));
    
    approved.forEach(e => {
      const existing = grouped.find(g => 
        g.examType === e.examType && 
        g.classId === e.classId
      );
      
      if (!existing) {
        grouped.push({
          examType: e.examType,
          classId: e.classId,
          className: classes.find(c => c.id === e.classId)?.name,
          subjects: [e.subjectName]
        });
      } else if (!existing.subjects.includes(e.subjectName)) {
        existing.subjects.push(e.subjectName);
      }
    });
    return grouped;
  }, [exams, classes]);

  const handleApprove = (submission) => {
    updateExamStatus(submission.examType, submission.classId, submission.subjectId || submission.subjectName, 'APPROVED');
  };

  const handleReject = (submission) => {
    updateExamStatus(submission.examType, submission.classId, submission.subjectId || submission.subjectName, 'REJECTED');
  };

  const handleRelease = (exam) => {
    // Publish all subjects for this class and exam type
    updateExamStatus(exam.examType, exam.classId, 'all', 'PUBLISHED');
  };

  const handleScheduleRelease = (examType) => {
    const settings = examReleaseSettings[examType];
    if (!settings.date || !settings.time) return alert("Please set date and time for " + examType);
    saveExamReleaseSchedule(examType, settings.date, settings.time, true);
  };

 return (
 <PageLayout role="admin" title={t('exams')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-heading text-slate-900 dark:text-white">{t('exams')}</h2>
 <p className="text-label text-slate-500/80 mt-1">{t('examsSubtitle')}</p>
 </div>

 {/* TABS */}
 <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
 {['Review', 'Release', 'Settings'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab.toLowerCase())}
 className={`px-8 py-3 rounded-lg text-label   transition-all ${
 activeTab === tab.toLowerCase() 
 ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
 : 'text-slate-500/80 hover:text-slate-700 dark:text-slate-400/80 dark:hover:text-slate-200'
 }`}
 >
 {tab}
 </button>
 ))}
 </div>

 {/* REVIEW TAB */}
 {activeTab === 'review' && (
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors min-h-[400px]">
 <div className="p-8 border-b border-slate-100 dark:border-slate-800">
 <h3 className="text-section text-slate-800 dark:text-slate-200">Pending Approvals</h3>
 </div>
 {pendingSubmissions.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[400px] text-slate-400/80">
 <span className="material-symbols-outlined text-display mb-4 opacity-20">fact_check</span>
 <p className="text-label">No pending exam submissions</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label">
 <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-400/80 text-label border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-8 py-5">Class & Subject</th>
 <th className="px-8 py-5">Exam Type</th>
 <th className="px-8 py-5">Submitted By</th>
 <th className="px-8 py-5 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {pendingSubmissions.map((sub, i) => (
 <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-5">
 <div className="text-slate-800 dark:text-slate-200">{sub.className}</div>
 <div className="text-label text-primary">{sub.subjectName}</div>
 </td>
 <td className="px-8 py-5 text-label text-slate-500/80">{sub.examType}</td>
 <td className="px-8 py-5 text-label text-slate-500/80">{sub.teacherName}</td>
 <td className="px-8 py-5">
 <div className="flex justify-end gap-2">
 <button 
 onClick={() => setViewingSubmission(sub)}
 className="px-4 py-2 bg-slate-100 text-slate-600 text-label rounded-lg border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-1"
 >
 <span className="material-symbols-outlined text-body">visibility</span>
 View
 </button>
 <button 
 onClick={() => handleReject(sub)}
 className="px-4 py-2 bg-rose-50 text-rose-600 text-label rounded-lg border border-rose-100 hover:bg-rose-100 transition-all"
 >Reject</button>
 <button 
 onClick={() => handleApprove(sub)}
 className="px-4 py-2 bg-emerald-50 text-emerald-600 text-label rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all"
 >Approve</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* VIEWING MODAL */}
 {viewingSubmission && (
 <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
 <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
 <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
 <div>
 <h3 className="text-label text-slate-800 dark:text-slate-200">{viewingSubmission.className} - {viewingSubmission.subjectName}</h3>
 <p className="text-label text-primary mt-1">{viewingSubmission.examType}</p>
 </div>
 <button 
 onClick={() => setViewingSubmission(null)}
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400/80 transition-colors"
 >
 <span className="material-symbols-outlined text-display">close</span>
 </button>
 </div>
 <div className="p-6 max-h-[60vh] overflow-y-auto">
 <table className="w-full text-left text-label">
 <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-400/80 text-label">
 <tr>
 <th className="px-6 py-4 rounded-l-xl">Student</th>
 <th className="px-6 py-4">Grade</th>
 <th className="px-6 py-4 rounded-r-xl">Remarks</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
 {exams.filter(e => 
 e.examType === viewingSubmission.examType && 
 e.classId === viewingSubmission.classId && 
 e.subjectName === viewingSubmission.subjectName
 ).map(record => {
 const studentName = students.find(s => s.id === record.studentId)?.name || 'Unknown';
 return (
 <tr key={record.id}>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{studentName}</td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded  text-label ${record.grade >= (promotionSettings.passingGrade || 50) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
 {record.grade}%
 </span>
 </td>
 <td className="px-6 py-4 text-label text-slate-400/80 italic">{record.remarks || '-'}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl shrink-0">
  <button 
  onClick={() => setViewingSubmission(null)}
  className="btn-secondary"
  >
  Close
  </button>
  <button 
  onClick={() => { handleApprove(viewingSubmission); setViewingSubmission(null); }}
  className="btn-success"
  >
  <span className="btn-icon">check_circle</span>
  Approve Submission
  </button>
 </div>
 </div>
 </div>
 )}

 {/* RELEASE TAB */}
 {activeTab === 'release' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm h-fit">
 <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
 <div>
 <h3 className="text-label text-slate-800 dark:text-slate-200">Approved for Release</h3>
 <p className="text-label text-slate-400/80 mt-1">Midterm and Final exams only. Other terms are released by teachers.</p>
 </div>
 </div>
 {releasableExams.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[300px] text-slate-400/80">
 <p className="text-label">No approved exams pending release</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label">
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {releasableExams.map((exam, i) => (
 <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-5">
 <div className="text-slate-800 dark:text-slate-200">{exam.className}</div>
 <div className="text-label text-slate-400/80">{exam.examType} Results</div>
 <div className="flex flex-wrap gap-1 mt-2">
 {exam.subjects.map(s => (
 <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-label text-slate-500/80">{s}</span>
 ))}
 </div>
 </td>
 <td className="px-8 py-5">
 <div className="flex justify-end gap-2">
 <button 
 onClick={() => handleRelease(exam)}
 className="px-6 py-2.5 bg-primary text-white text-label rounded-xl shadow-lg shadow-primary/10 hover:bg-blue-700 transition-all"
 >Publish Now</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 <div className="space-y-6">
 {['Midterm', 'Final'].map(type => (
 <div key={type} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm p-8">
 <h3 className="text-label text-slate-800 dark:text-slate-200 mb-6">Schedule {type}</h3>
 <div className="space-y-6">
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">Release Date</label>
 <input 
 type="date" 
 value={examReleaseSettings[type].date}
 onChange={e => setExamReleaseSettings(prev => ({
 ...prev,
 [type]: { ...prev[type], date: e.target.value, isApproved: false }
 }))}
 className="form-input-custom w-full"
 />
 </div>
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">Release Time</label>
 <input 
 type="time" 
 value={examReleaseSettings[type].time}
 onChange={e => setExamReleaseSettings(prev => ({
 ...prev,
 [type]: { ...prev[type], time: e.target.value, isApproved: false }
 }))}
 className="form-input-custom w-full"
 />
 </div>
 
 {examReleaseSettings[type].isApproved ? (
 <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
 <p className="text-label text-emerald-600 dark:text-emerald-400 leading-relaxed">
 ✓ Schedule approved. Exam will release automatically on {examReleaseSettings[type].date} at {examReleaseSettings[type].time}.
 </p>
 </div>
 ) : (
 <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
 <p className="text-label text-amber-600 dark:text-amber-400 leading-relaxed">
 Set date/time above and click approve to schedule automated release.
 </p>
 </div>
 )}

 <button 
 onClick={() => handleScheduleRelease(type)}
 disabled={examReleaseSettings[type].isApproved || !examReleaseSettings[type].date || !examReleaseSettings[type].time}
 className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-label rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
 >
 {examReleaseSettings[type].isApproved ? 'Schedule Approved' : 'Approve Schedule'}
 </button>
 
 {examReleaseSettings[type].isApproved && (
 <button 
 onClick={() => saveExamReleaseSchedule(type, examReleaseSettings[type].date, examReleaseSettings[type].time, false)}
 className="w-full py-2 text-rose-500 text-label hover:underline"
 >
 Cancel or Edit Schedule
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}



 {/* SETTINGS TAB */}
 {activeTab === 'settings' && (
 <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm p-10 transition-colors">
 <h3 className="text-label text-slate-800 dark:text-slate-200 mb-8">Promotion Rules</h3>
 <div className="space-y-8">
 <div>
 <label className="text-label text-slate-400/80 mb-3 block">Minimum Passing Grade (%)</label>
 <div className="flex items-center gap-4">
 <input 
 type="range" 
 min="0" 
 max="100" 
 value={promotionSettings.passingGrade}
 onChange={e => setPromotionSettings({...promotionSettings, passingGrade: parseInt(e.target.value)})}
 className="flex-1 accent-primary"
 />
 <span className="w-16 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-section">
 {promotionSettings.passingGrade}%
 </span>
 </div>
 </div>
 <div>
 <label className="text-label text-slate-400/80 mb-3 block">Subjects Required to Pass</label>
 <input 
 type="number" 
 value={promotionSettings.minSubjects}
 onChange={e => setPromotionSettings({...promotionSettings, minSubjects: parseInt(e.target.value)})}
 className="form-input-custom w-32"
 />
 <p className="text-label text-slate-400/80 mt-2">Maximum subjects a student can fail before total failure.</p>
 </div>
 <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
 <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
 <h4 className="text-label text-slate-800 dark:text-slate-200 mb-4">Weightage Breakdown</h4>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {(() => {
    const weights = academicSettings?.examWeights || {
      beforeMidterm: 10,
      midterm: 30,
      afterMidterm: 10,
      final: 50
    };
    return [
      { label: 'Before Mid', val: `${weights.beforeMidterm || 10}%` },
      { label: 'Midterm', val: `${weights.midterm || 30}%` },
      { label: 'After Mid', val: `${weights.afterMidterm || 10}%` },
      { label: 'Final', val: `${weights.final || 50}%` }
    ];
  })().map(w => (
 <div key={w.label} className="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
 <p className="text-label text-slate-400/80 mb-1">{w.label}</p>
 <p className="text-label text-primary">{w.val}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </PageLayout>
 );
};

export default AdminExamsPage;
