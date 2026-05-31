import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

const ManagePublishStatusModal = ({ onClose, student, currentClass }) => {
  const { exams, updateGradePublishStatus } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const academicYear = currentClass?.academicYear || '2025-2026';
  const is2526 = academicYear === '2025-2026';
  const examTypes = is2526 ? ['Midterm', 'Final'] : ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

  // State to hold status updates: 
  // { [gradeId]: { isWithheld: boolean, reason: string, subjectName: string, examType: string, score: number } }
  const [publishStates, setPublishStates] = useState({});

  useEffect(() => {
    const initialStates = {};
    const subjectsList = (currentClass?.subjects || []).map(s => s.name);

    subjectsList.forEach(sub => {
      examTypes.forEach(type => {
        // Find existing grade record in exams
        const record = exams.find(e => 
          String(e.studentId) === String(student.id) &&
          String(e.classId) === String(currentClass.id) &&
          e.subjectName.toLowerCase() === sub.toLowerCase() &&
          e.examType === type
        );
        
        if (record) {
          initialStates[record.id] = {
            isWithheld: record.status === 'WITHHELD',
            reason: record.remarks || '',
            subjectName: sub,
            examType: type,
            score: record.grade
          };
        }
      });
    });
    setPublishStates(initialStates);
  }, [exams, student, currentClass, examTypes]);

  const handleToggle = (gradeId, value) => {
    setPublishStates(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        isWithheld: value
      }
    }));
  };

  const handleReasonChange = (gradeId, value) => {
    setPublishStates(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        reason: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      // Loop over publishStates and update each
      for (const [gradeId, state] of Object.entries(publishStates)) {
        // Find original record in exams to see if anything changed
        const original = exams.find(e => String(e.id) === String(gradeId));
        const originalWithheld = original?.status === 'WITHHELD';
        const originalReason = original?.remarks || '';
        
        if (state.isWithheld !== originalWithheld || state.reason !== originalReason) {
          await updateGradePublishStatus(gradeId, state.isWithheld, state.reason);
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update publish statuses. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasGrades = Object.keys(publishStates).length > 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility_off</span>
              Manage Result Publishing
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Student: <span className="font-bold text-slate-700 dark:text-slate-300">{student?.name}</span> | Class: <span className="font-bold text-slate-700 dark:text-slate-300">{currentClass?.name}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
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

          {!hasGrades ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-300 dark:text-slate-700">info</span>
              <p className="text-sm font-semibold">No grades entered yet.</p>
              <p className="text-xs text-slate-400 mt-1">You can only withhold or manage publishing for entered grades.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(publishStates).map(([gradeId, state]) => (
                <div 
                  key={gradeId} 
                  className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-label text-slate-900 dark:text-white font-bold">{state.subjectName}</span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md uppercase tracking-wider">{state.examType}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Grade Score: <span className="font-semibold text-primary">{state.score}%</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[280px]">
                    {/* Publish Switch / Toggle */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {state.isWithheld ? (
                          <>
                            <span className="material-symbols-outlined text-amber-500 text-sm">lock</span>
                            Withheld from Student
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-emerald-500 text-sm">visibility</span>
                            Published to Student
                          </>
                        )}
                      </span>
                      
                      {/* Toggle Switch Button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(gradeId, !state.isWithheld)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          state.isWithheld ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            state.isWithheld ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Reason Input (only if Withheld) */}
                    {state.isWithheld && (
                      <input
                        type="text"
                        placeholder="Reason (e.g. Unpaid fees)"
                        value={state.reason}
                        onChange={(e) => handleReasonChange(gradeId, e.target.value)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-705 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            disabled={isSaving || !hasGrades}
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

export default ManagePublishStatusModal;
