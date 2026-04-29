import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';

const AnnouncementsPage = ({ role }) => {
 const { announcements, addAnnouncement, deleteAnnouncement, classes } = useData();
 const { currentUser } = useAppContext();
 const { permissions, t } = useSettings();
 const [modalOpen, setModalOpen] = useState(false);
 const [formData, setFormData] = useState({});

 const filteredAnnouncements = announcements.filter(ann => {
 if (role === 'admin') return true;
 if (ann.audience === 'all') return true;
 if (role === 'teacher' && ann.audience === 'teachers') return true;
 if (role === 'student' && ann.audience === 'students') return true;
 if (ann.audience === `class_${currentUser?.classId}`) return true;
 return ann.createdBy === `${role}_${currentUser?.id}`;
 });

 const announcementFields = [
 { name: 'title', label: 'Announcement Title', placeholder: 'Important: Schedule Change' },
 { name: 'priority', label: 'Priority', type: 'select', options: [
 { value: 'normal', label: 'Normal' },
 { value: 'important', label: 'Important' },
 { value: 'urgent', label: 'Urgent' }
 ]},
 { name: 'audience', label: 'Audience', type: 'select', options: [
 { value: 'all', label: 'All' },
 { value: 'teachers', label: 'Teachers Only' },
 { value: 'students', label: 'Students Only' },
 ...classes.map(c => ({ value: `class_${c.id}`, label: `Class: ${c.name}` }))
 ]},
 { name: 'content', label: 'Content', type: 'textarea', placeholder: 'Write details here...' }
 ];

 const handleSave = () => {
 if (formData.title && formData.content) {
 addAnnouncement({
 ...formData,
 date: new Date().toISOString().split('T')[0],
 createdBy: `${role}_${currentUser.id}`
 });
 setModalOpen(false);
 setFormData({});
 }
 };

 const getPriorityStyles = (priority) => {
 switch (priority) {
 case 'urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
 case 'important': return 'bg-amber-50 text-amber-600 border-amber-100';
 default: return 'bg-blue-50 text-primary border-blue-100';
 }
 };

 return (
 <PageLayout role={role} title={t('announcements')}>
 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
 <div>
 <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{t('announcements')}</h2>
 <p className="text-xs font-bold text-slate-500 mt-1">{t('announcementsSubtitle')}</p>
 </div>
 {(role === 'admin' || (role === 'teacher' && permissions.teachers.createAnnouncements)) && (
 <button 
 onClick={() => setModalOpen(true)}
 className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-2xl">campaign</span>
 New Announcement
 </button>
 )}
 </div>

 <div className="space-y-4">
 {filteredAnnouncements.length === 0 ? (
 <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800">
 <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">notifications_off</span>
 <p className="text-slate-500">No announcements found.</p>
 </div>
 ) : (
 filteredAnnouncements.sort((a,b) => new Date(b.date) - new Date(a.date)).map(ann => (
 <div key={ann.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-primary/20">
 <div className="flex justify-between items-start mb-4">
 <div className="flex items-center gap-4">
 <div className={`p-2 rounded-xl border ${getPriorityStyles(ann.priority)}`}>
 <span className="material-symbols-outlined text-3xl">
 {ann.priority === 'urgent' ? 'error' : ann.priority === 'important' ? 'warning' : 'info'}
 </span>
 </div>
 <div>
 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ann.title}</h3>
 <p className="text-xs text-slate-400 font-medium ">{ann.date}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700`}>
 To: {(ann.audience || 'all').replace('_', ' ')}
 </span>
 {role === 'admin' && (
 <button onClick={() => deleteAnnouncement(ann.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
 <span className="material-symbols-outlined text-xl">delete</span>
 </button>
 )}
 </div>
 </div>
 <div className="prose prose-slate dark:prose-invert max-w-none">
 <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
 {ann.content || ann.message}
 </p>
 </div>
 {ann.attachment && (
 <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
 <span className="material-symbols-outlined text-2xl text-primary">attachment</span>
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ann.attachment}</span>
 <button className="text-xs font-semibold text-primary ml-4 hover:underline">Download</button>
 </div>
 )}
 </div>
 ))
 )}
 </div>

 <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Announcement" onSave={handleSave}>
 <DynamicForm fields={announcementFields} onChange={setFormData} />
 </Modal>
 </PageLayout>
 );
};

export default AnnouncementsPage;
