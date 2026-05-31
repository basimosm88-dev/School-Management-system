import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

const ManagePublishStatusModal = ({ onClose, student, currentClass }) => {
  const { updateStudent } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const academicYear = currentClass?.academicYear || '2025-2026';
  const is2526 = academicYear === '2025-2026';
  const examTypes = is2526 ? ['Midterm', 'Final'] : ['Before Midterm', 'Midterm', 'After Midterm', 'Final'];

  // State to hold withheld status: { [examType]: { isWithheld: boolean, reason: string } }
  const [withheldCycles, setWithheldCycles] = useState({});

  useEffect(() => {
    const initialStates = {};
    const existingWithheld = student?.withheldCycles || {};
    
    examTypes.forEach(type => {
      initialStates[type] = {
        isWithheld: existingWithheld[type]?.isWithheld || false,
        reason: existingWithheld[type]?.reason || ''
      };
    });
    setWithheldCycles(initialStates);
  }, [student, examTypes]);

  const handleToggle = (type, value) => {
    setWithheldCycles(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        isWithheld: value
      }
    }));
  };

  const handleReasonChange = (type, value) => {
    setWithheldCycles(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        reason: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const cleanDetails = { ...student };
      // Remove derived internal mappings not saved in Supabase
      delete cleanDetails.id;
      delete cleanDetails.name;
      delete cleanDetails.role;
      delete cleanDetails.results;
      delete cleanDetails.examAverages;
      delete cleanDetails.displayAverage;
      delete cleanDetails.displayTotal;
      delete cleanDetails.rank;
      delete cleanDetails.status;

      cleanDetails.withheldCycles = withheldCycles;

      await updateStudent(student.id, cleanDetails);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update publishing options. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility_off</span>
              Manage Result Publishing
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Student: <span className="font-bold text-slate-700 dark:text-slate-350">{student?.name}</span> | Class: <span className="font-bold text-slate-700 dark:text-slate-350">{currentClass?.name}</span>
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

          <p className="text-xs text-slate-500 mb-2">
            Configure which examination results are visible to the student. If an exam is withheld, its scores will be hidden from the student and excluded from their averages/rankings.
          </p>

          <div className="space-y-6">
            {examTypes.map((type) => {
              const state = withheldCycles[type] || { isWithheld: false, reason: '' };

              return (
                <div 
                  key={type} 
                  className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-label text-slate-900 dark:text-white font-bold">{type} Assessment</span>
                    
                    {/* Toggle Switch Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(type, !state.isWithheld)}
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

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {state.isWithheld ? (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Withheld from Student
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Published to Student
                      </span>
                    )}
                  </div>

                  {/* Reason Input (only if Withheld) */}
                  {state.isWithheld && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        Reason for Withholding
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Unpaid tuition fees, library fines"
                        value={state.reason}
                        onChange={(e) => handleReasonChange(type, e.target.value)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
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

export default ManagePublishStatusModal;
