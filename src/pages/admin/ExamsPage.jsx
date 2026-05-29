import React, { useState, useMemo, useEffect, useRef } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import * as XLSX from 'xlsx';

const AdminExamsPage = () => {
  const { 
    classes, subjects, students, teachers, exams, 
    saveExamResults, updateExamStatus, calculateRankings, calculatePromotion,
    promotionSettings, setPromotionSettings, promotions,
    saveExamReleaseSchedule
  } = useData();
  const { t } = useSettings();
  const { currentUser } = useAppContext();

  const [activeTab, setActiveTab] = useState('review');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Midterm');
  const [viewingSubmission, setViewingSubmission] = useState(null);

  // Excel Import States
  const [importClassId, setImportClassId] = useState('');
  const [importExamType, setImportExamType] = useState('Midterm');
  const [importStatus, setImportStatus] = useState('APPROVED');
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [parsedRows, setParsedRows] = useState([]);
  const [importFinished, setImportFinished] = useState(false);

  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    if (!importClassId) return alert("Please select a class first.");
    const selectedClass = classes.find(c => String(c.id) === String(importClassId));
    if (!selectedClass) return;

    const classStudents = students.filter(s => String(s.classId) === String(importClassId));
    const subjectsList = selectedClass.subjects || [];

    const templateData = classStudents.map(student => {
      const row = { "Student Name": student.name };
      subjectsList.forEach(sub => {
        row[sub.name] = "";
      });
      row["Total"] = "";
      row["Average"] = "";
      row["Status"] = "";
      return row;
    });

    if (templateData.length === 0) {
      const row = { "Student Name": "Ahmed Ali Hassan" };
      subjectsList.forEach(sub => {
        row[sub.name] = "";
      });
      row["Total"] = "";
      row["Average"] = "";
      row["Status"] = "";
      templateData.push(row);
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Results Template");
    XLSX.writeFile(wb, `${selectedClass.name}_${importExamType}_Template.xlsx`);
  };

  const parseExcel = async (file) => {
    if (!file || !importClassId) return;
    setIsImporting(true);
    setImportErrors([]);
    setImportWarnings([]);
    setParsedRows([]);
    setImportFinished(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const selectedClass = classes.find(c => String(c.id) === String(importClassId));
      const classStudents = students.filter(s => String(s.classId) === String(importClassId));
      const subjectsList = selectedClass?.subjects || [];
      const examMaxScore = importExamType === 'Midterm' ? 40 : 60;

      const validRows = [];
      const errors = [];
      const warnings = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +1 for 0-index, +1 for header

        // Normalize keys case-insensitively and space-insensitively
        const normalized = {};
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().replace(/[\s_-]+/g, '');
            normalized[normalizedKey] = row[key];
          });
        }

        const studentNameVal = (normalized["studentname"] || normalized["name"])?.toString().trim();
        if (!studentNameVal) {
          errors.push({ rowNumber, error: "Missing Student Name column or student name is empty." });
          return;
        }

        // Match student case-insensitively
        const student = classStudents.find(s => s.name.toLowerCase().trim() === studentNameVal.toLowerCase());
        if (!student) {
          errors.push({ rowNumber, error: `Student "${studentNameVal}" not found in class "${selectedClass?.name}".` });
          return;
        }

        // Parse subject scores
        const subjectScores = {};
        let rowHasError = false;
        let sumCalculated = 0;
        let subjectsWithGradesCount = 0;

        subjectsList.forEach(sub => {
          const subKey = sub.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          // Find a key in normalized that matches or contains subKey
          const matchedKey = Object.keys(normalized).find(k => {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanK === subKey) return true;
            // Fuzzy match: check if one contains the other, ensuring length check to avoid false positives
            if (cleanK.includes(subKey)) return true;
            if (cleanK.length >= 3 && subKey.includes(cleanK)) return true;
            return false;
          });
          const scoreVal = matchedKey ? normalized[matchedKey] : undefined;
          
          if (scoreVal !== undefined && scoreVal !== null && scoreVal.toString().trim() !== '') {
            const numScore = parseFloat(scoreVal);
            if (isNaN(numScore) || numScore < 0 || numScore > examMaxScore) {
              errors.push({ 
                rowNumber, 
                error: `Invalid score for "${sub.name}": Must be a number between 0 and ${examMaxScore}.` 
              });
              rowHasError = true;
            } else {
              subjectScores[sub.name] = numScore;
              sumCalculated += numScore;
              subjectsWithGradesCount++;
            }
          }
        });

        if (rowHasError) return;

        // Perform calculation for comparisons
        const totalPossible = subjectsList.length * examMaxScore;
        const avgPercentageCalculated = totalPossible > 0 ? (sumCalculated / totalPossible) * 100 : 0;
        
        let statusCalculated = "Pending";
        if (subjectsList.length > 0) {
          statusCalculated = avgPercentageCalculated >= (promotionSettings.passingGrade || 50) ? "Success" : "Failed";
        }

        // Compare with sheet columns
        // 1. Compare Total
        const sheetTotalVal = normalized["total"];
        if (sheetTotalVal !== undefined && sheetTotalVal !== null && sheetTotalVal.toString().trim() !== '') {
          const sheetTotal = parseFloat(sheetTotalVal);
          if (!isNaN(sheetTotal) && Math.abs(sheetTotal - sumCalculated) > 0.1) {
            const excelKeys = Object.keys(row).filter(k => !["student name", "total", "average", "status"].includes(k.toLowerCase().trim()));
            const expectedKeys = subjectsList.map(s => s.name);
            warnings.push({
              rowNumber,
              type: "Total Mismatch",
              message: `Student "${studentNameVal}": Excel total is ${sheetTotal}, but calculated total is ${sumCalculated.toFixed(1)}. Excel columns: [${excelKeys.join(', ')}]. Expected subjects: [${expectedKeys.join(', ')}].`
            });
          }
        }

        // 2. Compare Average
        const sheetAverageVal = normalized["average"];
        if (sheetAverageVal !== undefined && sheetAverageVal !== null && sheetAverageVal.toString().trim() !== '') {
          const sheetAverageStr = sheetAverageVal.toString().replace('%', '').trim();
          const sheetAverage = parseFloat(sheetAverageStr);
          if (!isNaN(sheetAverage)) {
            const rawAvgCalculated = subjectsList.length > 0 ? sumCalculated / subjectsList.length : 0;
            const diffPercentage = Math.abs(sheetAverage - avgPercentageCalculated);
            const diffPercentageScaled = Math.abs((sheetAverage * 100) - avgPercentageCalculated);
            const diffRaw = Math.abs(sheetAverage - rawAvgCalculated);
            
            if (diffPercentage > 1.0 && diffPercentageScaled > 1.0 && diffRaw > 1.0) {
              warnings.push({
                rowNumber,
                type: "Average Mismatch",
                message: `Student "${studentNameVal}": Excel average is ${sheetAverageVal}, but calculated average is ${avgPercentageCalculated.toFixed(1)}% (raw average is ${rawAvgCalculated.toFixed(1)}).`
              });
            }
          }
        }

        // 3. Compare Status
        const sheetStatusVal = (normalized["status"] || normalized["outcome"])?.toString().trim().toLowerCase();
        if (sheetStatusVal) {
          const isSheetSuccess = ["success", "pass", "promoted", "passed", "succeed"].includes(sheetStatusVal);
          const isCalculatedSuccess = statusCalculated === "Success";
          
          if (isSheetSuccess !== isCalculatedSuccess) {
            warnings.push({
              rowNumber,
              type: "Status Mismatch",
              message: `Student "${studentNameVal}": Excel status is "${sheetStatusVal}", but calculated status is "${statusCalculated}" (based on passing threshold of ${promotionSettings.passingGrade || 50}%).`
            });
          }
        }

        validRows.push({
          studentId: student.id,
          studentName: student.name,
          subjectScores,
          sumCalculated,
          avgPercentageCalculated,
          statusCalculated
        });
      });

      setImportErrors(errors);
      setImportWarnings(warnings);
      setParsedRows(validRows);
      setImportSuccessCount(validRows.length);
    } catch (err) {
      console.error("Error parsing Excel:", err);
      setImportErrors([{ rowNumber: 0, error: "Failed to parse the file. Please check that it is a valid Excel spreadsheet." }]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0 || !importClassId) return;
    setIsImporting(true);

    try {
      const selectedClass = classes.find(c => String(c.id) === String(importClassId));
      const subjectsList = selectedClass?.subjects || [];

      for (const sub of subjectsList) {
        const subjectGrades = parsedRows.map(row => {
          const gradeVal = row.subjectScores[sub.name];
          if (gradeVal === undefined) return null;
          return {
            studentId: row.studentId,
            grade: gradeVal,
            remarks: ""
          };
        }).filter(Boolean);

        if (subjectGrades.length > 0) {
          await saveExamResults(importExamType, importClassId, sub.name, currentUser?.id, subjectGrades, importStatus);
        }
      }

      setImportFinished(true);
      setParsedRows([]);
      setImportFile(null);
    } catch (err) {
      console.error("Error saving imported grades:", err);
      alert("Failed to save imported results. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

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
 {['Review', 'Release', 'Settings', 'Import Results'].map(tab => (
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
 {[
 { label: 'Before Mid', val: '10%' },
 { label: 'Midterm', val: '30%' },
 { label: 'After Mid', val: '10%' },
 { label: 'Final', val: '50%' }
 ].map(w => (
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

  {/* IMPORT RESULTS TAB */}
  {activeTab === 'import results' && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selection Filters & Upload Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-section text-slate-800 dark:text-slate-200 mb-6">Import Student Results</h3>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-6 text-label text-primary flex items-start gap-2">
            <span className="material-symbols-outlined text-body">info</span>
            <p className="text-xs">
              This import utility supports uploading midterm (max 40) and final (max 60) results for the <strong>2025-2026</strong> academic year.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">Class</label>
              <select
                value={importClassId}
                onChange={e => {
                  setImportClassId(e.target.value);
                  setImportFile(null);
                  setImportErrors([]);
                  setImportWarnings([]);
                  setParsedRows([]);
                  setImportFinished(false);
                }}
                className="form-input-custom w-full bg-transparent dark:bg-slate-800"
              >
                <option value="">Select Class</option>
                {classes.filter(c => c.academicYear === '2025-2026').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-label text-slate-400/80 mb-2 block">Exam Type</label>
              <select
                value={importExamType}
                onChange={e => {
                  setImportExamType(e.target.value);
                  setImportFile(null);
                  setImportErrors([]);
                  setImportWarnings([]);
                  setParsedRows([]);
                  setImportFinished(false);
                }}
                className="form-input-custom w-full bg-transparent dark:bg-slate-800"
              >
                <option value="Midterm">Midterm (Max 40)</option>
                <option value="Final">Final (Max 60)</option>
              </select>
            </div>

            <div>
              <label className="text-label text-slate-400/80 mb-2 block">Import Status</label>
              <select
                value={importStatus}
                onChange={e => setImportStatus(e.target.value)}
                className="form-input-custom w-full bg-transparent dark:bg-slate-800"
              >
                <option value="APPROVED">Approved (Pending Release)</option>
                <option value="PUBLISHED">Published (Immediately Visible)</option>
              </select>
            </div>
          </div>

          {importClassId && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Need a template?</p>
                  <p className="text-[10px] text-slate-500">Download formatted sheet with student names</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Template
              </button>
            </div>
          )}

          {importClassId && (
            <div className="space-y-4">
              <label className="text-label text-slate-400/80 block">Upload completed sheet</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    setImportFile(droppedFile);
                    parseExcel(droppedFile);
                  }
                }}
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const selected = e.target.files[0];
                    if (selected) {
                      setImportFile(selected);
                      parseExcel(selected);
                    }
                  }}
                  accept=".xlsx, .csv"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {importFile ? importFile.name : 'Click or drag and drop spreadsheet'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Supports .xlsx, .csv formats</p>
                </div>
              </div>
            </div>
          )}

          {parsedRows.length > 0 && importErrors.length === 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={isImporting}
                onClick={handleImportSubmit}
                className="w-full btn-primary h-12 rounded-xl flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-body">save_alt</span>
                    Import {importSuccessCount} Student Records
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Error Log Sidebar */}
      <div className="space-y-6">
        {/* Validation Errors Panel */}
        {importErrors.length > 0 && (
          <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/20 p-6">
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-body">error</span>
              Validation Errors ({importErrors.length})
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {importErrors.map((err, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900/30 text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Row {err.rowNumber}:</span> {err.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Warnings Panel */}
        {importWarnings.length > 0 && (
          <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/20 p-6">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-body">warning</span>
              Excel Mismatch Warnings ({importWarnings.length})
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {importWarnings.map((warn, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/30 text-xs">
                  <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between mb-1">
                    <span>{warn.type}</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300">Row {warn.rowNumber}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{warn.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success / Status Panel */}
        {importFinished && (
          <div className="bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 p-6 text-center">
            <span className="material-symbols-outlined text-emerald-500 text-display mb-3">check_circle</span>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Import Completed Successfully</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Successfully imported grades for {importSuccessCount} students in {importExamType}.
            </p>
            <button
              onClick={() => {
                setImportFile(null);
                setParsedRows([]);
                setImportFinished(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Start New Import
            </button>
          </div>
        )}

        {parsedRows.length > 0 && importErrors.length === 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-205 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Import Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Students to update:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{parsedRows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exam Type:</span>
                <span className="font-bold text-primary">{importExamType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Upload Status:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{importStatus}</span>
              </div>
              {importWarnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg mt-3 text-[11px] leading-relaxed">
                  ⚠️ Note: There are {importWarnings.length} mismatch warnings. You can still proceed with importing, and the system will recalculate and save the correct grades to the database.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )}
  </div>
 </PageLayout>
 );
};

export default AdminExamsPage;
