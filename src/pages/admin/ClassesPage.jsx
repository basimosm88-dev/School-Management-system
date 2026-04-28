import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';

const ClassesPage = () => {
  const { 
    classes, 
    teachers, 
    students,
    subjects,
    addClass, 
    updateClass, 
    deleteClass,
    assignStudentToClass,
    removeStudentFromClass,
    assignSubjectToClass,
    addNotification 
  } = useData();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: '',
    status: '',
    academicYear: ''
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  // Filter Logic
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = 
        (cls.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.gradeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.section || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = !filters.level || cls.level === filters.level;
      const matchesStatus = !filters.status || cls.status === filters.status;
      const matchesYear = !filters.academicYear || cls.academicYear === filters.academicYear;

      return matchesSearch && matchesLevel && matchesStatus && matchesYear;
    });
  }, [classes, searchTerm, filters]);

  // Handlers
  const handleAdd = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cls, e) => {
    e.stopPropagation();
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this class section? This cannot be undone.')) {
      deleteClass(id);
      addNotification('Class section deleted successfully', 'success');
    }
  };

  const handleViewProfile = (cls) => {
    setSelectedClass(cls);
    setIsProfileOpen(true);
  };

  const handleSave = (classData) => {
    if (editingClass) {
      updateClass(editingClass.id, classData);
      addNotification('Class updated successfully', 'success');
    } else {
      addClass(classData);
      addNotification('New class section created successfully', 'success');
    }
    setIsFormOpen(false);
  };

  return (
    <PageLayout role="admin" title="Classes & Sections">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. TOP CONTROL BAR */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by grade or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <option value="">Level</option>
                <option value="Primary">Primary</option>
                <option value="Middle">Middle</option>
                <option value="Secondary">Secondary</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <option value="">Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Add Class Section
          </button>
        </div>

        {/* 2. CLASSES TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Class Name</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Students</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Supervisor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClasses.map(cls => {
                  const supervisor = teachers.find(t => t.id === parseInt(cls.teacherId));
                  return (
                    <tr
                      key={cls.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => handleViewProfile(cls)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{cls.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cls.academicYear}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {cls.level}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                (cls.studentsCount / cls.capacity) > 0.9 ? 'bg-rose-500' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(100, (cls.studentsCount / cls.capacity) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {cls.studentsCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">
                        {cls.capacity}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {supervisor?.name?.[0] || '?'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {supervisor?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          cls.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                            : cls.status === 'Completed'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {cls.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewProfile(cls)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="View Class"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={(e) => handleEdit(cls, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(cls.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. CLASS FORM MODAL */}
      {isFormOpen && (
        <ClassForm
          cls={editingClass}
          teachers={teachers}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* 4. CLASS PROFILE MODAL */}
      {isProfileOpen && selectedClass && (
        <ClassProfile
          cls={selectedClass}
          onClose={() => setIsProfileOpen(false)}
          teachers={teachers}
          students={students}
          subjects={subjects}
          onAssignStudent={assignStudentToClass}
          onRemoveStudent={removeStudentFromClass}
          onAssignSubject={assignSubjectToClass}
          addNotification={addNotification}
        />
      )}
    </PageLayout>
  );
};

