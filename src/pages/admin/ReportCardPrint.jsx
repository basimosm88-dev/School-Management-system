import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';

const ReportCardPrint = () => {
 const { studentId } = useParams();
 const { currentUser } = useAppContext();
 const { getReportCardData, classes } = useData();
 const { schoolSettings, pdfSettings, academicSettings } = useSettings();

 const data = useMemo(() => getReportCardData(studentId), [studentId, getReportCardData]);
 const isManagementView = currentUser?.role === 'admin' || currentUser?.role === 'teacher';
 const studentClass = classes.find(c => c.id === data.student?.classId);

 if (!data.student) return <div className="p-10 text-center text-rose-500">Student record not found</div>;

 const academicYear = `2026 - 2027`; 

 return (
 <div className="bg-white min-h-screen p-10 font-serif text-slate-900 print:p-0">
 <style>{`
 @media print {
 body { background: white !important; }
 .no-print { display: none !important; }
 .print-container { padding: 0 !important; width: 100% !important; margin: 0 !important; }
 @page { margin: 2cm; }
 }
 @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
 .font-serif { font-family: 'Playfair Display', serif; }
 `}</style>

 {/* NO PRINT ACTIONS */}
 <div className="no-print mb-10 flex justify-between items-center bg-slate-900 p-6 rounded-2xl shadow-2xl">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
 <span className="material-symbols-outlined">description</span>
 </div>
 <div>
 <h1 className="text-white text-label uppercase">Student Profile Record</h1>
 <p className="text-slate-400/80 text-label">Official Student Record - ID: {studentId}</p>
 </div>
 </div>
 <button 
 onClick={() => window.print()}
 className="px-8 py-3 bg-primary text-white text-label rounded-xl hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-primary/20"
 >
 <span className="material-symbols-outlined text-section">print</span>
 Print Official Report
 </button>
 </div>

 {/* REPORT CONTAINER */}
 <div className="print-container max-w-4xl mx-auto border-2 border-slate-900 p-12 bg-white relative">
 
 {/* HEADER */}
 <div className="flex justify-between items-center border-b-4 border-slate-900 pb-10 mb-10">
 <div className="flex items-center gap-6">
 {pdfSettings.showLogo && (
 <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-slate-900 overflow-hidden">
 {schoolSettings.logo ? (
 <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
 ) : (
 <span className="material-symbols-outlined text-display text-slate-900">school</span>
 )}
 </div>
 )}
 <div>
 <h2 className="text-display text-slate-900">{schoolSettings.name}</h2>
 <p className="text-label text-slate-500/80 mt-1 uppercase">{schoolSettings.address}</p>
 </div>
 </div>
 <div className="text-right">
 <h3 className="text-section uppercase">Student Profile Record</h3>
 <p className="text-label text-slate-500/80 mt-1">Ref: {new Date().getFullYear()}/EX-{studentId}</p>
 <p className="text-label text-slate-500/80">Date: {new Date().toLocaleDateString()}</p>
 </div>
 </div>

 {/* STUDENT INFO */}
 <div className="grid grid-cols-2 gap-10 mb-12">
 <div className="space-y-4">
 <div className="flex border-b border-slate-200 pb-2">
 <span className="w-32 text-label text-slate-400/80 uppercase">Student Name</span>
 <span className="flex-1 text-label">{data.student.name}</span>
 </div>
 <div className="flex border-b border-slate-200 pb-2">
 <span className="w-32 text-label text-slate-400/80 uppercase">Class Record</span>
 <span className="flex-1 text-label">{studentClass?.name || 'N/A'}</span>
 </div>
 </div>
 <div className="space-y-4">
 <div className="flex border-b border-slate-200 pb-2">
 <span className="w-32 text-label text-slate-400/80 uppercase">Academic Year</span>
 <span className="flex-1 text-label">2026 - 2027</span>
 </div>
 <div className="flex border-b border-slate-200 pb-2">
 <span className="w-32 text-label text-slate-400/80 uppercase">Report Type</span>
 <span className="flex-1 text-label">Full Annual Report</span>
 </div>
 </div>
 </div>

 {/* RESULTS TABLE */}
 <table className="w-full border-collapse mb-12">
 <thead>
 <tr className="bg-slate-900 text-white">
 <th className="border border-slate-900 px-4 py-4 text-label text-left uppercase">Subject</th>
 <th className="border border-slate-900 px-2 py-4 text-label text-center w-20">Before Mid ({academicSettings.examWeights.beforeMidterm}%)</th>
 <th className="border border-slate-900 px-2 py-4 text-label text-center w-20">Midterm ({academicSettings.examWeights.midterm}%)</th>
 <th className="border border-slate-900 px-2 py-4 text-label text-center w-20">After Mid ({academicSettings.examWeights.afterMidterm}%)</th>
 <th className="border border-slate-900 px-2 py-4 text-label text-center w-20">Final ({academicSettings.examWeights.final}%)</th>
 <th className="border border-slate-900 px-2 py-4 text-label text-center bg-slate-800 w-24">Weighted Avg.</th>
 </tr>
 </thead>
 <tbody>
 {Object.keys(data.results).map(subject => (
 <tr key={subject} className="border-b border-slate-200">
 <td className="border border-slate-300 px-4 py-4 text-label uppercase">{subject}</td>
 <td className="border border-slate-300 px-2 py-4 text-center text-label">{data.results[subject]["Before Midterm"]}</td>
 <td className="border border-slate-300 px-2 py-4 text-center text-label">{data.results[subject]["Midterm"]}</td>
 <td className="border border-slate-300 px-2 py-4 text-center text-label">{data.results[subject]["After Midterm"]}</td>
 <td className="border border-slate-300 px-2 py-4 text-center text-label">{data.results[subject]["Final"]}</td>
 <td className="border border-slate-900 px-2 py-4 text-center text-label bg-slate-100">{data.results[subject].average}%</td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* SUMMARY SECTION */}
 <div className="grid grid-cols-3 gap-8 mb-20">
 <div className="p-6 bg-slate-100 border border-slate-200 rounded-xl text-center">
 <p className="text-label text-slate-400/80 mb-2 uppercase">Total Average</p>
 <p className="text-display text-slate-900">
 {(Object.values(data.results).reduce((acc, curr) => acc + parseFloat(curr.average), 0) / Object.keys(data.results).length || 0).toFixed(1)}%
 </p>
 </div>
 <div className="p-6 bg-slate-100 border border-slate-200 rounded-xl text-center">
 <p className="text-label text-slate-400/80 mb-2 uppercase">Class Ranking</p>
 <p className="text-display text-primary">#{data.rank}</p>
 </div>
 <div className="p-6 bg-slate-900 rounded-xl text-center shadow-xl">
 <p className="text-label text-slate-400/80 mb-2 uppercase">Annual Decision</p>
 <p className="text-section text-white uppercase">{data.promotion}</p>
 </div>
 </div>

 {/* FOOTER / SIGNATURES */}
 {isManagementView && (
 <div className={`grid ${schoolSettings.managerSignature ? 'grid-cols-3' : 'grid-cols-2'} gap-10 pt-20 relative z-10`}>
 <div className="text-center">
 <div className="w-full border-b-2 border-slate-900 mb-4 h-12"></div>
 <p className="text-label uppercase text-slate-900">{pdfSettings.principalTitle}</p>
 {pdfSettings.showSignatureLabels && <p className="text-label text-slate-400/80 mt-1">Official School Seal</p>}
 </div>
 {schoolSettings.managerSignature && (
 <div className="text-center">
 <div className="w-full border-b-2 border-slate-900 mb-4 h-12"></div>
 <p className="text-label uppercase text-slate-900">{schoolSettings.managerSignature}</p>
 {pdfSettings.showSignatureLabels && <p className="text-label text-slate-400/80 mt-1">Management Signature</p>}
 </div>
 )}
 <div className="text-center">
 <div className="w-full border-b-2 border-slate-900 mb-4 h-12"></div>
 <p className="text-label uppercase text-slate-900">{pdfSettings.academicManagerTitle}</p>
 {pdfSettings.showSignatureLabels && <p className="text-label text-slate-400/80 mt-1">Exams & Records</p>}
 </div>
 </div>
 )}

 {/* WATERMARK */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-45 whitespace-nowrap">
 <h1 className="text-display">{schoolSettings.name} Official Document</h1>
 </div>
 
 {/* FOOTER TEXT */}
 <div className="absolute bottom-4 left-0 right-0 text-center">
 <p className="text-label text-slate-300">{pdfSettings.footerText}</p>
 </div>
 </div>
 </div>
 );
};
export default ReportCardPrint;
