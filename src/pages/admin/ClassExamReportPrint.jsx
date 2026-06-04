import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const getExamMaxScore = (type, academicYear) => {
  if (academicYear === '2025-2026') {
    if (type === 'Midterm') return 40;
    if (type === 'Final') return 60;
    return 100;
  }
  if (type === 'Before Midterm') return 10;
  if (type === 'Midterm') return 30;
  if (type === 'After Midterm') return 10;
  if (type === 'Final') return 50;
  return 100;
};

const getGradePercentage = (score, examType, academicYear) => {
  const numScore = parseFloat(score);
  if (isNaN(numScore)) return 0;
  if (academicYear === '2025-2026') {
    if (examType === 'Midterm') return (numScore / 40) * 100;
    if (examType === 'Final') return (numScore / 60) * 100;
    return numScore;
  }
  if (examType === 'Before Midterm') return (numScore / 10) * 100;
  if (examType === 'Midterm') return (numScore / 30) * 100;
  if (examType === 'After Midterm') return (numScore / 10) * 100;
  if (examType === 'Final') return (numScore / 50) * 100;
  return numScore;
};

const getExamTypeTranslation = (type, t) => {
  if (type === 'Before Midterm') return t('beforeMidterm');
  if (type === 'Midterm') return t('midterm');
  if (type === 'After Midterm') return t('afterMidterm');
  if (type === 'Final') return t('final');
  return type;
};

const ClassExamReportPrint = () => {
 const { classId, examType } = useParams();
 const { students, classes, exams } = useData();
 const { schoolSettings, pdfSettings, t, language } = useSettings();

 const currentClass = classes.find(c => String(c.id) === String(classId));
 const classStudents = students.filter(s => String(s.classId) === String(classId));

 useEffect(() => {
 const timer = setTimeout(() => {
 window.print();
 }, 1000);
 return () => clearTimeout(timer);
 }, []);

 if (!currentClass || classStudents.length === 0) {
 return <div className="p-10 text-center font-serif text-rose-500">{t('noDataFound')}</div>;
 }

 // Get all unique subjects for this class and exam type (allow approved or published results for printing)
 const classExams = exams.filter(e => 
   String(e.classId) === String(classId) && 
   e.examType === examType && 
   (e.status === 'PUBLISHED' || e.status === 'APPROVED')
 );

 const uniqueSubjects = [...new Set(classExams.map(e => e.subjectName))].sort();

 return (
 <div className="bg-white min-h-screen font-serif text-slate-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <style>
 {`
 @media print {
 @page { margin: 1.5cm; size: A4 landscape; }
 body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
 .no-print { display: none !important; }
 .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; }
 .sticky { position: static !important; }
 table { width: 100% !important; table-layout: auto !important; }
 }
 @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
 .font-serif { font-family: 'Playfair Display', serif; }
 `}
 </style>

 {/* NO PRINT ACTIONS */}
 <div className="no-print fixed bottom-8 right-8 flex gap-4 z-50">
 <button 
 onClick={() => window.print()}
 className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-label hover:-translate-y-1 transition-transform flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-section">print</span>
 {t('printClassResults')}
 </button>
 </div>

 <div className="print-container max-w-[297mm] mx-auto p-12 bg-white relative border-2 border-slate-900 my-8">
 
 {/* WATERMARK */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-12 whitespace-nowrap z-0">
 <h1 className="text-display">{schoolSettings.name} {t('officialDocument')}</h1>
 </div>

 {/* HEADER */}
 <div className="flex justify-between items-center border-b-4 border-slate-900 pb-10 mb-10 relative z-10">
 <div className="flex items-center gap-6">
 {pdfSettings.showLogo && (
 <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-slate-900 overflow-hidden">
 {schoolSettings.logo ? (
 <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
 ) : (
 <span className="material-symbols-outlined text-display text-slate-900">school</span>
 )}
 </div>
 )}
 <div>
 <h2 className="text-display text-slate-900">{schoolSettings.name}</h2>
 <p className="text-label text-slate-500/80 mt-1">{schoolSettings.address}</p>
 </div>
 </div>
 <div className="text-end">
 <h3 className="text-section">{getExamTypeTranslation(examType, t)} {t('summary')}</h3>
 <p className="text-label text-slate-500/80 mt-1">{t('class')}: {currentClass.name}</p>
 <p className="text-label text-slate-500/80">{t('date')}: {new Date().toLocaleDateString(language)}</p>
 </div>
 </div>

 <div className="mb-10 text-center relative z-10">
 <h1 className="text-display text-slate-900 border-y-2 border-slate-900 py-4">
 {t('masterGradeSheet')} — {currentClass.name}
 </h1>
 </div>

 {/* MASTER TABLE */}
 <div className="relative z-10 overflow-x-auto mb-12">
 <table className="w-full border-collapse border-2 border-slate-900">
 <thead>
 <tr className="bg-slate-900 text-white">
 <th className="border border-slate-700 px-4 py-4 text-label text-start sticky left-0 bg-slate-900 z-20">{t('studentName')}</th>
 {uniqueSubjects.map(sub => (
 <th key={sub} className="border border-slate-700 px-2 py-4 text-label text-center min-w-[80px]">
 {sub}
 </th>
 ))}
 <th className="border border-slate-700 px-4 py-4 text-label text-center bg-slate-800">{t('totalAvg')}</th>
 </tr>
 </thead>
 <tbody>
 {classStudents.map((student, sIdx) => {
 const studentExams = classExams.filter(e => e.studentId === student.id);
 let totalPercentage = 0;
 let rawSum = 0;
 let count = 0;

 return (
 <tr key={student.id} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
 <td className="border border-slate-300 px-4 py-4 text-label sticky left-0 bg-inherit z-10">
 {student.name}
 </td>
 {uniqueSubjects.map(sub => {
 const exam = studentExams.find(e => e.subjectName === sub);
 const score = exam ? exam.grade : null;
 if (score !== null) {
 sumGradedScore(score);
 }
 return (
 <td key={sub} className="border border-slate-300 px-2 py-4 text-center text-label">
 {score !== null ? score : '-'}
 </td>
 );
 })}
 <td className="border border-slate-900 px-4 py-4 text-center text-label bg-slate-100">
 {count > 0 ? `${rawSum.toFixed(1)} / ${(totalPercentage / count).toFixed(2)}%` : '0.0 / 0.00%'}
 </td>
 </tr>
 );

 function sumGradedScore(score) {
   rawSum += score;
   totalPercentage += getGradePercentage(score, examType, currentClass.academicYear);
   count++;
 }
 })}
 </tbody>
 </table>
 </div>

  {/* FOOTER / SIGNATURES */}
  <div className="mt-auto pt-4 text-center relative z-10">
    <div className="signature-area w-64 mx-auto border-t-2 border-slate-900 pt-2 mb-2">
      <p className="text-[10px] font-black uppercase tracking-widest">{t('managerSignature')}</p>
    </div>
    <p className="text-[9px] text-slate-400 italic">{t('officialSealNotice')}</p>
  </div>

 <div className="absolute bottom-4 left-0 right-0 text-center">
 <p className="text-label text-slate-300">{pdfSettings.footerText}</p>
 </div>
 </div>
 </div>
 );
};

export default ClassExamReportPrint;

