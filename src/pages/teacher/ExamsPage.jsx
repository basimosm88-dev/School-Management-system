import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const TeacherExamsPage = () => {
  const { classes, students, exams, saveExamResults } = useData();
  const { currentUser } = useAppContext();

  const [selectedExamType, setSelectedExamType] = useState('Before Midterm');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examGrades, setExamGrades] = useState({});
  const [remarks, setRemarks] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const examTypes = ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

  const assignedClasses = useMemo(() => {
    return classes.filter(c => 
      c.teacherId === currentUser?.id || 
      (c.subjects && c.subjects.some(s => s.teacherId === currentUser?.id))
    );
  }, [classes, currentUser]);

  const classSubjects = useMemo(() => {
    if (!selectedClassId) return [];
    const classObj = classes.find(c => String(c.id) === String(selectedClassId));
    return (classObj?.subjects || []).filter(s => String(s.teacherId) === String(currentUser?.id));
  }, [selectedClassId, classes, currentUser]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(s => String(s.classId) === String(selectedClassId));
  }, [selectedClassId, students]);

  const currentExamStatus = useMemo(() => {
    if (!selectedExamType || !selectedClassId || !selectedSubjectId) return null;
    const record = exams.find(e => 
      e.examType === selectedExamType && 
      String(e.classId) === String(selectedClassId) && 
      (String(e.subjectId) === String(selectedSubjectId) || e.subjectName === selectedSubjectId)
    );
    return record?.status || 'DRAFT';
  }, [selectedExamType, selectedClassId, selectedSubjectId, exams]);

  useEffect(() => {
    if (selectedExamType && selectedClassId && selectedSubjectId) {
      const existing = exams.filter(e => 
        e.examType === selectedExamType && 
        String(e.classId) === String(selectedClassId) && 
        (String(e.subjectId) === String(selectedSubjectId) || e.subjectName === selectedSubjectId)
      );
      
      const gradeMap = {};
      const remarkMap = {};
      existing.forEach(e => {
        gradeMap[e.studentId] = e.grade;
        remarkMap[e.studentId] = e.remarks;
      });
      setExamGrades(gradeMap);
      setRemarks(remarkMap);
    }
  }, [selectedExamType, selectedClassId, selectedSubjectId, exams]);

  const handleGradeChange = (studentId, grade) => {
    if (isLocked) return;
    setExamGrades(prev => ({ ...prev, [studentId]: grade }));
  };

  const handleRemarkChange = (studentId, remark) => {
    if (isLocked) return;
    setRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSubmit = (status) => {
    const results = classStudents.map(s => ({
      studentId: s.id,
      grade: examGrades[s.id] || 0,
      remarks: remarks[s.id] || ''
    }));

    saveExamResults(selectedExamType, selectedClassId, selectedSubjectId, currentUser.id, results, status);
    setSuccessMessage(status === 'SUBMITTED' ? 'Exams submitted for approval!' : 'Draft saved successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const isLocked = currentExamStatus === 'SUBMITTED' || currentExamStatus === 'APPROVED' || currentExamStatus === 'PUBLISHED';

  return (
    <PageLayout role="teacher" title="Academic Assessment">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* PAGE HEADER */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-heading text-slate-900 dark:text-white">Exams</h2>
          <p className="text-label text-slate-500/80 mt-1">Submit and manage examination results for your students across assessment cycles.</p>
        </div>
        
        {/* HEADER CONTROL BAR */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative z-10">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Assessment Cycle</label>
              <select 
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Class Section</label>
              <select 
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId('');
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="">Choose class...</option>
                {assignedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Academic Subject</label>
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <option value="">{selectedClassId ? 'Choose subject...' : 'Select class first'}</option>
                {classSubjects.map(s => (
                  <option key={s.name} value={s.id || s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Workflow State:</span>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                currentExamStatus === 'PUBLISHED' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' :
                currentExamStatus === 'APPROVED' ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20' :
                currentExamStatus === 'SUBMITTED' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                currentExamStatus === 'REJECTED' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' :
                'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}>
                {currentExamStatus || 'DRAFT'}
              </span>
              {isLocked && (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Read Only</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleSubmit('DRAFT')}
                disabled={!selectedSubjectId || isLocked}
                className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-30"
              >
                Save as Draft
              </button>
              <button 
                onClick={() => handleSubmit('SUBMITTED')}
                disabled={!selectedSubjectId || isLocked}
                className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-section">send</span>
                Submit for Approval
              </button>
            </div>
          </div>
          
          {successMessage && (
            <div className="mt-4 p-4 bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-section">verified</span>
              {successMessage}
            </div>
          )}
        </div>

        {/* REFINED GRADING TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all min-h-[500px]">
          {!selectedSubjectId ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[40px] opacity-20">edit_document</span>
              </div>
              <h3 className="text-section font-bold uppercase tracking-widest opacity-40">Ready to Grade</h3>
              <p className="text-label opacity-40 mt-1">Configure assessment filters above to load the student list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-label">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5 text-center w-40">Academic Mark</th>
                    <th className="px-8 py-5">Performance Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {classStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {student.name[0]}
                          </div>
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold block leading-tight">{student.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium tracking-tight">ID: #{student.systemId || student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="relative group/input">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={examGrades[student.id] || ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            disabled={isLocked}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-center font-black text-primary text-section focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50 ${isLocked ? 'border-transparent' : 'border-slate-100 dark:border-slate-700 hover:border-primary/30'}`}
                            placeholder="--"
                          />
                          {!isLocked && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/input:opacity-100 transition-all pointer-events-none">
                              <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-bold rounded uppercase">0-100 Range</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="text"
                          value={remarks[student.id] || ''}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                          disabled={isLocked}
                          className={`w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-label text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50 ${isLocked ? 'border-transparent' : 'border-slate-100 dark:border-slate-700 hover:border-primary/30'}`}
                          placeholder="Provide qualitative feedback..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TeacherExamsPage;
