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
    if (!importClassId) return alert(t('selectClassFirst'));
    const selectedClass = classes.find(c => String(c.id) === String(importClassId));
    if (!selectedClass) return;

    const classStudents = students.filter(s => String(s.classId) === String(importClassId));
    const subjectsList = selectedClass.subjects || [];

    const templateData = classStudents.map(student => {
      const row = { [t('studentName')]: student.name };
      subjectsList.forEach(sub => {
        row[sub.name] = "";
      });
      row[t('total')] = "";
      row[t('average')] = "";
      row[t('status')] = "";
      return row;
    });

    if (templateData.length === 0) {
      const row = { [t('studentName')]: "Ahmed Ali Hassan" };
      subjectsList.forEach(sub => {
        row[sub.name] = "";
      });
      row[t('total')] = "";
      row[t('average')] = "";
      row[t('status')] = "";
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

        const studentNameVal = (
          normalized["studentname"] || 
          normalized["name"] || 
          normalized[t('studentName').toLowerCase().replace(/[\s_-]+/g, '')]
        )?.toString().trim();
        if (!studentNameVal) {
          errors.push({ rowNumber, error: t('studentName') + " column is missing or empty." });
          return;
        }

        // Match student robustly
        const cleanName = studentNameVal.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        let student = classStudents.find(s => {
          const dbClean = s.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          return dbClean === cleanName;
        });

        // Try substring match (e.g., sheet has "Caaisha Cabdi" but database has "Caaisha Cabdi Ibraahim")
        if (!student) {
          const substringMatches = classStudents.filter(s => {
            const dbClean = s.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            return dbClean.includes(cleanName) || cleanName.includes(dbClean);
          });
          if (substringMatches.length === 1) {
            student = substringMatches[0];
          }
        }

        // Try word order/subset match (e.g., sheet has "Caaisha Ibraahim" but database has "Caaisha Cabdi Ibraahim")
        if (!student) {
          const sheetWords = cleanName.split(' ');
          const subsetMatches = classStudents.filter(s => {
            const dbClean = s.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            const dbWords = dbClean.split(' ');
            let dbIdx = 0;
            let matchCount = 0;
            for (const word of sheetWords) {
              while (dbIdx < dbWords.length) {
                if (dbWords[dbIdx] === word) {
                  matchCount++;
                  dbIdx++;
                  break;
                }
                dbIdx++;
              }
            }
            return matchCount === sheetWords.length;
          });
          if (subsetMatches.length === 1) {
            student = subsetMatches[0];
          }
        }

        if (!student) {
          errors.push({ rowNumber, error: `${t('student')} "${studentNameVal}" not found in class "${selectedClass?.name}".` });
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
        const sheetTotalVal = normalized["total"] || normalized[t('total').toLowerCase().replace(/[\s_-]+/g, '')];
        if (sheetTotalVal !== undefined && sheetTotalVal !== null && sheetTotalVal.toString().trim() !== '') {
          const sheetTotal = parseFloat(sheetTotalVal);
          if (!isNaN(sheetTotal) && Math.abs(sheetTotal - sumCalculated) > 0.1) {
            const excelKeys = Object.keys(row).filter(k => ![t('studentName').toLowerCase(), t('total').toLowerCase(), t('average').toLowerCase(), t('status').toLowerCase(), "student name", "total", "average", "status"].includes(k.toLowerCase().trim()));
            const expectedKeys = subjectsList.map(s => s.name);
            warnings.push({
              rowNumber,
              type: "Total Mismatch",
              message: `Student "${studentNameVal}": Excel total is ${sheetTotal}, but calculated total is ${sumCalculated.toFixed(1)}. Excel columns: [${excelKeys.join(', ')}]. Expected subjects: [${expectedKeys.join(', ')}].`
            });
          }
        }

        // 2. Compare Average
        const sheetAverageVal = normalized["average"] || normalized[t('average').toLowerCase().replace(/[\s_-]+/g, '')];
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
        const sheetStatusVal = (
          normalized["status"] || 
          normalized["outcome"] || 
          normalized[t('status').toLowerCase().replace(/[\s_-]+/g, '')]
        )?.toString().trim().toLowerCase();
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
      alert(t('failedToSaveResults'));
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
    if (!settings.date || !settings.time) return alert(t('pleaseSetDateTime') + examType);
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
    {[
      { id: 'review', label: t('review') },
      { id: 'release', label: t('release') },
      { id: 'settings', label: t('settings') },
      { id: 'import results', label: t('importResults') }
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`px-8 py-3 rounded-lg text-label   transition-all ${
          activeTab === tab.id 
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
            : 'text-slate-500/80 hover:text-slate-700 dark:text-slate-400/80 dark:hover:text-slate-200'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>

 {/* REVIEW TAB */}
 {activeTab === 'review' && (
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors min-h-[400px]">
 <div className="p-8 border-b border-slate-100 dark:border-slate-800">
 <h3 className="text-section text-slate-800 dark:text-slate-200">{t('pendingApprovals')}</h3>
 </div>
 {pendingSubmissions.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[400px] text-slate-400/80">
 <span className="material-symbols-outlined text-display mb-4 opacity-20">fact_check</span>
 <p className="text-label">{t('noPendingSubmissions')}</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label">
 <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-400/80 text-label border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-8 py-5">{t('classSubject')}</th>
 <th className="px-8 py-5">{t('examType')}</th>
 <th className="px-8 py-5">{t('submittedBy')}</th>
 <th className="px-8 py-5 text-right">{t('actions')}</th>
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
 {t('view')}
 </button>
 <button 
 onClick={() => handleReject(sub)}
 className="px-4 py-2 bg-rose-50 text-rose-600 text-label rounded-lg border border-rose-100 hover:bg-rose-100 transition-all"
 >{t('reject')}</button>
 <button 
 onClick={() => handleApprove(sub)}
 className="px-4 py-2 bg-emerald-50 text-emerald-600 text-label rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all"
 >{t('approve')}</button>
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
 <th className="px-6 py-4 rounded-l-xl">{t('student')}</th>
 <th className="px-6 py-4">{t('grade')}</th>
 <th className="px-6 py-4 rounded-r-xl">{t('remarks')}</th>
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
  {t('close')}
  </button>
  <button 
  onClick={() => { handleApprove(viewingSubmission); setViewingSubmission(null); }}
  className="btn-success"
  >
  <span className="btn-icon">check_circle</span>
  {t('approveSubmission')}
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
 <h3 className="text-label text-slate-800 dark:text-slate-200">{t('approvedForRelease')}</h3>
 <p className="text-label text-slate-400/80 mt-1">{t('approvedReleaseDesc')}</p>
 </div>
 </div>
 {releasableExams.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[300px] text-slate-400/80">
 <p className="text-label">{t('noApprovedExamsPending')}</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-label">
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {releasableExams.map((exam, i) => (
 <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-8 py-5">
 <div className="text-slate-800 dark:text-slate-200">{exam.className}</div>
 <div className="text-label text-slate-400/80">{t(exam.examType.toLowerCase())} {t('results')}</div>
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
 >{t('publishNow')}</button>
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
 <h3 className="text-label text-slate-800 dark:text-slate-200 mb-6">{t('scheduleExam').replace('{type}', t(type.toLowerCase()))}</h3>
 <div className="space-y-6">
 <div>
 <label className="text-label text-slate-400/80 mb-2 block">{t('releaseDate')}</label>
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
 <label className="text-label text-slate-400/80 mb-2 block">{t('releaseTime')}</label>
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
 {t('scheduleApproved').replace('{date}', examReleaseSettings[type].date).replace('{time}', examReleaseSettings[type].time)}
 </p>
 </div>
 ) : (
 <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
 <p className="text-label text-amber-600 dark:text-amber-400 leading-relaxed">
 {t('schedulePendingNotice')}
 </p>
 </div>
 )}

 <button 
 onClick={() => handleScheduleRelease(type)}
 disabled={examReleaseSettings[type].isApproved || !examReleaseSettings[type].date || !examReleaseSettings[type].time}
 className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-label rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
 >
 {examReleaseSettings[type].isApproved ? t('scheduleApprovedBtn') : t('approveSchedule')}
 </button>
 
 {examReleaseSettings[type].isApproved && (
 <button 
 onClick={() => saveExamReleaseSchedule(type, examReleaseSettings[type].date, examReleaseSettings[type].time, false)}
 className="w-full py-2 text-rose-500 text-label hover:underline"
 >
 {t('cancelOrEditSchedule')}
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
 <h3 className="text-label text-slate-800 dark:text-slate-200 mb-8">{t('promotionRules')}</h3>
 <div className="space-y-8">
 <div>
 <label className="text-label text-slate-400/80 mb-3 block">{t('minPassingGrade')}</label>
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
 <label className="text-label text-slate-400/80 mb-3 block">{t('subjectsRequiredToPass')}</label>
 <input 
 type="number" 
 value={promotionSettings.minSubjects}
 onChange={e => setPromotionSettings({...promotionSettings, minSubjects: parseInt(e.target.value)})}
 className="form-input-custom w-32"
 />
 <p className="text-label text-slate-400/80 mt-2">{t('maxFailedSubjectsDesc')}</p>
 </div>
 <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
 <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
 <h4 className="text-label text-slate-800 dark:text-slate-200 mb-4">{t('weightageBreakdown')}</h4>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: t('beforeMidTen'), val: '10%' },
 { label: t('midtermThirty'), val: '30%' },
 { label: t('afterMidTen'), val: '10%' },
 { label: t('finalFifty'), val: '50%' }
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
          <h3 className="text-section text-slate-800 dark:text-slate-200 mb-6">{t('importStudentResults')}</h3>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-6 text-label text-primary flex items-start gap-2">
            <span className="material-symbols-outlined text-body">info</span>
            <p className="text-xs">
              {t('importUtilityDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('class')}</label>
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
                <option value="">{t('selectClass')}</option>
                {classes.filter(c => c.academicYear === '2025-2026').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('examType')}</label>
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
                className="form-input-custom w-full bg-transparent dark:bg-slate-850"
              >
                <option value="Midterm">{t('midtermMaxForty')}</option>
                <option value="Final">{t('finalMaxSixty')}</option>
              </select>
            </div>

            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('importStatus')}</label>
              <select
                value={importStatus}
                onChange={e => setImportStatus(e.target.value)}
                className="form-input-custom w-full bg-transparent dark:bg-slate-850"
              >
                <option value="APPROVED">{t('approvedPendingRelease')}</option>
                <option value="PUBLISHED">{t('publishedImmediatelyVisible')}</option>
              </select>
            </div>
          </div>

          {importClassId && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-205 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{t('needTemplate')}</p>
                  <p className="text-[10px] text-slate-500">{t('downloadTemplateDesc')}</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {t('downloadTemplate')}
              </button>
            </div>
          )}

          {importClassId && (
            <div className="space-y-4">
              <label className="text-label text-slate-400/80 block">{t('uploadCompletedSheet')}</label>
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
                    {importFile ? importFile.name : t('clickDragDropSpreadsheet')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t('supportsFormats')}</p>
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
                    {t('importStudentRecordsBtn').replace('{count}', importSuccessCount)}
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
              {t('validationErrors').replace('{count}', importErrors.length)}
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {importErrors.map((err, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900/30 text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">{t('row')} {err.rowNumber}:</span> {err.error}
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
              {t('excelMismatchWarnings').replace('{count}', importWarnings.length)}
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {importWarnings.map((warn, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/30 text-xs">
                  <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between mb-1">
                    <span>{warn.type}</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300">{t('row')} {warn.rowNumber}</span>
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
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">{t('importCompletedSuccess')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t('importCompletedDesc').replace('{count}', importSuccessCount).replace('{examType}', t(importExamType.toLowerCase()))}
            </p>
            <button
              onClick={() => {
                setImportFile(null);
                setParsedRows([]);
                setImportFinished(false);
              }}
              className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              {t('startNewImport')}
            </button>
          </div>
        )}

        {parsedRows.length > 0 && importErrors.length === 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-205 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{t('importSummary')}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('studentsToUpdate')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{parsedRows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('examType')}:</span>
                <span className="font-bold text-primary">{t(importExamType.toLowerCase())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('uploadStatusLabel')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{importStatus}</span>
              </div>
              {importWarnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg mt-3 text-[11px] leading-relaxed">
                  {t('importWarningsNotice').replace('{count}', importWarnings.length)}
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
