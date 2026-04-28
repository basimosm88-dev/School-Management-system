import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';

const AdminExamsPage = () => {
  const { 
    classes, subjects, students, teachers, exams, 
    updateExamStatus, calculateRankings, calculatePromotion,
    promotionSettings, setPromotionSettings, promotions,
    examReleaseSettings, setExamReleaseSettings
  } = useData();

  const [activeTab, setActiveTab] = useState('review');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Midterm');
  const [viewingSubmission, setViewingSubmission] = useState(null);

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
    setExamReleaseSettings(prev => ({
      ...prev,
      [examType]: { ...settings, isApproved: true }
    }));
  };

  const rankings = useMemo(() => {
    if (!selectedClassId) return [];
    return calculateRankings(selectedClassId);
  }, [selectedClassId, calculateRankings, exams]);

  const handlePrintReport = (studentId) => {
    window.open(`/print-report/${studentId}`, '_blank');
  };

  return (
    <PageLayout role="admin" title="Exams Management">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* TABS */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {['review', 'release', 'rankings', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                activeTab === tab 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
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
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Pending Approvals</h3>
            </div>
            {pendingSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-20">fact_check</span>
                <p className="font-bold uppercase tracking-widest text-[10px]">No pending exam submissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-8 py-5">Class & Subject</th>
                      <th className="px-8 py-5">Exam Type</th>
                      <th className="px-8 py-5">Submitted By</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingSubmissions.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-black text-slate-800 dark:text-slate-200">{sub.className}</div>
                          <div className="text-[10px] text-primary font-bold uppercase tracking-wider">{sub.subjectName}</div>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-black uppercase text-slate-500">{sub.examType}</td>
                        <td className="px-8 py-5 text-[10px] font-black uppercase text-slate-500">{sub.teacherName}</td>
                        <td className="px-8 py-5">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setViewingSubmission(sub)}
                              className="px-4 py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              View
                            </button>
                            <button 
                              onClick={() => handleReject(sub)}
                              className="px-4 py-2 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-lg border border-rose-100 hover:bg-rose-100 transition-all"
                            >Reject</button>
                            <button 
                              onClick={() => handleApprove(sub)}
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all"
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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{viewingSubmission.className} - {viewingSubmission.subjectName}</h3>
                  <p className="text-[10px] text-primary font-bold uppercase mt-1">{viewingSubmission.examType}</p>
                </div>
                <button 
                  onClick={() => setViewingSubmission(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
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
                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{studentName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded font-black text-[10px] ${record.grade >= (promotionSettings.passingGrade || 50) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {record.grade}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic">{record.remarks || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
                <button 
                  onClick={() => setViewingSubmission(null)}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => { handleApprove(viewingSubmission); setViewingSubmission(null); }}
                  className="px-6 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
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
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Approved for Release</h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Midterm and Final exams only. Other terms are released by teachers.</p>
                </div>
              </div>
              {releasableExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                  <p className="font-bold uppercase tracking-widest text-[10px]">No approved exams pending release</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {releasableExams.map((exam, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-800 dark:text-slate-200">{exam.className}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{exam.examType} Results</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exam.subjects.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-black uppercase text-slate-500">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleRelease(exam)}
                                className="px-6 py-2.5 bg-primary text-white text-[9px] font-black uppercase rounded-xl shadow-lg shadow-primary/10 hover:bg-blue-700 transition-all"
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
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">Schedule {type}</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Release Date</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Release Time</label>
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
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider leading-relaxed">
                          ✓ Schedule approved. Exam will release automatically on {examReleaseSettings[type].date} at {examReleaseSettings[type].time}.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider leading-relaxed">
                          Set date/time above and click approve to schedule automated release.
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={() => handleScheduleRelease(type)}
                      disabled={examReleaseSettings[type].isApproved || !examReleaseSettings[type].date || !examReleaseSettings[type].time}
                      className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
                    >
                      {examReleaseSettings[type].isApproved ? 'Schedule Approved' : 'Approve Schedule'}
                    </button>
                    
                    {examReleaseSettings[type].isApproved && (
                      <button 
                        onClick={() => setExamReleaseSettings(prev => ({
                          ...prev,
                          [type]: { ...prev[type], isApproved: false }
                        }))}
                        className="w-full py-2 text-rose-500 text-[8px] font-black uppercase tracking-widest hover:underline"
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

        {/* RANKINGS TAB */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Class for Ranking</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id.toString())}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${
                        selectedClassId === c.id.toString() 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              {selectedClassId && (
                <div className="flex items-end gap-4 ml-auto border-l border-slate-100 dark:border-slate-800 pl-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Print Class Exam</label>
                    <select 
                      value={selectedExamType} 
                      onChange={e => setSelectedExamType(e.target.value)}
                      className="form-input-custom py-2 text-xs"
                    >
                      {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={() => window.open(`/print-class-exam/${selectedClassId}/${selectedExamType}`, '_blank')}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase rounded-lg hover:opacity-90 transition-all flex items-center gap-2 h-[38px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Print
                  </button>
                </div>
              )}
            </div>

            {selectedClassId && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-8 py-5 w-20">Rank</th>
                      <th className="px-8 py-5">Student</th>
                      <th className="px-8 py-5">Avg. Score</th>
                      <th className="px-8 py-5">Promotion</th>
                      <th className="px-8 py-5 text-right">Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rankings.map((r, i) => {
                      const promo = promotions?.find(p => p.studentId === r.studentId)?.status || calculatePromotion(r.studentId);
                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-8 py-5 font-black text-primary text-lg">#{r.rank}</td>
                          <td className="px-8 py-5">
                            <span className="font-black text-slate-800 dark:text-slate-200">{r.name}</span>
                          </td>
                          <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-400">{r.averageScore.toFixed(1)}%</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              promo === 'Promoted' ? 'bg-emerald-500 text-white' :
                              promo === 'Conditional' ? 'bg-amber-500 text-white' :
                              promo === 'Failed' ? 'bg-rose-500 text-white' :
                              'bg-slate-200 text-slate-500'
                            }`}>
                              {promo}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => handlePrintReport(r.studentId)}
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2 ml-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                              Print Official
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm p-10 transition-colors">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-8">Promotion Rules</h3>
            <div className="space-y-8">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Minimum Passing Grade (%)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={promotionSettings.passingGrade}
                    onChange={e => setPromotionSettings({...promotionSettings, passingGrade: parseInt(e.target.value)})}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg">
                    {promotionSettings.passingGrade}%
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Subjects Required to Pass</label>
                <input 
                  type="number" 
                  value={promotionSettings.minSubjects}
                  onChange={e => setPromotionSettings({...promotionSettings, minSubjects: parseInt(e.target.value)})}
                  className="form-input-custom w-32"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Maximum subjects a student can fail before total failure.</p>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">Weightage Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Before Mid', val: '10%' },
                      { label: 'Midterm', val: '30%' },
                      { label: 'After Mid', val: '10%' },
                      { label: 'Final', val: '50%' }
                    ].map(w => (
                      <div key={w.label} className="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{w.label}</p>
                        <p className="text-sm font-black text-primary">{w.val}</p>
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
