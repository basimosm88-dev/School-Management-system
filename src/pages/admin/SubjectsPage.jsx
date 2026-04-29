import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const SubjectsPage = () => {
 const { subjects, addSubject, updateSubject, deleteSubject, addNotification } = useData();
 const { t } = useSettings();

 // Search & Filter State
 const [searchTerm, setSearchTerm] = useState('');
 const [filters, setFilters] = useState({
 level: '',
 status: ''
 });

 // Modal States
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [editingSubject, setEditingSubject] = useState(null);

 // Filter Logic
 const filteredSubjects = useMemo(() => {
 return subjects.filter(sub => {
 const matchesSearch = (sub.name || '').toLowerCase().includes(searchTerm.toLowerCase());
 const matchesLevel = !filters.level || (sub.levels || []).includes(filters.level);
 const matchesStatus = !filters.status || sub.status === filters.status;

 return matchesSearch && matchesLevel && matchesStatus;
 });
 }, [subjects, searchTerm, filters]);

 // Handlers
 const handleAdd = () => {
 setEditingSubject(null);
 setIsFormOpen(true);
 };

 const handleEdit = (sub) => {
 setEditingSubject(sub);
 setIsFormOpen(true);
 };

 const handleDelete = (id) => {
 if (window.confirm('Are you sure you want to delete this subject? It may be linked to multiple classes.')) {
 deleteSubject(id);
 addNotification('Subject deleted successfully', 'success');
 }
 };

 const handleSave = (subjectData) => {
 try {
 if (editingSubject) {
 updateSubject(editingSubject.id, subjectData);
 addNotification('Subject updated successfully', 'success');
 } else {
 addSubject(subjectData);
 addNotification('New subject created successfully', 'success');
 }
 setIsFormOpen(false);
 } catch (error) {
 addNotification(error.message, 'error');
 }
 };

 return (
 <PageLayout role="admin" title={t('subjects')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-page-title text-slate-900 dark:text-white">{t('subjects')}</h2>
 <p className="text-body-sm text-slate-500/80 mt-1">{t('subjectsSubtitle')}</p>
 </div>

 {/* TOP CONTROL BAR */}
 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
 <div className="flex items-center gap-4 flex-1 min-w-[300px]">
 <div className="relative flex-1">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/80">search</span>
 <input
 type="text"
 placeholder="Search subject name..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-700 dark:text-slate-200"
 />
 </div>

 <div className="flex gap-2">
 <select
 value={filters.level}
 onChange={(e) => setFilters({ ...filters, level: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">All Levels</option>
 <option value="Primary">Primary</option>
 <option value="Middle">Middle</option>
 <option value="Secondary">Secondary</option>
 </select>
 <select
 value={filters.status}
 onChange={(e) => setFilters({ ...filters, status: e.target.value })}
 className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-body-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-400/80 cursor-pointer"
 >
 <option value="">All Status</option>
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 </select>
 </div>
 </div>

 <button
 onClick={handleAdd}
 className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-sm hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-kpi-value">add_circle</span>
 Add Subject
 </button>
 </div>

 {/* SUBJECTS TABLE */}
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-body-sm">
 <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500/80 dark:text-slate-400/80 border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-6 py-4">Subject Name</th>
 <th className="px-6 py-4">Education Level(s)</th>
 <th className="px-6 py-4">Weekly Periods</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {filteredSubjects.map(sub => (
 <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary">
 <span className="material-symbols-outlined text-kpi-value">auto_stories</span>
 </div>
 <span className="text-slate-800 dark:text-slate-200">{sub.name}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1.5">
 {(sub.levels || []).map(lvl => (
 <span key={lvl} className="px-2 py-0.5 rounded-md text-body-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
 {lvl}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="text-body-sm text-slate-700 dark:text-slate-300">{sub.weeklyPeriods}</span>
 <span className="text-body-sm text-slate-400/80">p/week</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-body-sm  ${
 sub.status === 'Active' 
 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
 : 'bg-slate-100 text-slate-500/80 dark:bg-slate-800'
 }`}>
 {sub.status || 'Active'}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => handleEdit(sub)}
 className="p-1.5 text-slate-400/80 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
 >
 <span className="material-symbols-outlined text-section-title">edit</span>
 </button>
 <button
 onClick={() => handleDelete(sub.id)}
 className="p-1.5 text-slate-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
 >
 <span className="material-symbols-outlined text-section-title">delete</span>
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filteredSubjects.length === 0 && (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-slate-400/80">
 <span className="material-symbols-outlined text-kpi-value mb-2 opacity-30">menu_book</span>
 <p>No subjects found.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {isFormOpen && (
 <SubjectForm
 subject={editingSubject}
 onClose={() => setIsFormOpen(false)}
 onSave={handleSave}
 />
 )}
 </PageLayout>
 );
};

const SubjectForm = ({ subject, onClose, onSave }) => {
 const [formData, setFormData] = useState(subject || {
 name: '',
 levels: [],
 weeklyPeriods: 1,
 status: 'Active',
 description: ''
 });

 const handleLevelToggle = (lvl) => {
 const current = formData.levels || [];
 if (current.includes(lvl)) {
 setFormData({ ...formData, levels: current.filter(l => l !== lvl) });
 } else {
 setFormData({ ...formData, levels: [...current, lvl] });
 }
 };

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <form 
 onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
 className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700/50 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col"
 >
 <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
 <h3 className="text-slate-900 dark:text-slate-100 text-section-title flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">auto_stories</span>
 {subject ? 'Edit Subject' : 'Create New Subject'}
 </h3>
 <button onClick={onClose} className="p-2 text-slate-400/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>

 <div className="p-8 space-y-6">
 <div>
 <label className="text-body-sm text-slate-500/80 mb-1.5 block">Subject Name</label>
 <input 
 type="text" 
 placeholder="e.g. Mathematics" 
 className="form-input-custom" 
 value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value })}
 required
 />
 </div>

 <div>
 <label className="text-body-sm text-slate-500/80 mb-3 block">Assigned Levels</label>
 <div className="flex flex-wrap gap-3">
 {['Primary', 'Middle', 'Secondary'].map(lvl => (
 <button
 key={lvl}
 type="button"
 onClick={() => handleLevelToggle(lvl)}
 className={`px-4 py-2 rounded-xl text-body-sm  transition-all border ${
 (formData.levels || []).includes(lvl)
 ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
 : 'bg-slate-50 dark:bg-slate-800 text-slate-400/80 border-slate-100 dark:border-slate-700 hover:border-primary/50'
 }`}
 >
 {lvl}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="text-body-sm text-slate-500/80 mb-1.5 block">Weekly Periods</label>
 <input 
 type="number" 
 min="1"
 className="form-input-custom" 
 value={formData.weeklyPeriods}
 onChange={e => setFormData({ ...formData, weeklyPeriods: parseInt(e.target.value) })}
 />
 </div>
 <div>
 <label className="text-body-sm text-slate-500/80 mb-1.5 block">Status</label>
 <select 
 className="form-input-custom"
 value={formData.status}
 onChange={e => setFormData({ ...formData, status: e.target.value })}
 >
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 </select>
 </div>
 </div>

 <div>
 <label className="text-body-sm text-slate-500/80 mb-1.5 block">Description (Optional)</label>
 <textarea 
 className="form-input-custom min-h-[80px]" 
 placeholder="Course overview or prerequisites..."
 value={formData.description}
 onChange={e => setFormData({ ...formData, description: e.target.value })}
 ></textarea>
 </div>
 </div>

 <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl">
 <button type="button" onClick={onClose} className="px-6 py-2.5 text-body-sm text-slate-500/80 dark:text-slate-400/80 hover:text-slate-700 transition-all">Cancel</button>
 <button type="submit" className="px-8 py-2.5 bg-primary text-white text-body-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all transform active:scale-95">{subject ? 'Update Subject' : 'Save Subject'}</button>
 </div>
 </form>
 </div>
 );
};

export default SubjectsPage;
