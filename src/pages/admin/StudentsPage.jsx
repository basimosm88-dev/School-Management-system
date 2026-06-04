import React, { useState, useMemo, useEffect } from 'react';
// System Version: 1.4.0 - Bulk Student Import Implementation
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import ImportStudentsModal from '../../components/modals/ImportStudentsModal';

const sortClasses = (classesList) => {
  return [...classesList].sort((a, b) => {
    const matchA = a.name.match(/Class\s+(\d+)\s*-\s*([A-Z])/i);
    const matchB = b.name.match(/Class\s+(\d+)\s*-\s*([A-Z])/i);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) {
        return numA - numB;
      }
      return matchA[2].localeCompare(matchB[2]);
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
};

const StudentsPage = () => {
  const { 
    students, classes, addStudent, bulkAddStudents, 
    updateStudent, deleteStudent, addNotification,
    getReportCardData, getStudentAttendanceSummary 
  } = useData();
  const { schoolSettings, t } = useSettings();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classId: '',
    gender: '',
    status: '',
    special: '' // noFather, noMother, disabled, refugee
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Navigation State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [printingClassId, setPrintingClassId] = useState(null);
  const [printingLoginCardsClassId, setPrintingLoginCardsClassId] = useState(null);
  const [selectedExamOption, setSelectedExamOption] = useState('Midterm');
  const [isExamPrintModalOpen, setIsExamPrintModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAppContext();
  const userRole = currentUser?.role || 'admin';

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedClassId && String(student.classId) !== String(selectedClassId)) return false;

      const className = classes.find(c => String(c.id) === String(student.classId))?.name || '';
      const matchesSearch =
        (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.phone || '').includes(searchTerm) ||
        className.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = !filters.classId || String(student.classId) === String(filters.classId);
      const matchesGender = !filters.gender || student.gender === filters.gender;
      const matchesStatus = !filters.status || student.status === filters.status;

      let matchesSpecial = true;
      if (filters.special === 'noFather') matchesSpecial = student.parentStatus === 'No Father';
      else if (filters.special === 'noMother') matchesSpecial = student.parentStatus === 'No Mother';
      else if (filters.special === 'disabled') matchesSpecial = student.specialConditions?.disability;
      else if (filters.special === 'refugee') matchesSpecial = student.specialConditions?.refugee;

      return matchesSearch && matchesClass && matchesGender && matchesStatus && matchesSpecial;
    });
  }, [students, searchTerm, filters, classes, selectedClassId]);

  const availableClasses = useMemo(() => {
    let list = [];
    if (userRole === 'admin') list = classes;
    else if (userRole === 'teacher') {
      const assignedIds = (currentUser?.assignedClasses || []).map(id => String(id));
      list = classes.filter(c => 
        assignedIds.includes(String(c.id)) || 
        String(c.teacherId) === String(currentUser?.id)
      );
    } else {
      list = classes;
    }
    return sortClasses(list);
  }, [classes, userRole, currentUser]);

  // Handlers
  const handleAdd = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student, e) => {
    e.stopPropagation();
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
      addNotification('Student deleted successfully', 'success');
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);
  };

  const handleSave = (studentData) => {
    if (!studentData.classId) {
      addNotification('Please select an assigned class for the student.', 'error');
      return;
    }
    if (studentData.password && !/^\d{6}$/.test(studentData.password)) {
      addNotification('Student password must be exactly 6 numerical digits.', 'error');
      return;
    }
    if (!editingStudent && !studentData.password) {
      addNotification('Password is required for new students.', 'error');
      return;
    }
    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      addNotification('Student record updated successfully', 'success');
    } else {
      addStudent(studentData);
      addNotification('Student registered successfully', 'success');
    }
    setIsFormOpen(false);
  };

  const handleSelectClass = (classId) => {
    setSelectedClassId(classId);
    setViewMode('table');
  };

  const handlePrintClassList = () => {
    setPrintingClassId(selectedClassId);
  };

  const handlePrintLoginCards = (examType) => {
    if (examType) {
      setSelectedExamOption(examType);
    }
    setPrintingLoginCardsClassId(selectedClassId);
  };

  useEffect(() => {
    if (printingClassId) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingClassId(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [printingClassId]);

  useEffect(() => {
    if (printingLoginCardsClassId) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingLoginCardsClassId(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [printingLoginCardsClassId]);

  const goBack = () => {
    setSelectedClassId(null);
    setViewMode('grid');
  };

  if (isLoading) {
    return (
      <PageLayout role={userRole} title={t('students')}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500/80 animate-pulse">Loading class data...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout role={userRole} title={t('students')}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 1. HEADER & GLOBAL CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="shrink-0">
            <h2 className="text-heading text-slate-900 dark:text-white">{t('students')}</h2>
            <p className="text-label text-slate-500/80 mt-1">
              {searchTerm ? `${t('foundMatchingStudents')}: ${filteredStudents.length}` : t('studentsSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 lg:max-w-2xl justify-end">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/80">search</span>
                <input
                  type="text"
                  placeholder={t('searchStudentsPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="btn-secondary shrink-0"
                >
                  <span className="btn-icon">upload_file</span>
                  {t('importStudents')}
                </button>
                <button
                  onClick={handleAdd}
                  className="btn-primary shrink-0"
                >
                  <span className="btn-icon">person_add</span>
                  {t('addStudent')}
                </button>
              </div>
            </div>
          </div>

        {/* 2. GRID VIEW — CLASS CARDS (Shown when not searching and no class selected) */}
        {viewMode === 'grid' && !searchTerm && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableClasses.map(c => {
                const classStudents = students.filter(s => s.classId === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClass(c.id)}
                    className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-display">school</span>
                      </div>
                      <h3 className="text-section text-slate-900 dark:text-white mb-1">{c.name}</h3>
                      <p className="text-label text-slate-500/80 mb-6">{classStudents.length} {t('studentsRegistered')}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-label text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          {t('viewStudents')}
                          <span className="material-symbols-outlined text-section">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableClasses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="material-symbols-outlined text-display text-slate-200 mb-4">class</span>
                <p className="text-slate-500/80">{t('noClassesAvailable')}</p>
              </div>
            )}
          </>
        )}

        {/* 3. TABLE VIEW — STUDENTS LIST (Shown when searching OR when a class is selected) */}
        {(viewMode === 'table' || searchTerm) && (
          <>
            {/* Breadcrumbs & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500/80 transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center text-label truncate">
                  <span className="text-slate-400/80 cursor-pointer hover:text-primary" onClick={goBack}>{t('students')}</span>
                  <span className="material-symbols-outlined text-slate-300 text-section mx-1">chevron_right</span>
                  <span className="text-slate-900 dark:text-white truncate">
                    {searchTerm ? `${t('searchResults')}: "${searchTerm}"` : classes.find(c => String(c.id) === String(selectedClassId))?.name}
                  </span>
                </div>
              </div>

              {selectedClassId && !searchTerm && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handlePrintClassList}
                    className="btn-secondary py-2 px-6 flex items-center justify-center gap-2 border-primary/20 text-primary shrink-0"
                  >
                    <span className="material-symbols-outlined text-section">print</span>
                    {t('printStudentList')}
                  </button>
                  <button
                    onClick={() => setIsExamPrintModalOpen(true)}
                    className="btn-secondary py-2 px-6 flex items-center justify-center gap-2 border-primary/20 text-primary shrink-0"
                  >
                    <span className="material-symbols-outlined text-section">badge</span>
                    {t('printExamCards')}
                  </button>
                </div>
              )}
            </div>

            {/* TOP CONTROL BAR — Filters only (Search moved to global) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <p className="text-label text-slate-500/80 px-2">{t('filters')}:</p>

                <div className="flex gap-2">
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-label px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
                  >
                    <option value="">{t('gender')}</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                  </select>
                  <select
                    value={filters.special}
                    onChange={(e) => setFilters({ ...filters, special: e.target.value })}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-label px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
                  >
                    <option value="">{t('specialCases')}</option>
                    <option value="noFather">{t('noFather')}</option>
                    <option value="noMother">{t('noMother')}</option>
                    <option value="disabled">{t('disabled')}</option>
                    <option value="refugee">{t('refugee')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STUDENTS TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th>{t('fullName')}</th>
                      <th>{t('studentId')}</th>
                      <th>{t('phoneNumber')}</th>
                      <th>{t('class')}</th>
                      <th>{t('status')}</th>
                      <th className="text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map(student => (
                      <tr
                        key={student.id}
                        className="table-row-hover group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800 dark:text-slate-200">{student.name}</span>
                            <span className="text-label text-slate-400/80">{student.gender === 'Male' ? t('male') : t('female')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-label text-slate-500/80 dark:text-slate-400/80">{student.systemId || student.id.split('-')[0]}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText((student.systemId || student.id.split('-')[0]).toString());
                                addNotification(t('idCopied'), 'info');
                              }}
                              className="p-1 text-slate-400/80 hover:text-primary hover:bg-primary/5 rounded transition-all opacity-0 group-hover:opacity-100"
                              title={t('copyId')}
                            >
                              <span className="material-symbols-outlined text-section">content_copy</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{student.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400/80">
                          {classes.find(c => String(c.id) === String(student.classId))?.name || t('unassigned')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-label  ${student.status === 'Inactive'
                            ? 'bg-slate-100 text-slate-500/80 dark:bg-slate-800'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                            {student.status === 'Inactive' ? t('inactive') : t('active')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewProfile(student)}
                              className="p-1.5 text-slate-400/80 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              title={t('viewProfile')}
                            >
                              <span className="material-symbols-outlined text-section">visibility</span>
                            </button>
                            <button
                              onClick={(e) => handleEdit(student, e)}
                              className="p-1.5 text-slate-400/80 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                              title={t('edit')}
                            >
                              <span className="material-symbols-outlined text-section">edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(student.id, e)}
                              className="p-1.5 text-slate-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                              title={t('delete')}
                            >
                              <span className="material-symbols-outlined text-section">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center text-slate-400/80">
                          <span className="material-symbols-outlined text-display mb-3 opacity-20">person_off</span>
                          <p className="">{t('noStudentsFound')}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {isImportOpen && (
        <ImportStudentsModal
          onClose={() => setIsImportOpen(false)}
          onImport={(data) => {
            bulkAddStudents(data);
          }}
          classes={classes}
          existingStudents={students}
        />
      )}

      {/* 3. STUDENT PROFILE VIEW */}
      {isProfileOpen && selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          onClose={() => setIsProfileOpen(false)}
          classes={classes}
          schoolSettings={schoolSettings}
          onEdit={(s) => {
            setIsProfileOpen(false);
            setEditingStudent(s);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* 4. ADD/EDIT STUDENT FORM */}
      {isFormOpen && (
        <StudentForm
          student={editingStudent}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
          classes={classes} defaultClassId={selectedClassId}
        />
      )}

      {isExamPrintModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-section text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                {t('selectExamCycle')}
              </h3>
              <button 
                onClick={() => setIsExamPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-label text-slate-500/80 leading-relaxed">
              {t('selectExamCycleDesc')}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsExamPrintModalOpen(false);
                  handlePrintLoginCards('Midterm');
                }}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-label"
              >
                <span className="material-symbols-outlined text-section">badge</span>
                {t('midterm')}
              </button>
              
              <button
                onClick={() => {
                  setIsExamPrintModalOpen(false);
                  handlePrintLoginCards('Final');
                }}
                className="w-full btn-secondary py-3 flex items-center justify-center gap-2 border-primary/20 text-primary text-label"
              >
                <span className="material-symbols-outlined text-section">badge</span>
                {t('final')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>

    {/* 5. HIDDEN PRINTABLE COMPONENT */}
    {selectedStudent && isProfileOpen && !printingClassId && !printingLoginCardsClassId && (
      <PrintableStudentProfile
        student={selectedStudent}
        classes={classes}
        schoolSettings={schoolSettings}
      />
    )}

    {printingClassId && (
      <PrintableClassStudents
        classId={printingClassId}
        students={students}
        classes={classes}
        schoolSettings={schoolSettings}
      />
    )}

    {printingLoginCardsClassId && (
      <PrintableStudentLoginCards
        classId={printingLoginCardsClassId}
        students={students}
        classes={classes}
        schoolSettings={schoolSettings}
        examOption={selectedExamOption}
      />
    )}
  </>
  );
};

/**
 * SECTION 4: ADD STUDENT FORM (CRITICAL)
 * Structured into 8 Sections as requested.
 */
const StudentForm = ({ student, onClose, onSave, classes, defaultClassId }) => {
  const { t } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    gender: 'Male',
    birthDate: '',
    birthPlace: '',
    phone: '',
    motherName: '',
    parentStatus: 'Both',
    address: { country: 'Somalia', state: '', city: '', neighborhood: '', fullAddress: '' },
    specialConditions: { disability: false, refugee: false },
    responsiblePerson: { name: '', phone1: '', phone2: '' },
    classId: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationType: 'Exam',
    previousSchool: '',
    status: 'Active',
    notes: '',
    photo: '',
    ...student,
    address: { country: 'Somalia', state: '', city: '', neighborhood: '', fullAddress: '', ...(student?.address || {}) },
    specialConditions: { disability: false, refugee: false, other: '', ...(student?.specialConditions || {}) },
    responsiblePerson: { name: '', phone1: '', phone2: '', ...(student?.responsiblePerson || {}) }
  });

  const handleChange = (path, value) => {
    if (path.includes('.')) {
      const parts = path.split('.');
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          [parts[0]]: { ...prev[parts[0]], [parts[1]]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [path]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Center crop the original image to a 3:4 aspect ratio
        const targetAspect = 3 / 4;
        const imgAspect = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgAspect > targetAspect) {
          // Image is wider than 3:4, crop sides
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller than 3:4, crop top/bottom
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 300, 400);

        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        handleChange('photo', base64String);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <form
        onSubmit={(e) => { 
          e.preventDefault(); 
          if (!formData.classId) {
            alert(t('selectClassRequired'));
            return;
          }
          if (formData.password && !/^\d{6}$/.test(formData.password)) {
            alert(t('passwordSixDigits'));
            return;
          }
          onSave(formData); 
        }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl shrink-0">
          <h3 className="text-slate-900 dark:text-slate-100 text-section flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_add</span>
            {student ? t('editStudentDetails') : t('registerNewStudent')}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto space-y-8 md:space-y-12">
          {/* SECTION 1 — Basic Information */}
          <section>
            <FormSectionHeader icon="person" title={t('sectionBasicInfo')} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="w-[75px] h-[100px] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700/50 shrink-0">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-display text-slate-400/80">photo_camera</span>
                  )}
                </div>
                <div className="flex-1 w-full text-center md:text-left">
                  <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1 block font-medium">{t('studentPhotograph')}</label>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="student-photo-upload"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <label
                      htmlFor="student-photo-upload"
                      className="btn-secondary py-1.5 px-4 cursor-pointer text-label inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-section">upload</span>
                      {t('uploadPhoto')}
                    </label>
                    {formData.photo && (
                      <button
                        type="button"
                        onClick={() => handleChange('photo', '')}
                        className="px-4 py-1.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-label transition-all"
                      >
                        {t('remove')}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400/80 mt-1.5">{t('photoSizeNotice')}</p>
                </div>
              </div>
              <div className="col-span-full lg:col-span-1">
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('fullNameFourNames')}</label>
                <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input-custom" placeholder={t('namePlaceholder')} />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('gender')}</label>
                <div className="flex gap-4 mt-2">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={e => handleChange('gender', e.target.value)} className="w-4 h-4 text-primary focus:ring-primary/20" />
                      <span className="text-label text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{g === 'Male' ? t('male') : t('female')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('birthDate')}</label>
                <input type="date" value={formData.birthDate || ''} onChange={e => handleChange('birthDate', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('birthPlace')}</label>
                <input type="text" value={formData.birthPlace || ''} onChange={e => handleChange('birthPlace', e.target.value)} className="form-input-custom" placeholder={t('birthPlacePlaceholder')} />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('phoneNumber')}</label>
                <input type="text" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="form-input-custom" placeholder="+123..." />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('passwordSixDigits')}</label>
                <input type="text" value={formData.password || ''} onChange={e => handleChange('password', e.target.value)} className="form-input-custom" placeholder="123456" required={!student} />
              </div>
            </div>
          </section>

          {/* SECTION 2 — Family Information */}
          <section>
            <FormSectionHeader icon="family_restroom" title={t('sectionFamilyInfo')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('motherFullName')}</label>
                <input type="text" value={formData.motherName || ''} onChange={e => handleChange('motherName', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('parentStatus')}</label>
                <select value={formData.parentStatus} onChange={e => handleChange('parentStatus', e.target.value)} className="form-input-custom cursor-pointer">
                  <option value="Both">{t('bothParentsAlive')}</option>
                  <option value="No Father">{t('noFatherOrphan')}</option>
                  <option value="No Mother">{t('noMotherOrphan')}</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3 — Address */}
          <section>
            <FormSectionHeader icon="location_on" title={t('sectionAddress')} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('country')}</label>
                <input type="text" value={formData.address?.country || ''} onChange={e => handleChange('address.country', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('state')}</label>
                <input type="text" value={formData.address?.state || ''} onChange={e => handleChange('address.state', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('cityVillage')}</label>
                <input type="text" value={formData.address?.city || ''} onChange={e => handleChange('address.city', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('neighborhood')}</label>
                <input type="text" value={formData.address?.neighborhood || ''} onChange={e => handleChange('address.neighborhood', e.target.value)} className="form-input-custom" />
              </div>
              <div className="col-span-full">
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('fullAddressDetails')}</label>
                <textarea rows="2" value={formData.address?.fullAddress || ''} onChange={e => handleChange('address.fullAddress', e.target.value)} className="form-input-custom" placeholder={t('fullAddressPlaceholder')}></textarea>
              </div>
            </div>
          </section>

          {/* SECTION 4 — Academic Info */}
          <section>
            <FormSectionHeader icon="school" title={t('sectionAcademicInfo')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('class')}</label>
                <select 
                  value={formData.classId || ''} 
                  onChange={e => handleChange('classId', e.target.value ? e.target.value : '')} 
                  className={`form-input-custom cursor-pointer ${!formData.classId ? 'border-rose-300 bg-rose-50/30' : ''}`}
                  required
                >
                  <option value="">{t('selectClassRequired')}</option>
                  {sortClasses(classes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('registrationDate')}</label>
                <input type="date" value={formData.registrationDate || ''} onChange={e => handleChange('registrationDate', e.target.value)} className="form-input-custom" />
              </div>
            </div>
          </section>

          {/* SECTION 5 — Special Conditions */}
          <section>
            <FormSectionHeader icon="emergency_home" title={t('sectionSpecialConditions')} />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex-1 min-w-[200px]">
                <input type="checkbox" checked={formData.specialConditions.disability} onChange={e => handleChange('specialConditions.disability', e.target.checked)} className="w-5 h-5 text-primary rounded border-slate-300" />
                <div>
                  <span className="block text-label text-slate-700 dark:text-slate-200">{t('disability')}</span>
                  <span className="text-label text-slate-400/80">{t('disabilityDesc')}</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex-1 min-w-[200px]">
                <input type="checkbox" checked={formData.specialConditions.refugee} onChange={e => handleChange('specialConditions.refugee', e.target.checked)} className="w-5 h-5 text-primary rounded border-slate-300" />
                <div>
                  <span className="block text-label text-slate-700 dark:text-slate-200">{t('refugeeStatus')}</span>
                  <span className="text-label text-slate-400/80">{t('refugeeDesc')}</span>
                </div>
              </label>
            </div>
          </section>

          {/* SECTION 6 — Responsible Person */}
          <section>
            <FormSectionHeader icon="contact_phone" title={t('sectionResponsiblePerson')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('fullName')}</label>
                <input type="text" value={formData.responsiblePerson.name} onChange={e => handleChange('responsiblePerson.name', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('phoneOneRequired')}</label>
                <input type="text" value={formData.responsiblePerson.phone1} onChange={e => handleChange('responsiblePerson.phone1', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('phoneTwoOptional')}</label>
                <input type="text" value={formData.responsiblePerson.phone2} onChange={e => handleChange('responsiblePerson.phone2', e.target.value)} className="form-input-custom" />
              </div>
            </div>
          </section>

          {/* SECTION 7 — Registration Type */}
          <section>
            <FormSectionHeader icon="app_registration" title={t('sectionRegistrationType')} />
            <div className="space-y-6">
              <div className="flex gap-8">
                {['By Exam', 'Transfer from another school'].map(tType => (
                  <label key={tType} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="regType" value={tType} checked={formData.registrationType === tType} onChange={e => handleChange('registrationType', e.target.value)} className="w-5 h-5 text-primary focus:ring-primary/20" />
                    <span className="text-label text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{tType === 'By Exam' ? t('byExam') : t('transferFromAnotherSchool')}</span>
                  </label>
                ))}
              </div>
              {formData.registrationType === 'Transfer from another school' && (
                <div className="animate-in slide-in-from-top-2 duration-300 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">{t('previousSchoolName')}</label>
                  <input type="text" value={formData.previousSchool || ''} onChange={e => handleChange('previousSchool', e.target.value)} className="form-input-custom md:w-1/2" placeholder={t('previousSchoolPlaceholder')} />
                </div>
              )}
            </div>
          </section>

          {/* SECTION 8 — Additional Details */}
          <section>
            <FormSectionHeader icon="notes" title={t('sectionAdditionalDetails')} />
            <textarea rows="4" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="form-input-custom" placeholder={t('notesPlaceholder')}></textarea>
          </section>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-label text-slate-500/80 dark:text-slate-400/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">{t('cancel')}</button>
          <button type="submit" className="px-8 py-2.5 bg-primary text-white text-label rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all transform active:scale-95">{t('saveStudentRecord')}</button>
        </div>
      </form>
    </div>
  );
};

/**
 * SECTION 3: STUDENT PROFILE (ON CLICK)
 * Structured with Sections A-H as requested.
 */
const StudentProfile = ({ student, onClose, classes, schoolSettings }) => {
  const { t } = useSettings();
  const { getReportCardData, getStudentAttendanceSummary } = useData();

  const reportData = useMemo(() => getReportCardData(student.id, student.classId), [student, getReportCardData]);
  const attendanceSummary = useMemo(() => getStudentAttendanceSummary(student.id), [student, getStudentAttendanceSummary]);
  const { present, absent, late, rate } = attendanceSummary || { present: 0, absent: 0, late: 0, rate: 100 };

  const studentClass = classes.find(c => String(c.id) === String(student.classId));
  const classSubjects = studentClass?.subjects || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto overflow-hidden animate-in zoom-in-95 duration-400">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-primary text-white relative">
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-[75px] h-[100px] rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-display shadow-inner overflow-hidden">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name ? student.name[0] : 'S'
              )}
            </div>
            <div>
              <h3 className="text-display mb-1">{student.name}</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-white/80 text-label bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="material-symbols-outlined text-body">id_card</span>
                  ID: {student.systemId || student.id.split('-')[0]}
                </span>
                <span className="flex items-center gap-1 text-white/80 text-label bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="material-symbols-outlined text-body">school</span>
                  {classes.find(c => String(c.id) === String(student.classId))?.name}
                </span>
                <span className="flex items-center gap-1 text-white/80 text-label bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="material-symbols-outlined text-body">phone</span>
                  {student.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 relative z-10">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-label"
            >
              <span className="material-symbols-outlined text-display">print</span>
              {t('printProfile')}
            </button>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <span className="material-symbols-outlined text-white">close</span>
            </button>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto bg-slate-100/30 dark:bg-slate-950/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Detailed Info (Sections A, B, C, D, E, G) */}
            <div className="lg:col-span-2 space-y-8">

              {/* A. Personal Information */}
              <ProfileSection title={t('personalInformation')} icon="person">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <InfoItem label={t('fullName')} value={student.name} />
                  <InfoItem label={t('motherFullName')} value={student.motherName} />
                  <InfoItem label={t('birthDate')} value={student.birthDate} />
                  <InfoItem label={t('birthPlace')} value={student.birthPlace} />
                  <InfoItem label={t('gender')} value={student.gender === 'Male' ? t('male') : t('female')} />
                  <InfoItem label={t('phone')} value={student.phone} />
                </div>
              </ProfileSection>

              {/* B. Address */}
              <ProfileSection title={t('residentialAddress')} icon="location_on">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <InfoItem label={t('country')} value={student.address?.country} />
                  <InfoItem label={t('state')} value={student.address?.state} />
                  <InfoItem label={t('cityVillage')} value={student.address?.city} />
                  <InfoItem label={t('neighborhood')} value={student.address?.neighborhood} />
                  <div className="col-span-full pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <InfoItem label={t('fullAddressDetails')} value={student.address?.fullAddress} />
                  </div>
                </div>
              </ProfileSection>

              {/* C & D. Academic & Family Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProfileSection title={t('sectionAcademicInfo')} icon="history_edu">
                  <InfoItem label={t('registrationDate')} value={student.registrationDate} />
                  <div className="mt-4">
                    <InfoItem label={t('sectionRegistrationType')} value={student.registrationType === 'By Exam' ? t('byExam') : t('transferFromAnotherSchool')} />
                    {student.previousSchool && <p className="mt-1 text-label text-slate-500/80 italic">{t('previousSchoolName')}: {student.previousSchool}</p>}
                  </div>
                </ProfileSection>
                <ProfileSection title={t('familyStatus')} icon="family_restroom">
                  <InfoItem label={t('parentStatus')} value={student.parentStatus === 'Both' ? t('bothParentsAlive') : student.parentStatus === 'No Father' ? t('noFatherOrphan') : t('noMotherOrphan')} />
                  <div className="mt-4">
                    <p className="text-label text-slate-400/80 mb-2">{t('householdStatus')}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {t('standard')}
                    </span>
                  </div>
                </ProfileSection>
              </div>

              {/* E. Special Conditions */}
              <ProfileSection title={t('sectionSpecialConditions')} icon="emergency_home">
                <div className="flex flex-wrap gap-4">
                  {student.specialConditions?.disability ? (
                    <ProfileBadge label={t('disability')} color="rose" icon="accessible" />
                  ) : (
                    <ProfileBadge label={t('noDisability')} color="slate" icon="check_circle" />
                  )}
                  {student.specialConditions?.refugee ? (
                    <ProfileBadge label={t('refugeeStatus')} color="amber" icon="public" />
                  ) : (
                    <ProfileBadge label={t('nonRefugee')} color="slate" icon="check_circle" />
                  )}
                </div>
              </ProfileSection>

              {/* G. Grades */}
              <ProfileSection title={t('academicPerformance')} icon="grade">
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-label border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 text-label text-slate-400/80 font-semibold border-b border-slate-200 dark:border-slate-850">
                      <tr>
                        <th className="px-4 py-2 text-left">{t('subject')}</th>
                        <th className="px-4 py-2 text-center">{t('beforeMidTen')}</th>
                        <th className="px-4 py-2 text-center">{t('midtermThirty')}</th>
                        <th className="px-4 py-2 text-center">{t('afterMidTen')}</th>
                        <th className="px-4 py-2 text-center">{t('finalFifty')}</th>
                        <th className="px-4 py-2 text-right">{t('average')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {classSubjects.map(sub => {
                        const subName = sub.name;
                        const subData = reportData?.results?.[subName] || {};
                        const beforeMid = subData["Before Midterm"] !== undefined ? subData["Before Midterm"] : "-";
                        const midterm = subData["Midterm"] !== undefined ? subData["Midterm"] : "-";
                        const afterMid = subData["After Midterm"] !== undefined ? subData["After Midterm"] : "-";
                        const finalScore = subData["Final"] !== undefined ? subData["Final"] : "-";
                        const avg = subData.average !== undefined ? `${subData.average}%` : "-";

                        return (
                          <tr key={subName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{subName}</td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{beforeMid}</td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{midterm}</td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{afterMid}</td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{finalScore}</td>
                            <td className="px-4 py-3 text-right text-emerald-500 font-mono font-semibold">{avg}</td>
                          </tr>
                        );
                      })}
                      {classSubjects.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-6 text-center text-slate-400/80">
                            {t('noSubjectsAssigned')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </ProfileSection>
            </div>

            {/* Right Column - Responsible & Attendance (Sections F, H) */}
            <div className="space-y-8">
              {/* F. Responsible Person */}
              <ProfileSection title={t('sectionResponsiblePerson')} icon="contact_phone">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400/80">person</span>
                    </div>
                    <InfoItem label={t('fullName')} value={student.responsiblePerson?.name} />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-section">phone</span>
                      <InfoItem label="Phone 1" value={student.responsiblePerson?.phone1} />
                    </div>
                    {student.responsiblePerson?.phone2 && (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400/80 text-section">phone_iphone</span>
                        <InfoItem label="Phone 2" value={student.responsiblePerson.phone2} />
                      </div>
                    )}
                  </div>
                </div>
              </ProfileSection>

              {/* H. Attendance */}
              <ProfileSection title={t('attendanceStats')} icon="analytics">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4"
                        strokeDasharray={`${rate} 100`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-display text-slate-900 dark:text-slate-100">{rate}%</span>
                      <span className="text-label text-slate-400/80">{t('presence')}</span>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center border border-emerald-100 dark:border-emerald-800/50">
                      <span className="block text-section text-emerald-600 dark:text-emerald-400">{present + late}</span>
                      <span className="text-label text-slate-500/80">{t('present')}</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl text-center border border-rose-100 dark:border-rose-800/50">
                      <span className="block text-section text-rose-600 dark:text-rose-400">{absent}</span>
                      <span className="text-label text-slate-500/80">{t('absent')}</span>
                    </div>
                  </div>
                </div>
              </ProfileSection>

              {/* Additional Notes */}
              <ProfileSection title={t('administrativeNotes')} icon="notes">
                <p className="text-label text-slate-600 dark:text-slate-400/80 leading-relaxed italic bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {student.notes || t('noNotesRecorded')}
                </p>
              </ProfileSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PDF PRINTABLE VERSION
 * Only visible during window.print() via CSS .print-only
 */
const PrintableFooter = () => {
  const { t } = useSettings();
  return (
    <div className="mt-8 pt-4 text-center">
      <div className="grid grid-cols-2 gap-12 pt-4 mb-4">
        <div className="signature-area text-center border-t-2 border-slate-900 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest">{t('managerSignature')}</p>
        </div>
        <div className="signature-area text-center border-t-2 border-slate-900 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest">{t('responsiblePersonSignature')}</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-400 italic">{t('officialSealNotice')}</p>
    </div>
  );
};

const PrintableStudentProfile = ({ student, classes, schoolSettings }) => {
  const { name: schoolName, logo, phone, email, address } = schoolSettings || {};
  const { t } = useSettings();
  return (
    <div className="print-only font-sans text-slate-900 bg-white min-h-screen flex flex-col">
      {/* PDF HEADER */}
      <div className="print-header flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-display">school</span>
            </div>
          )}
          <div>
            <h1 className="text-display text-slate-900">{schoolName}</h1>
            <p className="text-label text-slate-500/80">{t('officialStudentDocument')}</p>
          </div>
        </div>
        <div className="text-right text-label leading-relaxed text-slate-600">
          <p>{address}</p>
          <p>{t('phone')}: {phone}</p>
          <p>{t('email')}: {email}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-section border-l-4 border-primary pl-4">{t('studentProfileRecord')}</h2>
        <div className="text-right">
          <p className="text-label text-slate-400/80">{t('issueDate')}</p>
          <p className="text-label">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* PDF BODY */}
      <div className="space-y-6 flex-1">
        {/* Photo & Basic Credentials Card */}
        <div className="flex gap-6 items-start border border-slate-200 p-4 rounded-2xl bg-slate-50/50 mb-6">
          {student.photo ? (
            <img src={student.photo} alt="Student" className="w-[120px] h-[160px] object-cover rounded-xl border border-slate-300" />
          ) : (
            <div className="w-[120px] h-[160px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-300">
              <span className="material-symbols-outlined text-display">person</span>
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">{t('studentName')}</p>
              <p className="text-base font-bold text-slate-800">{student.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">{t('studentId')}</p>
              <p className="text-base font-mono font-bold text-slate-800">#{student.systemId || student.id.split('-')[0]}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">{t('assignedClass')}</p>
              <p className="text-base font-bold text-slate-800">
                {classes.find(c => String(c.id) === String(student.classId))?.name || t('unassigned')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">{t('status')}</p>
              <p className="text-base font-bold text-slate-800">
                {student.status === 'Active' ? t('active') : student.status === 'Inactive' ? t('inactive') : (student.status || t('active'))}
              </p>
            </div>
          </div>
        </div>

        {/* Personal & Academic Details */}
        <div className="grid grid-cols-2 gap-8">
          <div className="print-section">
            <h3 className="print-section-title">{t('personalInformation')}</h3>
            <div className="print-grid">
              <PrintItem label={t('gender')} value={student.gender === 'Male' ? t('male') : student.gender === 'Female' ? t('female') : student.gender} />
              <PrintItem label={t('birthDate')} value={student.birthDate} />
              <PrintItem label={t('birthPlace')} value={student.birthPlace} />
              <PrintItem label={t('phone')} value={student.phone} />
              <PrintItem label={t('motherFullName')} value={student.motherName} />
            </div>
          </div>
          <div className="print-section">
            <h3 className="print-section-title">{t('sectionAcademicInfo')}</h3>
            <div className="print-grid">
              <PrintItem label={t('registrationDate')} value={student.registrationDate} />
              <PrintItem label={t('sectionRegistrationType')} value={student.registrationType === 'By Exam' ? t('byExam') : student.registrationType === 'Transfer from another school' ? t('transferFromAnotherSchool') : student.registrationType} />
              {student.registrationType === 'Transfer from another school' && (
                <PrintItem label={t('previousSchoolName')} value={student.previousSchool} />
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="print-section">
          <h3 className="print-section-title">{t('residentialAddress')}</h3>
          <div className="print-grid grid-cols-4">
            <PrintItem label={t('country')} value={student.address?.country} />
            <PrintItem label={t('state')} value={student.address?.state} />
            <PrintItem label={t('cityVillage')} value={student.address?.city} />
            <PrintItem label={t('neighborhood')} value={student.address?.neighborhood} />
            <div className="col-span-full mt-2">
              <PrintItem label={t('fullAddressDetails')} value={student.address?.fullAddress} />
            </div>
          </div>
        </div>

        {/* Family & Special */}
        <div className="grid grid-cols-2 gap-8">
          <div className="print-section">
            <h3 className="print-section-title">{t('familyStatus')}</h3>
            <div className="print-grid">
              <PrintItem label={t('parentStatus')} value={student.parentStatus === 'Both' ? t('bothParentsAlive') : student.parentStatus === 'No Father' ? t('noFatherOrphan') : student.parentStatus === 'No Mother' ? t('noMotherOrphan') : student.parentStatus} />
              <PrintItem label={t('disability')} value={student.specialConditions?.disability ? t('yes') : t('none')} />
              <PrintItem label={t('refugeeStatus')} value={student.specialConditions?.refugee ? t('yes') : t('no')} />
            </div>
          </div>
          <div className="print-section">
            <h3 className="print-section-title">{t('sectionResponsiblePerson')}</h3>
            <div className="print-grid">
              <PrintItem label={t('fullName')} value={student.responsiblePerson?.name} />
              <PrintItem label={t('phone1')} value={student.responsiblePerson?.phone1} />
              <PrintItem label={t('phone2')} value={student.responsiblePerson?.phone2 || t('none')} />
            </div>
          </div>
        </div>
      </div>
      <PrintableFooter />
    </div>
  );
};

const PrintableClassStudents = ({ classId, students, classes, schoolSettings }) => {
  const { name: schoolName, logo, phone, email, address } = schoolSettings || {};
  const { t } = useSettings();
  const currentClass = classes.find(c => String(c.id) === String(classId));
  const classStudents = students
    .filter(s => String(s.classId) === String(classId))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="print-only font-sans text-slate-900 bg-white min-h-screen flex flex-col">
      {/* PDF HEADER */}
      <div className="print-header flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-display">school</span>
            </div>
          )}
          <div>
            <h1 className="text-display text-slate-900">{schoolName}</h1>
            <p className="text-label text-slate-500/80">{t('classCredentialsList')}</p>
          </div>
        </div>
        <div className="text-right text-label leading-relaxed text-slate-600">
          <p>{address}</p>
          <p>{t('phone')}: {phone}</p>
          <p>{t('email')}: {email}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-section border-l-4 border-primary pl-4">
          {t('students')}: {currentClass ? currentClass.name : t('none')}
        </h2>
        <div className="text-right">
          <p className="text-label text-slate-400/80">{t('printDate')}</p>
          <p className="text-label">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-3 border border-slate-300 w-12 text-center">{t('numberSign')}</th>
              <th className="p-3 border border-slate-300">{t('studentName')}</th>
              <th className="p-3 border border-slate-300 w-36">{t('studentId')}</th>
              <th className="p-3 border border-slate-300 w-36 text-center">{t('studentPassword')}</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((student, idx) => (
              <tr key={student.id} className="border-b border-slate-200">
                <td className="p-3 border border-slate-300 text-center">{idx + 1}</td>
                <td className="p-3 border border-slate-300 font-semibold">{student.name}</td>
                <td className="p-3 border border-slate-300 font-mono">{student.systemId || student.id.split('-')[0]}</td>
                <td className="p-3 border border-slate-300 font-mono text-center">{student.password || '123456'}</td>
              </tr>
            ))}
            {classStudents.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500 italic border border-slate-300">
                  {t('noStudentsRegisteredYet')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PrintableFooter />
    </div>
  );
};

const PrintableStudentLoginCards = ({ classId, students, classes, schoolSettings, examOption }) => {
  const { name: schoolName, logo } = schoolSettings || {};
  const { t } = useSettings();
  const currentClass = classes.find(c => String(c.id) === String(classId));
  const classStudents = students
    .filter(s => String(s.classId) === String(classId))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Chunk students into groups of 6 to fit A4 paper layout (2 columns x 3 rows)
  const chunks = [];
  for (let i = 0; i < classStudents.length; i += 6) {
    chunks.push(classStudents.slice(i, i + 6));
  }

  // Real login page URL for QR Code
  const loginUrl = `${window.location.origin}/login`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(loginUrl)}`;

  return (
    <div className="print-only login-cards-print-container font-sans text-slate-900 bg-white">
      {chunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx} className="login-cards-page" style={{ pageBreakAfter: chunkIdx < chunks.length - 1 ? 'always' : 'avoid' }}>
          {chunk.map(student => {
            const studentId = student.systemId || student.id.split('-')[0];
            return (
              <div key={student.id} className="login-card">
                {/* Header */}
                <div className="login-card-header">
                  {logo ? (
                    <img src={logo} alt="Logo" className="login-card-logo" />
                  ) : (
                    <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white shrink-0">
                      <span className="material-symbols-outlined text-[12px]">school</span>
                    </div>
                  )}
                  <span className="login-card-school-name">{schoolName || 'School Management System'}</span>
                  <span className="login-card-title-badge">
                    {t('examCard')}
                  </span>
                </div>

                {/* Body */}
                <div className="login-card-body">
                  <h4 className="login-card-student-name">{student.name}</h4>
                  
                  <div className="login-card-divider"></div>

                  <div className="login-card-content-row">
                    {/* Left Column: Details */}
                    <div className="login-card-details-column">
                      <div className="login-card-grid-row">
                        <span className="login-card-grid-label">{t('studentId')}:</span>
                        <span className="login-card-grid-value">{studentId}</span>
                      </div>
                      <div className="login-card-grid-row">
                        <span className="login-card-grid-label">{t('class')}:</span>
                        <span className="login-card-grid-value">{currentClass ? currentClass.name : ''}</span>
                      </div>
                      <div className="login-card-grid-row">
                        <span className="login-card-grid-label">{t('academicYear')}:</span>
                        <span className="login-card-grid-value">{currentClass?.academicYear || '2025-2026'}</span>
                      </div>
                      <div className="login-card-grid-row">
                        <span className="login-card-grid-label">{t('examType')}:</span>
                        <span className="login-card-grid-value">{examOption === 'Midterm' ? t('midterm') : t('final')}</span>
                      </div>
                    </div>

                    {/* Right Column: QR Code */}
                    <div className="login-card-qr-column">
                      <div className="login-card-qr-container">
                        <img 
                          src={qrCodeUrl} 
                          alt="Login QR Code" 
                          className="login-card-qr-img" 
                        />
                      </div>
                      <span className="login-card-qr-hint">SCAN TO LOGIN</span>
                    </div>
                  </div>
                </div>

                {/* Warning Footer */}
                <div className="login-card-footer">
                  {t('examCardWarning')}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const PrintItem = ({ label, value }) => (
  <div>
    <p className="print-label">{label}</p>
    <p className="print-value">{value || 'N/A'}</p>
  </div>
);

// Internal Helper Components
const FormSectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary shadow-sm">
      <span className="material-symbols-outlined text-display">{icon}</span>
    </div>
    <h4 className="text-primary text-label">{title}</h4>
  </div>
);

const ProfileSection = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-sm transition-colors group">
    <h4 className="text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-section">{icon}</span>
      </span>
      {title}
    </h4>
    {children}
  </div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-label text-slate-400/80 mb-1.5">{label}</p>
    <p className="text-label text-slate-800 dark:text-slate-200">{value || 'Not Specified'}</p>
  </div>
);

const ProfileBadge = ({ label, color, icon }) => (
  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-label   
  ${color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800' :
      color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
        'bg-slate-100 dark:bg-slate-800 text-slate-500/80 border-slate-100 dark:border-slate-800'} 
  border shadow-sm`}>
    <span className="material-symbols-outlined text-section">{icon}</span>
    {label}
  </span>
);

export default StudentsPage;
