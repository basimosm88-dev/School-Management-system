import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const TeacherExamsPage = () => {
 const { classes, subjects, teachers, students, exams, saveExamResults } = useData();
 const { currentUser } = useAppContext();

 const [selectedExamType, setSelectedExamType] = useState('Before Midterm');
 const [selectedClassId, setSelectedClassId] = useState('');
 const [selectedSubjectId, setSelectedSubjectId] = useState('');
 const [examGrades, setExamGrades] = useState({});
 const [remarks, setRemarks] = useState({});
 const [successMessage, setSuccessMessage] = useState('');

 const examTypes = ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

 // Get teacher's assigned classes
 const assignedClasses = useMemo(() => {
 return classes.filter(c => 
 c.teacherId === currentUser?.id || 
 (c.subjects && c.subjects.some(s => s.teacherId === currentUser?.id))
 );
 }, [classes, currentUser]);

 // Get subjects for selected class that are assigned to this teacher
 const classSubjects = useMemo(() => {
 if (!selectedClassId) return [];
 const classObj = classes.find(c => c.id === parseInt(selectedClassId));
 return (classObj?.subjects || []).filter(s => s.teacherId === currentUser?.id);
 }, [selectedClassId, classes, currentUser]);

 // Get students in selected class
 const classStudents = useMemo(() => {
 if (!selectedClassId) return [];
 return students.filter(s => s.classId === parseInt(selectedClassId));
 }, [selectedClassId, students]);

 // Check if current exam is already submitted/approved
 const currentExamStatus = useMemo(() => {
 if (!selectedExamType || !selectedClassId || !selectedSubjectId) return null;
 const record = exams.find(e => 
 e.examType === selectedExamType && 
 e.classId === parseInt(selectedClassId) && 
 (e.subjectId === parseInt(selectedSubjectId) || e.subjectName === selectedSubjectId)
 );
 return record?.status || 'DRAFT';
 }, [selectedExamType, selectedClassId, selectedSubjectId, exams]);

 // Load existing grades when filters change
 React.useEffect(() => {
 if (selectedExamType && selectedClassId && selectedSubjectId) {
 const existing = exams.filter(e => 
 e.examType === selectedExamType && 
 e.classId === parseInt(selectedClassId) && 
 (e.subjectId === parseInt(selectedSubjectId) || e.subjectName === selectedSubjectId)
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
 if (currentExamStatus !== 'DRAFT' && currentExamStatus !== 'REJECTED' && currentExamStatus !== null) return;
 setExamGrades(prev => ({ ...prev, [studentId]: grade }));
 };

 const handleRemarkChange = (studentId, remark) => {
 if (currentExamStatus !== 'DRAFT' && currentExamStatus !== 'REJECTED' && currentExamStatus !== null) return;
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
 <PageLayout role="teacher" title="Academic Exams">
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* CONTROL BAR */}
 <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
 <div>
 <label className="text-body-sm text-slate-400 mb-2 block">Exam Type</label>
 <select 
 value={selectedExamType}
 onChange={(e) => setSelectedExamType(e.target.value)}
 className="form-input-custom w-full"
 >
 {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 <div>
 <label className="text-body-sm text-slate-400 mb-2 block">Select Class</label>
 <select 
 value={selectedClassId}
 onChange={(e) => {
 setSelectedClassId(e.target.value);
 setSelectedSubjectId('');
 }}
 className="form-input-custom w-full"
 >
 <option value="">Choose class...</option>
 {assignedClasses.map(cls => (
 <option key={cls.id} value={cls.id}>{cls.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-body-sm text-slate-400 mb-2 block">Subject</label>
 <select 
 value={selectedSubjectId}
 onChange={(e) => setSelectedSubjectId(e.target.value)}
 disabled={!selectedClassId}
 className="form-input-custom w-full disabled:opacity-30"
 >
 <option value="">Choose subject...</option>
 {classSubjects.map(s => (
 <option key={s.name} value={s.id || s.name}>{s.name}</option>
 ))}
 </select>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleSubmit('DRAFT')}
 disabled={!selectedSubjectId || isLocked}
 className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-body-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-30"
 >
 Save Draft
 </button>
 <button 
 onClick={() => handleSubmit('SUBMITTED')}
 disabled={!selectedSubjectId || isLocked}
 className="flex-1 px-4 py-3.5 bg-primary text-white text-body-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all disabled:opacity-30"
 >
 Submit
 </button>
 {(selectedExamType === 'Before Midterm' || selectedExamType === 'After Midterm') && currentExamStatus === 'APPROVED' && (
 <button 
 onClick={() => handleSubmit('PUBLISHED')}
 className="flex-1 px-4 py-3.5 bg-emerald-500 text-white text-body-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
 >
 Release Results
 </button>
 )}
 </div>
 </div>

 {currentExamStatus && (
 <div className="mt-6 flex items-center gap-3">
 <span className="text-body-sm text-slate-400">Workflow Status:</span>
 <span className={`px-4 py-1 rounded-full text-body-sm  border ${
 currentExamStatus === 'PUBLISHED' ? 'bg-emerald-500 text-white border-emerald-500' :
 currentExamStatus === 'APPROVED' ? 'bg-sky-500 text-white border-sky-500' :
 currentExamStatus === 'SUBMITTED' ? 'bg-amber-500 text-white border-amber-500' :
 currentExamStatus === 'REJECTED' ? 'bg-rose-500 text-white border-rose-500' :
 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
 }`}>
 {currentExamStatus}
 </span>
 {isLocked && (
 <p className="text-body-sm text-rose-500 italic">Editing is locked for this exam.</p>
 )}
 </div>
 )}
 
 {successMessage && (
 <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-body-sm rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
 <span className="material-symbols-outlined text-headline-sm">check_circle</span>
 {successMessage}
 </div>
 )}
 </div>

 {/* GRADES LIST */}
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors min-h-[400px]">
 {!selectedSubjectId ? (
 <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 opacity-40">
 <span className="material-symbols-outlined text-display-bold">edit_document</span>
 </div>
 <p className="text-body-sm opacity-60">Select filters to enter academic results</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-body-sm">
 <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-body-sm border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-8 py-5">Student Information</th>
 <th className="px-8 py-5 w-32">Grade (0-100)</th>
 <th className="px-8 py-5">Academic Remarks</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {classStudents.map(student => (
 <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-8 py-5">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-body-sm">
 {student.name[0]}
 </div>
 <div>
 <span className="text-slate-800 dark:text-slate-200 block">{student.name}</span>
 <span className="text-body-sm text-slate-400">{student.email}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-5">
 <input 
 type="number"
 min="0"
 max="100"
 value={examGrades[student.id] || ''}
 onChange={(e) => handleGradeChange(student.id, e.target.value)}
 disabled={isLocked}
 className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-center text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
 placeholder="--"
 />
 </td>
 <td className="px-8 py-5">
 <input 
 type="text"
 value={remarks[student.id] || ''}
 onChange={(e) => handleRemarkChange(student.id, e.target.value)}
 disabled={isLocked}
 className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-body-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
 placeholder="e.g. Needs improvement"
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