const ClassForm = ({ cls, teachers, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    gradeName: '',
    section: '',
    level: 'Secondary',
    capacity: 30,
    teacherId: '',
    assistantTeacher: '',
    academicYear: '2025-2026',
    status: 'Active',
    notes: '',
    ...cls
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_box</span>
            {cls ? 'Edit Class Section' : 'Create New Class Section'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Basic Info */}
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Basic Information</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Grade Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Grade 10" 
                  className="form-input-custom" 
                  value={formData.gradeName || ''}
                  onChange={e => handleChange('gradeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Section</label>
                <input 
                  type="text" 
                  placeholder="e.g. A" 
                  className="form-input-custom" 
                  value={formData.section || ''}
                  onChange={e => handleChange('section', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-full">
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Education Level</label>
                <select 
                  className="form-input-custom"
                  value={formData.level}
                  onChange={e => handleChange('level', e.target.value)}
                >
                  <option value="Primary">Primary</option>
                  <option value="Middle">Middle</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Capacity & Academic */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800">
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Capacity</h4>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Maximum Students</label>
              <input 
                type="number" 
                className="form-input-custom" 
                value={formData.capacity || ''}
                onChange={e => handleChange('capacity', parseInt(e.target.value))}
              />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Academic Year</h4>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Year</label>
              <input 
                type="text" 
                className="form-input-custom" 
                value={formData.academicYear || ''}
                onChange={e => handleChange('academicYear', e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Supervision */}
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Supervision</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Class Supervisor</label>
                <select 
                  className="form-input-custom"
                  value={formData.teacherId}
                  onChange={e => handleChange('teacherId', e.target.value)}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Assistant Teacher (Optional)</label>
                <input 
                  type="text" 
                  className="form-input-custom" 
                  value={formData.assistantTeacher || ''}
                  onChange={e => handleChange('assistantTeacher', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Notes */}
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Status</label>
                <div className="flex gap-4">
                  {['Active', 'Completed', 'Archived'].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value={s} 
                        checked={formData.status === s}
                        onChange={e => handleChange('status', e.target.value)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Notes</label>
              <textarea 
                className="form-input-custom min-h-[100px]" 
                value={formData.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            Save Class Section
          </button>
        </div>
      </div>
    </div>
  );
};

const ClassProfile = ({ 
  cls, 
  onClose, 
  teachers, 
  students, 
  subjects, 
  onAssignStudent, 
  onRemoveStudent, 
  onAssignSubject,
  addNotification
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const supervisor = teachers.find(t => t.id === parseInt(cls.teacherId));
  const classStudents = students.filter(s => s.classId === cls.id);
  const unassignedStudents = students.filter(s => !s.classId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in zoom-in-95 duration-400">
        
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 relative">
          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <span className="material-symbols-outlined text-[40px]">class</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{cls.name}</h3>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    {cls.level} Level
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {cls.academicYear}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                    cls.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {cls.status}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-8 mt-10">
            {['Overview', 'Students', 'Subjects & Teachers'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab.toLowerCase() 
                  ? 'text-primary' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full animate-in slide-in-from-bottom-1 duration-300"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-900">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stats Grid */}
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="stat-pill">
                    <p className="stat-label">Students</p>
                    <p className="stat-value">{cls.studentsCount || 0}</p>
                  </div>
                  <div className="stat-pill">
                    <p className="stat-label">Capacity</p>
                    <p className="stat-value">{cls.capacity}</p>
                  </div>
                  <div className="stat-pill">
                    <p className="stat-label">Subjects</p>
                    <p className="stat-value">{cls.subjects?.length || 0}</p>
                  </div>
                  <div className="stat-pill">
                    <p className="stat-label">Usage</p>
                    <p className="stat-value">{Math.round(((cls.studentsCount || 0) / cls.capacity) * 100)}%</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">Class Supervision</h4>
                  <div className="flex gap-6">
                    <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-black text-primary uppercase mb-2">Lead Supervisor</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary font-bold">
                          {supervisor?.name?.[0] || 'T'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{supervisor?.name || 'Unassigned'}</p>
                          <p className="text-xs text-slate-500">{supervisor?.specialty || 'General'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Assistant Teacher</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{cls.assistantTeacher || 'No Assistant'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">Description / Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {cls.notes || "No detailed notes provided for this class section."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
                  <h4 className="text-sm font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600/70">Average Grade</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">A-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600/70">Attendance Rate</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">94%</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-indigo-100 dark:border-indigo-800/50">
                    <button className="w-full py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">View Analytics</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Enrolled Students ({classStudents.length})</h4>
                <button 
                  onClick={() => setIsAddingStudent(!isAddingStudent)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Add Student
                </button>
              </div>

              {isAddingStudent && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Select Unassigned Student</p>
                  <div className="flex gap-4">
                    <select 
                      id="student-select"
                      className="form-input-custom flex-1"
                    >
                      <option value="">Choose a student...</option>
                      {unassignedStudents.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
                    </select>
                    <button 
                      onClick={() => {
                        const sid = parseInt(document.getElementById('student-select').value);
                        if (sid) {
                          if (classStudents.length >= cls.capacity) {
                            addNotification('Cannot add student: Class capacity reached!', 'error');
                            return;
                          }
                          onAssignStudent(sid, cls.id);
                          addNotification('Student assigned to class successfully', 'success');
                          setIsAddingStudent(false);
                        }
                      }}
                      className="px-6 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classStudents.map(student => (
                  <div key={student.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {student.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm(`Remove ${student.name} from this class?`)) {
                          onRemoveStudent(student.id, cls.id);
                          addNotification('Student removed from class', 'info');
                        }
                      }}
                      className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  </div>
                ))}
                {classStudents.length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">group_off</span>
                    <p className="text-slate-400 font-medium">No students enrolled in this section.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subjects & teachers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Academic Mapping</h4>
                <button 
                  onClick={() => setIsAddingSubject(!isAddingSubject)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                  Assign Subject
                </button>
              </div>

              {isAddingSubject && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Select Subject</label>
                      <select id="sub-select" className="form-input-custom w-full">
                        <option value="">Choose subject...</option>
                        {subjects
                          .filter(s => (s.levels || []).includes(cls.level) && s.status === 'Active')
                          .map(s => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.weeklyPeriods} periods/week)
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Assign Teacher</label>
                      <select id="teach-select" className="form-input-custom w-full">
                        <option value="">Choose teacher...</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setIsAddingSubject(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
                    <button 
                      onClick={() => {
                        const subName = document.getElementById('sub-select').value;
                        const teachId = document.getElementById('teach-select').value;
                        if (subName && teachId) {
                          onAssignSubject(cls.id, subName, teachId);
                          addNotification(`${subName} assigned to class`, 'success');
                          setIsAddingSubject(false);
                        }
                      }}
                      className="px-8 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(cls.subjects || []).map((sub, idx) => {
                  const teacher = teachers.find(t => t.id === sub.teacherId);
                  return (
                    <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400">auto_stories</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-slate-100">{sub.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span className="text-xs font-medium text-slate-500">{teacher?.name || 'Unknown Teacher'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher ID</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300"># {sub.teacherId}</p>
                      </div>
                    </div>
                  );
                })}
                {(cls.subjects || []).length === 0 && (
                  <div className="col-span-full py-16 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">menu_book</span>
                    <p className="text-slate-400 font-medium">No subjects assigned to this section yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">System Sync: OK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Academic Year: {cls.academicYear}</span>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Export Class Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;
