import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const TeachersPage = () => {
 const {
 teachers,
 classes,
 subjects,
 addTeacher,
 updateTeacher,
 deleteTeacher,
 addNotification
 } = useData();
 const { schoolName, t } = useSettings();

 // Search & Filter State
 const [searchTerm, setSearchTerm] = useState('');
 const [filters, setFilters] = useState({
 status: '',
 educationLevel: '',
 certificateLevel: '',
 languages: '',
 classId: ''
 });

 // Modal States
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [selectedTeacher, setSelectedTeacher] = useState(null);
 const [editingTeacher, setEditingTeacher] = useState(null);

 // Filter Logic
 const filteredTeachers = useMemo(() => {
 return teachers.filter(teacher => {
 const matchesSearch =
 (teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (teacher.phone || '').includes(searchTerm);

 const matchesStatus = !filters.status || teacher.status === filters.status;
 const matchesEducation = !filters.educationLevel || teacher.educationLevel === filters.educationLevel;
 const matchesCertificate = !filters.certificateLevel || teacher.lastCertificate === filters.certificateLevel;

 let matchesLanguage = true;
 if (filters.languages) {
 matchesLanguage = teacher.languages?.[filters.languages.toLowerCase()] === true;
 }

 const matchesClass = !filters.classId || (teacher.assignedClasses || []).includes(parseInt(filters.classId));

 return matchesSearch && matchesStatus && matchesEducation && matchesCertificate && matchesLanguage && matchesClass;
 });
 }, [teachers, searchTerm, filters]);

 // Handlers
 const handleAdd = () => {
 setEditingTeacher(null);
 setIsFormOpen(true);
 };

 const handleEdit = (teacher, e) => {
 e.stopPropagation();
 setEditingTeacher(teacher);
 setIsFormOpen(true);
 };

 const handleDelete = (id, e) => {
 e.stopPropagation();
 if (window.confirm('Are you sure you want to delete this teacher?')) {
 deleteTeacher(id);
 addNotification('Teacher deleted successfully', 'success');
 }
 };

 const handleViewProfile = (teacher) => {
 setSelectedTeacher(teacher);
 setIsProfileOpen(true);
 };

 const handleSave = (teacherData) => {
 if (editingTeacher) {
 updateTeacher(editingTeacher.id, teacherData);
 addNotification('Teacher updated successfully', 'success');
 } else {
 addTeacher(teacherData);
 addNotification('Teacher added successfully', 'success');
 }
 setIsFormOpen(false);
 };

 return (
 <PageLayout role="admin" title={t('teachers')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-page-title text-slate-900 dark:text-white">{t('teachers')}</h2>
 <p className="text-body-sm text-slate-500/80 mt-1">{t('teachersSubtitle')}</p>
 </div>

 {/* 1. TOP CONTROL BAR */}
 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
 <div className="flex items-center gap-4 flex-1 min-w-[300px]">
 <div className="relative flex-1">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/80">search</span>
 <input
 type="text"
 placeholder="Search by name, email, or phone..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
 />
 </div>

 <div className="flex gap-2">
 <select
 value={filters.status}
 onChange={(e) => setFilters({ ...filters, status: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">Status</option>
 <option value="Active">Active</option>
 <option value="On Leave">On Leave</option>
 <option value="Inactive">Inactive</option>
 </select>
 <select
 value={filters.educationLevel}
 onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">Education</option>
 <option value="High School">High School</option>
 <option value="University">University</option>
 </select>
 <select
 value={filters.certificateLevel}
 onChange={(e) => setFilters({ ...filters, certificateLevel: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">Certificate</option>
 <option value="Bachelor">Bachelor</option>
 <option value="Master">Master</option>
 <option value="PhD">PhD</option>
 </select>
 <select
 value={filters.languages}
 onChange={(e) => setFilters({ ...filters, languages: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">Language</option>
 <option value="Somali">Somali</option>
 <option value="English">English</option>
 <option value="Arabic">Arabic</option>
 </select>
 <select
 value={filters.classId}
 onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">Assigned Class</option>
 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 </div>

 <button
 onClick={handleAdd}
 className="bg-primary text-white px-6 py-2.5 rounded-xl text-body-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 text-button"
 >
 <span className="material-symbols-outlined text-kpi-value">person_add</span>
 Add Teacher
 </button>
 </div>

 {/* 2. TEACHERS TABLE */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors table-container">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr>
 <th>Full Name</th>
 <th>Contact</th>
 <th>Assigned Classes</th>
 <th>Status</th>
 <th className="text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {filteredTeachers.map(teacher => (
 <tr
 key={teacher.id}
 className="table-row-hover group"
 >
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-slate-800 dark:text-slate-200">{teacher.name}</span>
 <span className="text-body-sm text-slate-400/80">{teacher.specialty}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400/80">
 <span className="material-symbols-outlined text-body-md">mail</span>
 <span className="text-body-sm truncate max-w-[150px]">{teacher.email}</span>
 </div>
 <div className="flex items-center gap-1.5 text-slate-400/80">
 <span className="material-symbols-outlined text-body-md">phone</span>
 <span className="text-body-sm">{teacher.phone}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1 max-w-[200px]">
 {(teacher.assignedClasses || []).map(cid => (
 <span key={cid} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-body-sm">
 {classes.find(c => c.id === cid)?.name || 'Class'}
 </span>
 ))}
 {(!teacher.assignedClasses || teacher.assignedClasses.length === 0) && (
 <span className="text-slate-400/80 text-body-sm italic">Unassigned</span>
 )}
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-body-sm  ${teacher.status === 'Active'
 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
 : teacher.status === 'On Leave'
 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
 : 'bg-slate-100 text-slate-500/80 dark:bg-slate-800'
 }`}>
 {teacher.status || 'Active'}
 </span>
 </td>
 <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => handleViewProfile(teacher)}
 className="p-1.5 text-slate-400/80 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
 title="View Profile"
 >
 <span className="material-symbols-outlined text-section-title">visibility</span>
 </button>
 <button
 onClick={(e) => handleEdit(teacher, e)}
 className="p-1.5 text-slate-400/80 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
 title="Edit"
 >
 <span className="material-symbols-outlined text-section-title">edit</span>
 </button>
 <button
 onClick={(e) => handleDelete(teacher.id, e)}
 className="p-1.5 text-slate-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
 title="Delete"
 >
 <span className="material-symbols-outlined text-section-title">delete</span>
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filteredTeachers.length === 0 && (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-slate-400/80">
 <span className="material-symbols-outlined text-kpi-value mb-2 opacity-30">person_off</span>
 <p>No teachers found matching your search.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* 3. TEACHER PROFILE VIEW */}
 {isProfileOpen && selectedTeacher && (
 <TeacherProfile
 teacher={selectedTeacher}
 onClose={() => setIsProfileOpen(false)}
 classes={classes}
 schoolName={schoolName}
 />
 )}

 {/* 4. ADD/EDIT TEACHER FORM */}
 {isFormOpen && (
 <TeacherForm
 teacher={editingTeacher}
 onClose={() => setIsFormOpen(false)}
 onSave={handleSave}
 classes={classes}
 subjects={subjects}
 />
 )}

 {/* 5. HIDDEN PRINTABLE COMPONENT */}
 {selectedTeacher && (
 <PrintableTeacherProfile
 teacher={selectedTeacher}
 classes={classes}
 schoolName={schoolName}
 />
 )}
 </PageLayout>
 );
};

/**
 * TEACHER FORM COMPONENT
 * Structured into 10 Sections as requested.
 */
const TeacherForm = ({ teacher, onClose, onSave, classes, subjects }) => {
 const [formData, setFormData] = useState({
 name: '',
 maritalStatus: 'Single',
 address: '',
 email: '',
 phone: '',
 specialty: '',
 subjects: [],
 assignedClasses: [],
 startedDate: '',
 joinedDate: new Date().toISOString().split('T')[0],
 educationLevel: 'University',
 lastCertificate: 'Bachelor',
 extraCertificates: '',
 trainedAsTeacher: false,
 whereTrained: '',
 languages: { somali: false, english: false, arabic: false, other: '' },
 relatedPerson: { name: '', relation: '', address: '', phone: '', email: '' },
 registrationType: 'Exam',
 status: 'Active',
 notes: '',
 ...teacher,
 subjects: teacher?.subjects || [],
 assignedClasses: teacher?.assignedClasses || [],
 languages: { somali: false, english: false, arabic: false, other: '', ...(teacher?.languages || {}) },
 relatedPerson: { name: '', relation: '', address: '', phone: '', email: '', ...(teacher?.relatedPerson || {}) }
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

 const toggleLanguage = (lang) => {
 setFormData(prev => ({
 ...prev,
 languages: { ...prev.languages, [lang]: !prev.languages[lang] }
 }));
 };

 const toggleMultiSelect = (field, value) => {
 setFormData(prev => {
 const current = prev[field] || [];
 const updated = current.includes(value)
 ? current.filter(v => v !== value)
 : [...current, value];
 return { ...prev, [field]: updated };
 });
 };

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
 <form 
 onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
 className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]"
 >
 <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl shrink-0">
 <h3 className="text-slate-900 dark:text-slate-100 text-section-title flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">person_add</span>
 {teacher ? 'Edit Teacher Details' : 'Register New Teacher'}
 </h3>
 <button onClick={onClose} className="p-2 text-slate-400/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>

 <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto space-y-8 md:space-y-12">

 {/* SECTION 1 — BASIC INFO */}
 <section>
 <FormSectionHeader icon="person" title="Section 1: Basic Information" />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Full Name</label>
 <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="form-input-custom" placeholder="Full Name" required />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Marital Status</label>
 <select value={formData.maritalStatus} onChange={e => handleChange('maritalStatus', e.target.value)} className="form-input-custom cursor-pointer">
 <option value="Single">Single</option>
 <option value="Married">Married</option>
 </select>
 </div>
 <div className="col-span-full">
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Residential Address</label>
 <input type="text" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} className="form-input-custom" placeholder="Full Address" />
 </div>
 </div>
 </section>

 {/* SECTION 2 — CONTACT */}
 <section>
 <FormSectionHeader icon="contact_mail" title="Section 2: Contact Details" />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Email Address (Login Username)</label>
 <input type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} className="form-input-custom" placeholder="email@school.com" required />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Phone Number</label>
 <input type="text" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="form-input-custom" placeholder="+123..." required />
 </div>
 </div>
 </section>

 {/* SECTION 3 — PROFESSIONAL INFO */}
 <section>
 <FormSectionHeader icon="work" title="Section 3: Professional Info" />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Specialty</label>
 <input type="text" value={formData.specialty || ''} onChange={e => handleChange('specialty', e.target.value)} className="form-input-custom" placeholder="e.g. Physics, History" />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Subjects (Multi-select)</label>
 <div className="flex flex-wrap gap-2 mt-2">
 {subjects.map(s => (
 <button
 key={s.id}
 type="button"
 onClick={() => toggleMultiSelect('subjects', s.name)}
 className={`px-3 py-1.5 rounded-lg text-body-sm  transition-all border ${formData.subjects.includes(s.name)
 ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400/80 border-slate-200 dark:border-slate-700 hover:border-primary/50'
 }`}
 >
 {s.name}
 </button>
 ))}
 </div>
 </div>
 <div className="col-span-full">
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Assign Classes (Multi-select)</label>
 <div className="flex flex-wrap gap-2 mt-2">
 {classes.map(c => (
 <button
 key={c.id}
 type="button"
 onClick={() => toggleMultiSelect('assignedClasses', c.id)}
 className={`px-3 py-1.5 rounded-lg text-body-sm  transition-all border ${formData.assignedClasses.includes(c.id)
 ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400/80 border-slate-200 dark:border-slate-700 hover:border-primary/50'
 }`}
 >
 {c.name}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Started Date (In Profession)</label>
 <input type="date" value={formData.startedDate || ''} onChange={e => handleChange('startedDate', e.target.value)} className="form-input-custom" />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Joined Date (At School)</label>
 <input type="date" value={formData.joinedDate || ''} onChange={e => handleChange('joinedDate', e.target.value)} className="form-input-custom" />
 </div>
 </div>
 </section>

 {/* SECTION 4 — EDUCATION */}
 <section>
 <FormSectionHeader icon="school" title="Section 4: Education History" />
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Education Level</label>
 <select value={formData.educationLevel} onChange={e => handleChange('educationLevel', e.target.value)} className="form-input-custom">
 <option value="High School">High School</option>
 <option value="University">University</option>
 </select>
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Last Certificate</label>
 <select value={formData.lastCertificate} onChange={e => handleChange('lastCertificate', e.target.value)} className="form-input-custom">
 <option value="Diploma">Diploma</option>
 <option value="Bachelor">Bachelor</option>
 <option value="Master">Master</option>
 <option value="PhD">PhD</option>
 </select>
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Extra Certificates</label>
 <input type="text" value={formData.extraCertificates || ''} onChange={e => handleChange('extraCertificates', e.target.value)} className="form-input-custom" placeholder="Other certs..." />
 </div>
 </div>
 </section>

 {/* SECTION 5 — TRAINING */}
 <section>
 <FormSectionHeader icon="model_training" title="Section 5: Teacher Training" />
 <div className="space-y-4">
 <label className="flex items-center gap-3 cursor-pointer group">
 <input
 type="checkbox"
 checked={formData.trainedAsTeacher}
 onChange={e => handleChange('trainedAsTeacher', e.target.checked)}
 className="w-5 h-5 text-primary rounded border-slate-300"
 />
 <span className="text-body-sm text-slate-700 dark:text-slate-200">Trained as Professional Teacher?</span>
 </label>
 {formData.trainedAsTeacher && (
 <div className="animate-in slide-in-from-top-2 duration-300">
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Where Trained?</label>
 <input type="text" value={formData.whereTrained || ''} onChange={e => handleChange('whereTrained', e.target.value)} className="form-input-custom md:w-1/2" placeholder="Institute Name" />
 </div>
 )}
 </div>
 </section>

 {/* SECTION 6 — LANGUAGES */}
 <section>
 <FormSectionHeader icon="translate" title="Section 6: Language Proficiency" />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {['Somali', 'English', 'Arabic'].map(lang => (
 <label key={lang} className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
 <input
 type="checkbox"
 checked={formData.languages[lang.toLowerCase()]}
 onChange={() => toggleLanguage(lang.toLowerCase())}
 className="w-5 h-5 text-primary rounded border-slate-300"
 />
 <span className="text-body-sm text-slate-700 dark:text-slate-200">{lang}</span>
 </label>
 ))}
 <div className="col-span-full mt-2">
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Other Languages</label>
 <input type="text" value={formData.languages.other} onChange={e => handleChange('languages.other', e.target.value)} className="form-input-custom" placeholder="e.g. French, Turkish" />
 </div>
 </div>
 </section>

 {/* SECTION 7 — RELATED PERSON */}
 <section>
 <FormSectionHeader icon="family_restroom" title="Section 7: Related Person" />
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Full Name</label>
 <input type="text" value={formData.relatedPerson.name} onChange={e => handleChange('relatedPerson.name', e.target.value)} className="form-input-custom" />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Relation Type</label>
 <input type="text" value={formData.relatedPerson.relation} onChange={e => handleChange('relatedPerson.relation', e.target.value)} className="form-input-custom" placeholder="e.g. Spouse, Parent" />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Phone Number</label>
 <input type="text" value={formData.relatedPerson.phone} onChange={e => handleChange('relatedPerson.phone', e.target.value)} className="form-input-custom" />
 </div>
 <div className="lg:col-span-2">
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Address</label>
 <input type="text" value={formData.relatedPerson.address} onChange={e => handleChange('relatedPerson.address', e.target.value)} className="form-input-custom" />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 dark:text-slate-400/80 mb-1.5 block">Email (Optional)</label>
 <input type="email" value={formData.relatedPerson.email} onChange={e => handleChange('relatedPerson.email', e.target.value)} className="form-input-custom" />
 </div>
 </div>
 </section>

 {/* SECTION 8 — REGISTRATION */}
 <section>
 <FormSectionHeader icon="app_registration" title="Section 8: Registration Type" />
 <div className="flex gap-8">
 {['Exam', 'Other'].map(t => (
 <label key={t} className="flex items-center gap-3 cursor-pointer group">
 <input type="radio" name="regType" value={t} checked={formData.registrationType === t} onChange={e => handleChange('registrationType', e.target.value)} className="w-5 h-5 text-primary focus:ring-primary/20" />
 <span className="text-body-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{t}</span>
 </label>
 ))}
 </div>
 </section>

 {/* SECTION 9 — EMPLOYMENT */}
 <section>
 <FormSectionHeader icon="badge" title="Section 9: Employment Status" />
 <div className="flex gap-8">
 {['Active', 'On Leave', 'Inactive'].map(s => (
 <label key={s} className="flex items-center gap-3 cursor-pointer group">
 <input type="radio" name="empStatus" value={s} checked={formData.status === s} onChange={e => handleChange('status', e.target.value)} className="w-5 h-5 text-primary focus:ring-primary/20" />
 <span className="text-body-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{s}</span>
 </label>
 ))}
 </div>
 </section>

 {/* SECTION 10 — NOTES */}
 <section>
 <FormSectionHeader icon="notes" title="Section 10: Additional Notes" />
 <textarea rows="4" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="form-input-custom" placeholder="Details about performance, history, etc."></textarea>
 </section>
 </div>

 <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl shrink-0">
 <button type="button" onClick={onClose} className="px-6 py-2.5 text-body-sm text-slate-500/80 dark:text-slate-400/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
 <button type="submit" className="px-8 py-2.5 bg-primary text-white text-body-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all transform active:scale-95">Save teacher record</button>
 </div>
 </form>
 </div>
 );
};

const TeacherProfile = ({ teacher, onClose, classes, schoolName }) => {
 const handlePrint = () => {
 window.print();
 };

 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
 <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-700/50 my-auto overflow-hidden animate-in zoom-in-95 duration-400">
 <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-indigo-600 text-white relative">
 <div className="flex items-center gap-6 relative z-10">
 <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-kpi-value shadow-inner">
 {teacher.name ? teacher.name[0] : 'T'}
 </div>
 <div>
 <h3 className="text-kpi-value mb-1">{teacher.name}</h3>
 <div className="flex flex-wrap gap-3 mt-2">
 <span className="flex items-center gap-1 text-white/80 text-body-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
 <span className="material-symbols-outlined text-body-md">work</span>
 {teacher.specialty}
 </span>
 <span className="flex items-center gap-1 text-white/80 text-body-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
 <span className="material-symbols-outlined text-body-md">mail</span>
 {teacher.email}
 </span>
 <span className="flex items-center gap-1 text-white/80 text-body-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
 <span className="material-symbols-outlined text-body-md">phone</span>
 {teacher.phone}
 </span>
 </div>
 </div>
 </div>
 <div className="flex gap-2 relative z-10">
 <button
 onClick={handlePrint}
 className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-body-sm"
 >
 <span className="material-symbols-outlined text-kpi-value">print</span>
 Print Profile
 </button>
 <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
 <span className="material-symbols-outlined text-white">close</span>
 </button>
 </div>
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
 </div>

 <div className="p-8 max-h-[75vh] overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">

 <ProfileSection title="Professional Information" icon="work">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
 <InfoItem label="Specialty" value={teacher.specialty} />
 <InfoItem label="Joined Date" value={teacher.joinedDate} />
 <InfoItem label="Professional Start" value={teacher.startedDate} />
 <div className="col-span-full">
 <p className="text-body-sm text-slate-400/80 mb-3">Subjects Taught</p>
 <div className="flex flex-wrap gap-2">
 {teacher.subjects?.map(s => (
 <span key={s} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-body-sm border border-indigo-100 dark:border-indigo-800">
 {s}
 </span>
 ))}
 </div>
 </div>
 </div>
 </ProfileSection>

 <ProfileSection title="Education & Training" icon="school">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
 <InfoItem label="Education Level" value={teacher.educationLevel} />
 <InfoItem label="Last Certificate" value={teacher.lastCertificate} />
 <InfoItem label="Extra Certificates" value={teacher.extraCertificates} />
 <div className="col-span-full pt-4 border-t border-slate-100 dark:border-slate-800/50">
 <InfoItem label="Professional Training" value={teacher.trainedAsTeacher ? `Yes - Trained at ${teacher.whereTrained}` : 'No Formal Training'} />
 </div>
 </div>
 </ProfileSection>

 <ProfileSection title="Languages" icon="translate">
 <div className="flex flex-wrap gap-4">
 {Object.entries(teacher.languages || {}).map(([lang, proficient]) => {
 if (lang === 'other' && proficient) return <ProfileBadge key={lang} label={proficient} color="amber" icon="language" />;
 if (proficient && lang !== 'other') return <ProfileBadge key={lang} label={lang.charAt(0).toUpperCase() + lang.slice(1)} color="slate" icon="check_circle" />;
 return null;
 })}
 </div>
 </ProfileSection>

 <ProfileSection title="Related Person" icon="family_restroom">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
 <InfoItem label="Full Name" value={teacher.relatedPerson?.name} />
 <InfoItem label="Relation" value={teacher.relatedPerson?.relation} />
 <InfoItem label="Phone" value={teacher.relatedPerson?.phone} />
 <InfoItem label="Email" value={teacher.relatedPerson?.email} />
 <div className="col-span-full">
 <InfoItem label="Address" value={teacher.relatedPerson?.address} />
 </div>
 </div>
 </ProfileSection>
 </div>

 <div className="space-y-8">
 <ProfileSection title="Assigned Classes" icon="groups">
 <div className="space-y-3">
 {(teacher.assignedClasses || []).map(cid => {
 const cls = classes.find(c => c.id === cid);
 return (
 <div key={cid} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
 <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
 <span className="material-symbols-outlined text-indigo-600 text-section-title">class</span>
 </div>
 <div>
 <p className="text-body-sm text-slate-800 dark:text-slate-100">{cls?.name}</p>
 <p className="text-body-sm text-slate-400/80">Active Class</p>
 </div>
 </div>
 );
 })}
 </div>
 </ProfileSection>

 <ProfileSection title="Employment Status" icon="badge">
 <div className="flex flex-col gap-4">
 <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
 <InfoItem label="Current Status" value={teacher.status} />
 <div className="mt-2">
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-body-sm  ${teacher.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
 }`}>
 Official
 </span>
 </div>
 </div>
 <InfoItem label="Registration Type" value={teacher.registrationType} />
 </div>
 </ProfileSection>

 <ProfileSection title="Notes" icon="notes">
 <p className="text-body-sm text-slate-600 dark:text-slate-400/80 italic leading-relaxed">
 {teacher.notes || "No administrative notes provided."}
 </p>
 </ProfileSection>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

const PrintableTeacherProfile = ({ teacher, classes, schoolName }) => {
 return (
 <div className="print-only font-sans text-slate-900 bg-white">
 <div className="print-header flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
 <span className="material-symbols-outlined text-kpi-value">work</span>
 </div>
 <div>
 <h1 className="text-kpi-value">{schoolName}</h1>
 <p className="text-body-sm text-slate-500/80">Official Teacher Record</p>
 </div>
 </div>
 <div className="text-right text-body-sm leading-relaxed text-slate-600">
 <p className="text-slate-900">HR Department</p>
 <p>Main Campus, Administrative Block</p>
 <p>Phone: +1 (234) 567-8900</p>
 <p>Email: hr@school.com</p>
 <p className="mt-1 font-mono text-body-sm text-slate-400/80">Employee ID: TCH-{teacher.id}</p>
 </div>
 </div>

 <div className="flex justify-between items-center mb-8">
 <h2 className="text-section-title border-l-4 border-indigo-600 pl-4">Teacher Performance & Profile Record</h2>
 <div className="text-right">
 <p className="text-body-sm text-slate-400/80">Issue Date</p>
 <p className="text-body-sm">{new Date().toLocaleDateString()}</p>
 </div>
 </div>

 <div className="space-y-8">
 <div className="grid grid-cols-2 gap-8">
 <div className="print-section">
 <h3 className="print-section-title">Personal & Contact Info</h3>
 <div className="print-grid">
 <PrintItem label="Full Name" value={teacher.name} />
 <PrintItem label="Marital Status" value={teacher.maritalStatus} />
 <PrintItem label="Email" value={teacher.email} />
 <PrintItem label="Phone" value={teacher.phone} />
 <div className="col-span-full">
 <PrintItem label="Residential Address" value={teacher.address} />
 </div>
 </div>
 </div>
 <div className="print-section">
 <h3 className="print-section-title">Professional Details</h3>
 <div className="print-grid">
 <PrintItem label="Specialty" value={teacher.specialty} />
 <PrintItem label="Subjects" value={teacher.subjects?.join(', ')} />
 <PrintItem label="Joined Date" value={teacher.joinedDate} />
 <PrintItem label="Status" value={teacher.status} />
 </div>
 </div>
 </div>

 <div className="print-section">
 <h3 className="print-section-title">Education & Training</h3>
 <div className="print-grid grid-cols-3">
 <PrintItem label="Education Level" value={teacher.educationLevel} />
 <PrintItem label="Last Certificate" value={teacher.lastCertificate} />
 <PrintItem label="Professional Training" value={teacher.trainedAsTeacher ? `Yes - ${teacher.whereTrained}` : 'No'} />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="print-section">
 <h3 className="print-section-title">Related Person (Emergency)</h3>
 <div className="print-grid">
 <PrintItem label="Name" value={teacher.relatedPerson?.name} />
 <PrintItem label="Relation" value={teacher.relatedPerson?.relation} />
 <PrintItem label="Phone" value={teacher.relatedPerson?.phone} />
 </div>
 </div>
 <div className="print-section">
 <h3 className="print-section-title">Assigned Classes</h3>
 <div className="flex flex-wrap gap-2 mt-2">
 {(teacher.assignedClasses || []).map(cid => (
 <span key={cid} className="px-2 py-1 bg-slate-100 rounded text-body-sm border border-slate-200">
 {classes.find(c => c.id === cid)?.name}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="fixed bottom-12 left-12 right-12 flex justify-between pt-8 border-t border-slate-200">
 <div className="text-center w-48">
 <div className="h-16 border-b border-slate-300 mb-2"></div>
 <p className="text-body-sm text-slate-500/80">Manager Signature</p>
 </div>
 <div className="text-center w-48">
 <div className="h-16 border-b border-slate-300 mb-2"></div>
 <p className="text-body-sm text-slate-500/80">Teacher Signature</p>
 </div>
 </div>
 </div>
 );
};

// Helper Components
const FormSectionHeader = ({ icon, title }) => (
 <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-kpi-value">{icon}</span>
 </div>
 <h4 className="text-slate-800 dark:text-slate-100 text-body-sm">{title}</h4>
 </div>
);

const ProfileSection = ({ title, icon, children }) => (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
 <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
 <span className="material-symbols-outlined text-primary text-section-title">{icon}</span>
 <h4 className="text-body-sm text-slate-500/80 dark:text-slate-400/80">{title}</h4>
 </div>
 <div className="p-6">
 {children}
 </div>
 </div>
);

const InfoItem = ({ label, value }) => (
 <div className="space-y-1">
 <p className="text-body-sm text-slate-400/80">{label}</p>
 <p className="text-body-sm text-slate-700 dark:text-slate-200">{value || 'N/A'}</p>
 </div>
);

const PrintItem = ({ label, value }) => (
 <div className="space-y-1">
 <p className="text-body-sm text-slate-400/80">{label}</p>
 <p className="text-body-sm text-slate-800">{value || 'N/A'}</p>
 </div>
);

const ProfileBadge = ({ label, color, icon }) => (
 <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-body-sm   
 ${color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
 'bg-slate-50 dark:bg-slate-800 text-slate-500/80 border-slate-100 dark:border-slate-800'} 
 border shadow-sm`}>
 <span className="material-symbols-outlined text-section-title">{icon}</span>
 {label}
 </span>
);

export default TeachersPage;
