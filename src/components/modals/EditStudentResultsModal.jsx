import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';

const getExamMaxScore = (examType, academicYear) => {
  if (academicYear === '2025-2026') {
    if (examType === 'Midterm') return 40;
    if (examType === 'Final') return 60;
    return 100;
  }
  if (examType === 'Before Midterm') return 10;
  if (examType === 'Midterm') return 30;
  if (examType === 'After Midterm') return 10;
  if (examType === 'Final') return 50;
  return 100;
};

const EditStudentResultsModal = ({ onClose, student, currentClass, subjectName = null }) => {
  const { exams, updateStudentSubjectScores, updateStudentAllScores } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const academicYear = currentClass?.academicYear || '2025-2026';
  const is2526 = academicYear === '2025-2026';

  const examTypes = useMemo(() => {
    if (is2526) {
      return ['Midterm', 'Final'];
    }
    return ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];
  }, [is2526]);

  const subjectsList = useMemo(() => {
    if (subjectName) {
      return [subjectName];
    }
    return (currentClass?.subjects || []).map(s => s.name);
  }, [currentClass, subjectName]);

  // State to hold all scores: { [subjectName]: { [examType]: score } }
  const [scores, setScores] = useState({});

  useEffect(() => {
    // Initialize scores from the existing exams/grades state
    const initialScores = {};
    subjectsList.forEach(sub => {
      initialScores[sub] = {};
      examTypes.forEach(type => {
        const record = exams.find(e => 
          String(e.studentId) === String(student.id) &&
          String(e.classId) === String(currentClass.id) &&
          e.subjectName.toLowerCase() === sub.toLowerCase() &&
          e.examType === type
        );
        initialScores[sub][type] = record ? record.grade : '';
      });
    });
    setScores(initialScores);
  }, [exams, student, currentClass, subjectsList, examTypes]);

  const handleScoreChange = (subject, examType, value) => {
    const maxVal = getExamMaxScore(examType, academicYear);
    
    if (value === '') {
      setScores(prev => ({
        ...prev,
        [subject]: {
          ...prev[subject],
          [examType]: ''
        }
      }));
      return;
    }

    const val = parseFloat(value);
    if (isNaN(val)) return;

    // Cap the score at the max value and clamp to min 0
    let finalVal = val;
    if (val > maxVal) {
      finalVal = maxVal;
    } else if (val < 0) {
      finalVal = 0;
    }

    setScores(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [examType]: finalVal
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');

    try {
      if (subjectName) {
        // Edit only single subject
        const subjectChanges = scores[subjectName] || {};
        await updateStudentSubjectScores(student.id, currentClass.id, subjectName, subjectChanges);
      } else {
        // Edit all subjects
        await updateStudentAllScores(student.id, currentClass.id, scores);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save student scores. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_square</span>
              Edit Student Scores
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Student: <span className="font-bold text-slate-700 dark:text-slate-350">{student?.name}</span> | Class: <span className="font-bold text-slate-700 dark:text-slate-355">{currentClass?.name}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            disabled={isSaving}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-450 rounded-xl border border-rose-100 dark:border-rose-900/30 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            {subjectsList.map((subject) => (
              <div 
                key={subject} 
                className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800"
              >
                <h4 className="text-label text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                  <span className="material-symbols-outlined text-primary text-body">auto_stories</span>
                  {subject}
                </h4>

                <div className={`grid gap-4 ${is2526 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {examTypes.map((type) => {
                    const maxVal = getExamMaxScore(type, academicYear);
                    const currentVal = scores[subject]?.[type] ?? '';

                    return (
                      <div key={type} className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                          {type}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={maxVal}
                            step="any"
                            value={currentVal}
                            onChange={(e) => handleScoreChange(subject, type, e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="--"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                            / {maxVal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {subjectsList.length === 0 && (
              <p className="text-slate-400 text-center py-10">No subjects registered for this class.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl shrink-0">
          <button 
            onClick={onClose}
            className="btn-secondary py-2.5 px-6"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="btn-primary py-2.5 px-8 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-section">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentResultsModal;
