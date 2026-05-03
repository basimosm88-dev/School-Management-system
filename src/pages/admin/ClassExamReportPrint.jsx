import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const ClassExamReportPrint = () => {
 const { classId, examType } = useParams();
 const { students, classes, exams } = useData();
 const { schoolSettings, pdfSettings } = useSettings();

 const currentClass = classes.find(c => c.id === parseInt(classId));
 const classStudents = students.filter(s => s.classId === parseInt(classId));

 useEffect(() => {
 const timer = setTimeout(() => {
 window.print();
 }, 1000);
 return () => clearTimeout(timer);
 }, []);

 if (!currentClass || classStudents.length === 0) {
 return <div className="p-10 text-center font-serif text-rose-500">No data found for this class.</div>;
 }

 // Get all unique subjects for this class and exam type
 const classExams = exams.filter(e => 
 e.classId === parseInt(classId) && 
 e.examType === examType && 
 e.status === 'PUBLISHED'
 );

 const uniqueSubjects = [...new Set(classExams.map(e => e.subjectName))].sort();

 return (
 <div className="bg-white min-h-screen font-serif text-slate-900">
 <style>
 {`
 @media print {
 @page { margin: 1cm; size: A4 landscape; }
 body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
 .no-print { display: none !important; }
 .print-container { width: 100% !important; margin: 0 !important; border: none !important; }
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
 Print Class Report
 </button>
 </div>

 <div className="print-container max-w-[297mm] mx-auto p-12 bg-white relative border-2 border-slate-900 my-8">
 
 {/* WATERMARK */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-12 whitespace-nowrap z-0">
 <h1 className="text-display">{schoolSettings.name} Official Document</h1>
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
 <div className="text-right">
 <h3 className="text-section">{examType} Summary</h3>
 <p className="text-label text-slate-500/80 mt-1">Class: {currentClass.name}</p>
 <p className="text-label text-slate-500/80">Date: {new Date().toLocaleDateString()}</p>
 </div>
 </div>

 <div className="mb-10 text-center relative z-10">
 <h1 className="text-display text-slate-900 border-y-2 border-slate-900 py-4">
 Master Grade Sheet — {currentClass.name}
 </h1>
 </div>

 {/* MASTER TABLE */}
 <div className="relative z-10 overflow-x-auto mb-12">
 <table className="w-full border-collapse border-2 border-slate-900">
 <thead>
 <tr className="bg-slate-900 text-white">
 <th className="border border-slate-700 px-4 py-4 text-label text-left sticky left-0 bg-slate-900 z-20">Student Name</th>
 {uniqueSubjects.map(sub => (
 <th key={sub} className="border border-slate-700 px-2 py-4 text-label text-center min-w-[80px]">
 {sub}
 </th>
 ))}
 <th className="border border-slate-700 px-4 py-4 text-label text-center bg-slate-800">Total Avg.</th>
 </tr>
 </thead>
 <tbody>
 {classStudents.map((student, sIdx) => {
 const studentExams = classExams.filter(e => e.studentId === student.id);
 let totalScore = 0;
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
 totalScore += score;
 count++;
 }
 return (
 <td key={sub} className="border border-slate-300 px-2 py-4 text-center text-label">
 {score !== null ? `${score}%` : '-'}
 </td>
 );
 })}
 <td className="border border-slate-900 px-4 py-4 text-center text-label bg-slate-100">
 {count > 0 ? (totalScore / count).toFixed(1) + '%' : '0.0%'}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

  {/* FOOTER / SIGNATURES */}
  <div className="mt-auto pt-12 text-center relative z-10">
    <div className="signature-area w-64 mx-auto border-t-2 border-slate-900 pt-2 mb-4">
      <p className="text-[10px] font-black uppercase tracking-widest">Manager's Signature</p>
    </div>
    <p className="text-[9px] text-slate-400 italic">Official School Seal Required. This document remains valid for administrative purposes in the absence of a physical seal.</p>
  </div>

 <div className="absolute bottom-4 left-0 right-0 text-center">
 <p className="text-label text-slate-300">{pdfSettings.footerText}</p>
 </div>
 </div>
 </div>
 );
};

export default ClassExamReportPrint;
