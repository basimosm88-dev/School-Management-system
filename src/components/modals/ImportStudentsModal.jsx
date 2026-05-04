import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ImportStudentsModal = ({ onClose, onImport, classes, existingStudents }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const templateData = [
      { full_name: 'Ahmed Ali Hassan', phone_number: '252615000000', class: classes[0]?.name || 'Grade 1 - A' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setErrors([]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setImportResult(null);
      setErrors([]);
    }
  };

  const startImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const validRows = [];
      const errorRows = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +1 for 0-index, +1 for header
        const fullName = row.full_name?.toString().trim();
        const phoneNumber = row.phone_number?.toString().trim();
        const className = row.class?.toString().trim();

        let rowError = null;

        if (!fullName || !phoneNumber || !className) {
          rowError = "Missing required fields (full_name, phone_number, or class)";
        } else if (existingStudents.some(s => s.phone === phoneNumber) || validRows.some(s => s.phone === phoneNumber)) {
          rowError = "Phone number already exists";
        } else {
          const targetClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
          if (!targetClass) {
            rowError = `Class '${className}' not found`;
          } else {
            validRows.push({
              name: fullName,
              phone: phoneNumber,
              classId: targetClass.id,
              status: 'Active',
              gender: 'Male', 
              parentStatus: 'Both',
              address: { country: 'Somalia', state: '', city: '', neighborhood: '', fullAddress: '' },
              specialConditions: { disability: false, refugee: false },
              responsiblePerson: { name: '', phone1: '', phone2: '' }
            });
          }
        }

        if (rowError) {
          errorRows.push({ row_number: rowNumber, error_reason: rowError });
        }
      });

      if (validRows.length > 0) {
        onImport(validRows);
      }

      setImportResult({
        successCount: validRows.length,
        failCount: errorRows.length
      });
      setErrors(errorRows);
    } catch (err) {
      console.error(err);
      alert("Error reading file. Please ensure it's a valid Excel or CSV file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadErrorReport = () => {
    const ws = XLSX.utils.json_to_sheet(errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "Import_Error_Report.xlsx");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upload_file</span>
            Import Students
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!importResult ? (
            <>
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx, .csv"
                  className="hidden"
                />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div className="text-center">
                  <p className="text-slate-900 dark:text-white font-medium">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Supports .xlsx, .csv</p>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Need a template?</p>
                    <p className="text-xs text-slate-500">Download our pre-formatted file</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="text-primary hover:underline text-sm font-semibold"
                >
                  Download Template
                </button>
              </div>

              {/* Action */}
              <button
                disabled={!file || isProcessing}
                onClick={startImport}
                className="w-full btn-primary h-12 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined">play_arrow</span>
                    Start Import
                  </>
                )}
              </button>
            </>
          ) : (
            /* Result Summary */
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
                <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">Import Completed</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {importResult.successCount} students imported, {importResult.failCount} failed.
                  </p>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Errors found in file:</p>
                  <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
                    {errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-rose-500 px-2 py-1 flex items-start gap-2">
                        <span className="shrink-0">•</span>
                        Row {error.row_number}: {error.error_reason}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={downloadErrorReport}
                    className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Download Error Report
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;
