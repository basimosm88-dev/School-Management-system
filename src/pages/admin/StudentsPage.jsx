import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const StudentsPage = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent, addNotification } = useData();
  const { schoolSettings, t } = useSettings();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classId: '',
    gender: '',
    status: '',
    special: '' // noFather, noMother, disabled, refugee
  });
  const [classSearchTerm, setClassSearchTerm] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Navigation State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useData();
  const userRole = currentUser?.role || 'admin';

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Primary filter by selected class
      if (selectedClassId && Number(student.classId) !== Number(selectedClassId)) return false;

      const className = classes.find(c => String(c.id) === String(student.classId))?.name || '';
      const matchesSearch =
        (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.phone || '').includes(searchTerm) ||
        className.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = !filters.classId || Number(student.classId) === Number(filters.classId);
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
    let baseClasses = [];
    if (userRole === 'admin') baseClasses = classes;
    else if (userRole === 'teacher') {
      const assignedIds = currentUser?.assignedClasses || [];
      baseClasses = classes.filter(c => assignedIds.includes(c.id));
    } else {
      baseClasses = classes;
    }

    if (!classSearchTerm) return baseClasses;
    return baseClasses.filter(c => 
      (c.name || '').toLowerCase().includes(classSearchTerm.toLowerCase())
    );
  }, [classes, userRole, currentUser, classSearchTerm]);

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
    setIsLoading(true);
    setTimeout(() => {
      setSelectedClassId(classId);
      setViewMode('table');
      setIsLoading(false);
    }, 400);
  };

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
    <PageLayout role={userRole} title={t('students')}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 1. GRID VIEW — CLASS CARDS */}
        {viewMode === 'grid' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                <div>
                  <h2 className="text-heading text-slate-900 dark:text-white">{t('students')}</h2>
                  <p className="text-label text-slate-500/80 mt-1">{t('studentsSubtitle')}</p>
                </div>

                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/80">search</span>
                  <input
                    type="text"
                    placeholder="Search classes by name..."
                    value={classSearchTerm}
                    onChange={(e) => setClassSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="btn-primary shrink-0"
              >
                <span className="btn-icon">person_add</span>
                Add Student
              </button>
            </div>

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
                      <p className="text-label text-slate-500/80 mb-6">{classStudents.length} Students registered</p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-label text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          View Students
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
                <p className="text-slate-500/80">No classes available.</p>
              </div>
            )}
          </>
        )}

        {/* 2. TABLE VIEW — STUDENTS LIST */}
        {viewMode === 'table' && (
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
                    {classes.find(c => c.id === parseInt(selectedClassId))?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* TOP CONTROL BAR */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/80">search</span>
                  <input
                    type="text"
                    placeholder="Search students in this class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-label focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-label px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <select
                    value={filters.special}
                    onChange={(e) => setFilters({ ...filters, special: e.target.value })}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-label px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
                  >
                    <option value="">Special Cases</option>
                    <option value="noFather">No Father</option>
                    <option value="noMother">No Mother</option>
                    <option value="disabled">Disabled</option>
                    <option value="refugee">Refugee</option>
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
                      <th>Full Name</th>
                      <th>Student ID</th>
                      <th>Phone Number</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
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
                            <span className="text-label text-slate-400/80">{student.gender}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-label text-slate-500/80 dark:text-slate-400/80">{student.id}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(student.id.toString());
                                addNotification('ID copied to clipboard', 'info');
                              }}
                              className="p-1 text-slate-400/80 hover:text-primary hover:bg-primary/5 rounded transition-all opacity-0 group-hover:opacity-100"
                              title="Copy ID"
                            >
                              <span className="material-symbols-outlined text-section">content_copy</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{student.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400/80">
                          {classes.find(c => String(c.id) === String(student.classId))?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-label  ${student.status === 'Inactive'
                            ? 'bg-slate-100 text-slate-500/80 dark:bg-slate-800'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                            {student.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewProfile(student)}
                              className="p-1.5 text-slate-400/80 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              title="View Profile"
                            >
                              <span className="material-symbols-outlined text-section">visibility</span>
                            </button>
                            <button
                              onClick={(e) => handleEdit(student, e)}
                              className="p-1.5 text-slate-400/80 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-section">edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(student.id, e)}
                              className="p-1.5 text-slate-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                              title="Delete"
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
                          <p className="">No students found in this class.</p>
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

      {/* 3. STUDENT PROFILE VIEW */}
      {isProfileOpen && selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          onClose={() => setIsProfileOpen(false)}
          classes={classes}
          schoolSettings={schoolSettings}
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

      {/* 5. HIDDEN PRINTABLE COMPONENT */}
      {selectedStudent && (
        <PrintableStudentProfile
          student={selectedStudent}
          classes={classes}
          schoolSettings={schoolSettings}
        />
      )}
    </PageLayout>
  );
};

/**
 * SECTION 4: ADD STUDENT FORM (CRITICAL)
 * Structured into 8 Sections as requested.
 */
const StudentForm = ({ student, onClose, onSave, classes, defaultClassId }) => {
  const [formData, setFormData] = useState({
    name: '',
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <form
        onSubmit={(e) => { 
          e.preventDefault(); 
          if (!formData.classId) {
            alert("Mandatory Field: Please select a Class for this student.");
            return;
          }
          onSave(formData); 
        }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl shrink-0">
          <h3 className="text-slate-900 dark:text-slate-100 text-section flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_add</span>
            {student ? 'Edit Student Details' : 'Register New Student'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto space-y-8 md:space-y-12">
          {/* SECTION 1 — Basic Information */}
          <section>
            <FormSectionHeader icon="person" title="Section 1: Basic Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full lg:col-span-1">
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Full Name (4 Names)</label>
                <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input-custom" placeholder="First Second Third Surname" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Gender</label>
                <div className="flex gap-4 mt-2">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={e => handleChange('gender', e.target.value)} className="w-4 h-4 text-primary focus:ring-primary/20" />
                      <span className="text-label text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Birth Date</label>
                <input type="date" value={formData.birthDate || ''} onChange={e => handleChange('birthDate', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Birth Place</label>
                <input type="text" value={formData.birthPlace || ''} onChange={e => handleChange('birthPlace', e.target.value)} className="form-input-custom" placeholder="City, Country" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Phone Number</label>
                <input type="text" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="form-input-custom" placeholder="+123..." />
              </div>
            </div>
          </section>

          {/* SECTION 2 — Family Information */}
          <section>
            <FormSectionHeader icon="family_restroom" title="Section 2: Family Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Mother Full Name</label>
                <input type="text" value={formData.motherName || ''} onChange={e => handleChange('motherName', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Parent Status</label>
                <select value={formData.parentStatus} onChange={e => handleChange('parentStatus', e.target.value)} className="form-input-custom cursor-pointer">
                  <option value="Both">Both Parents Alive</option>
                  <option value="No Father">No Father (Orphan)</option>
                  <option value="No Mother">No Mother (Orphan)</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3 — Address */}
          <section>
            <FormSectionHeader icon="location_on" title="Section 3: Address" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Country</label>
                <input type="text" value={formData.address?.country || ''} onChange={e => handleChange('address.country', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">State</label>
                <input type="text" value={formData.address?.state || ''} onChange={e => handleChange('address.state', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">City / Village</label>
                <input type="text" value={formData.address?.city || ''} onChange={e => handleChange('address.city', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Neighborhood</label>
                <input type="text" value={formData.address?.neighborhood || ''} onChange={e => handleChange('address.neighborhood', e.target.value)} className="form-input-custom" />
              </div>
              <div className="col-span-full">
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Full Address Details</label>
                <textarea rows="2" value={formData.address?.fullAddress || ''} onChange={e => handleChange('address.fullAddress', e.target.value)} className="form-input-custom" placeholder="Street, Building, Floor..."></textarea>
              </div>
            </div>
          </section>

          {/* SECTION 4 — Academic Info */}
          <section>
            <FormSectionHeader icon="school" title="Section 4: Academic Info" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Class</label>
                <select 
                  value={formData.classId || ''} 
                  onChange={e => handleChange('classId', e.target.value ? parseInt(e.target.value) : '')} 
                  className={`form-input-custom cursor-pointer ${!formData.classId ? 'border-rose-300 bg-rose-50/30' : ''}`}
                  required
                >
                  <option value="">Select Class (Required)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Registration Date</label>
                <input type="date" value={formData.registrationDate || ''} onChange={e => handleChange('registrationDate', e.target.value)} className="form-input-custom" />
              </div>
            </div>
          </section>

          {/* SECTION 5 — Special Conditions */}
          <section>
            <FormSectionHeader icon="emergency_home" title="Section 5: Special Conditions" />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex-1 min-w-[200px]">
                <input type="checkbox" checked={formData.specialConditions.disability} onChange={e => handleChange('specialConditions.disability', e.target.checked)} className="w-5 h-5 text-primary rounded border-slate-300" />
                <div>
                  <span className="block text-label text-slate-700 dark:text-slate-200">Disability</span>
                  <span className="text-label text-slate-400/80">Physical or learning</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex-1 min-w-[200px]">
                <input type="checkbox" checked={formData.specialConditions.refugee} onChange={e => handleChange('specialConditions.refugee', e.target.checked)} className="w-5 h-5 text-primary rounded border-slate-300" />
                <div>
                  <span className="block text-label text-slate-700 dark:text-slate-200">Refugee</span>
                  <span className="text-label text-slate-400/80">International or internal</span>
                </div>
              </label>
            </div>
          </section>

          {/* SECTION 6 — Responsible Person */}
          <section>
            <FormSectionHeader icon="contact_phone" title="Section 6: Responsible Person" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Full Name</label>
                <input type="text" value={formData.responsiblePerson.name} onChange={e => handleChange('responsiblePerson.name', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Phone Number 1 (Required)</label>
                <input type="text" value={formData.responsiblePerson.phone1} onChange={e => handleChange('responsiblePerson.phone1', e.target.value)} className="form-input-custom" />
              </div>
              <div>
                <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Phone Number 2 (Optional)</label>
                <input type="text" value={formData.responsiblePerson.phone2} onChange={e => handleChange('responsiblePerson.phone2', e.target.value)} className="form-input-custom" />
              </div>
            </div>
          </section>

          {/* SECTION 7 — Registration Type */}
          <section>
            <FormSectionHeader icon="app_registration" title="Section 7: Registration Type" />
            <div className="space-y-6">
              <div className="flex gap-8">
                {['By Exam', 'Transfer from another school'].map(t => (
                  <label key={t} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="regType" value={t} checked={formData.registrationType === t} onChange={e => handleChange('registrationType', e.target.value)} className="w-5 h-5 text-primary focus:ring-primary/20" />
                    <span className="text-label text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{t}</span>
                  </label>
                ))}
              </div>
              {formData.registrationType === 'Transfer from another school' && (
                <div className="animate-in slide-in-from-top-2 duration-300 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="text-label text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Previous School Name</label>
                  <input type="text" value={formData.previousSchool || ''} onChange={e => handleChange('previousSchool', e.target.value)} className="form-input-custom md:w-1/2" placeholder="Enter full name of previous school" />
                </div>
              )}
            </div>
          </section>

          {/* SECTION 8 — Additional Details */}
          <section>
            <FormSectionHeader icon="notes" title="Section 8: Additional Details" />
            <textarea rows="4" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="form-input-custom" placeholder="Any additional notes about the student's behavior, health, or academic history..."></textarea>
          </section>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-label text-slate-500/80 dark:text-slate-400/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
          <button type="submit" className="px-8 py-2.5 bg-primary text-white text-label rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all transform active:scale-95">Save student record</button>
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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto overflow-hidden animate-in zoom-in-95 duration-400">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-primary text-white relative">
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-display shadow-inner">
              {student.name ? student.name[0] : 'S'}
            </div>
            <div>
              <h3 className="text-display mb-1">{student.name}</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-white/80 text-label bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="material-symbols-outlined text-body">id_card</span>
                  ID: {student.id}
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
              Print Profile
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
              <ProfileSection title="Personal Information" icon="person">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <InfoItem label="Full Name" value={student.name} />
                  <InfoItem label="Mother Name" value={student.motherName} />
                  <InfoItem label="Birth Date" value={student.birthDate} />
                  <InfoItem label="Birth Place" value={student.birthPlace} />
                  <InfoItem label="Gender" value={student.gender} />
                  <InfoItem label="Phone" value={student.phone} />
                </div>
              </ProfileSection>

              {/* B. Address */}
              <ProfileSection title="Residential Address" icon="location_on">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <InfoItem label="Country" value={student.address?.country} />
                  <InfoItem label="State" value={student.address?.state} />
                  <InfoItem label="City / Village" value={student.address?.city} />
                  <InfoItem label="Neighborhood" value={student.address?.neighborhood} />
                  <div className="col-span-full pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <InfoItem label="Full Address Details" value={student.address?.fullAddress} />
                  </div>
                </div>
              </ProfileSection>

              {/* C & D. Academic & Family Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProfileSection title="Academic Info" icon="history_edu">
                  <InfoItem label="Registration Date" value={student.registrationDate} />
                  <div className="mt-4">
                    <InfoItem label="Registration Type" value={student.registrationType} />
                    {student.previousSchool && <p className="mt-1 text-label text-slate-500/80 italic">From: {student.previousSchool}</p>}
                  </div>
                </ProfileSection>
                <ProfileSection title="Family Status" icon="family_restroom">
                  <InfoItem label="Parent Status" value={student.parentStatus} />
                  <div className="mt-4">
                    <p className="text-label text-slate-400/80 mb-2">Household Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      Standard
                    </span>
                  </div>
                </ProfileSection>
              </div>

              {/* E. Special Conditions */}
              <ProfileSection title="Special Conditions" icon="emergency_home">
                <div className="flex flex-wrap gap-4">
                  {student.specialConditions?.disability ? (
                    <ProfileBadge label="Disability" color="rose" icon="accessible" />
                  ) : (
                    <ProfileBadge label="No Disability" color="slate" icon="check_circle" />
                  )}
                  {student.specialConditions?.refugee ? (
                    <ProfileBadge label="Refugee Status" color="amber" icon="public" />
                  ) : (
                    <ProfileBadge label="Non-Refugee" color="slate" icon="check_circle" />
                  )}
                </div>
              </ProfileSection>

              {/* G. Grades */}
              <ProfileSection title="Academic Performance" icon="grade">
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-label">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 text-label text-slate-400/80">
                      <tr>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-center">Score</th>
                        <th className="px-4 py-2 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Mathematics</td>
                        <td className="px-4 py-3 text-center">92</td>
                        <td className="px-4 py-3 text-right text-emerald-500">A</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Physics</td>
                        <td className="px-4 py-3 text-center">88</td>
                        <td className="px-4 py-3 text-right text-emerald-500">A-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ProfileSection>
            </div>

            {/* Right Column - Responsible & Attendance (Sections F, H) */}
            <div className="space-y-8">
              {/* F. Responsible Person */}
              <ProfileSection title="Responsible Person" icon="contact_phone">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400/80">person</span>
                    </div>
                    <InfoItem label="Full Name" value={student.responsiblePerson?.name} />
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
              <ProfileSection title="Attendance Stats" icon="analytics">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4"
                        strokeDasharray="94 100"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-display text-slate-900 dark:text-slate-100">94%</span>
                      <span className="text-label text-slate-400/80">Presence</span>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center border border-emerald-100 dark:border-emerald-800/50">
                      <span className="block text-section text-emerald-600 dark:text-emerald-400">182</span>
                      <span className="text-label text-slate-500/80">Present</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl text-center border border-rose-100 dark:border-rose-800/50">
                      <span className="block text-section text-rose-600 dark:text-rose-400">12</span>
                      <span className="text-label text-slate-500/80">Absent</span>
                    </div>
                  </div>
                </div>
              </ProfileSection>

              {/* Additional Notes */}
              <ProfileSection title="Administrative Notes" icon="notes">
                <p className="text-label text-slate-600 dark:text-slate-400/80 leading-relaxed italic bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {student.notes || "No additional notes recorded for this student record."}
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
const PrintableFooter = () => (
  <div className="mt-8 text-center">
    <p className="text-[9px] text-slate-400 italic">Official School Seal Required. This document remains valid for administrative purposes in the absence of a physical seal.</p>
  </div>
);

const PrintableStudentProfile = ({ student, classes, schoolSettings }) => {
  const { name: schoolName, logo, phone, email, address } = schoolSettings || {};
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
            <p className="text-label text-slate-500/80">Official Student Document</p>
          </div>
        </div>
        <div className="text-right text-label leading-relaxed text-slate-600">
          <p>{address}</p>
          <p>Phone: {phone}</p>
          <p>Email: {email}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-section border-l-4 border-primary pl-4">Student Profile Record</h2>
        <div className="text-right">
          <p className="text-label text-slate-400/80">Issue Date</p>
          <p className="text-label">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* PDF BODY */}
      <div className="space-y-6 flex-1">
        {/* Personal & Academic */}
        <div className="grid grid-cols-2 gap-8">
          <div className="print-section">
            <h3 className="print-section-title">Personal Information</h3>
            <div className="print-grid">
              <PrintItem label="Full Name" value={student.name} />
              <PrintItem label="Gender" value={student.gender} />
              <PrintItem label="Birth Date" value={student.birthDate} />
              <PrintItem label="Birth Place" value={student.birthPlace} />
              <PrintItem label="Phone" value={student.phone} />
              <PrintItem label="Mother Name" value={student.motherName} />
            </div>
          </div>
          <div className="print-section">
            <h3 className="print-section-title">Academic Details</h3>
            <div className="print-grid">
              <PrintItem label="Assigned Class" value={classes.find(c => String(c.id) === String(student.classId))?.name} />
              <PrintItem label="Student ID" value={`#${student.id}`} />
              <PrintItem label="Registration Date" value={student.registrationDate} />
              <PrintItem label="Registration Type" value={student.registrationType} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="print-section">
          <h3 className="print-section-title">Residential Address</h3>
          <div className="print-grid grid-cols-4">
            <PrintItem label="Country" value={student.address?.country} />
            <PrintItem label="State" value={student.address?.state} />
            <PrintItem label="City" value={student.address?.city} />
            <PrintItem label="Neighborhood" value={student.address?.neighborhood} />
            <div className="col-span-full mt-2">
              <PrintItem label="Full Address Details" value={student.address?.fullAddress} />
            </div>
          </div>
        </div>

        {/* Family & Special */}
        <div className="grid grid-cols-2 gap-8">
          <div className="print-section">
            <h3 className="print-section-title">Family & Health Status</h3>
            <div className="print-grid">
              <PrintItem label="Parent Status" value={student.parentStatus} />
              <PrintItem label="Disability" value={student.specialConditions?.disability ? 'Yes' : 'None'} />
              <PrintItem label="Refugee Status" value={student.specialConditions?.refugee ? 'Yes' : 'No'} />
            </div>
          </div>
          <div className="print-section">
            <h3 className="print-section-title">Responsible Person</h3>
            <div className="print-grid">
              <PrintItem label="Contact Name" value={student.responsiblePerson?.name} />
              <PrintItem label="Primary Phone" value={student.responsiblePerson?.phone1} />
              <PrintItem label="Secondary Phone" value={student.responsiblePerson?.phone2 || 'N/A'} />
            </div>
          </div>
        </div>
      </div>

      {/* PDF FOOTER (Signatures) */}
      <div className="mt-auto grid grid-cols-2 gap-12 pt-8">
        <div className="signature-area text-center border-t-2 border-slate-900 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest">Manager's Signature</p>
        </div>
        <div className="signature-area text-center border-t-2 border-slate-900 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest">Responsible Person's Signature</p>
        </div>
      </div>
      <PrintableFooter />
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
