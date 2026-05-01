import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useAppContext } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const StudentSettings = () => {
 const { currentUser } = useAppContext();
 const { changeStudentPassword, addNotification } = useData();
 const { 
 language, setLanguage, 
 theme, setTheme, 
 notificationSettings, setNotificationSettings
 } = useSettings();

 const [activeTab, setActiveTab] = useState('profile');
 const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
 const [error, setError] = useState('');

 const handlePasswordChange = (e) => {
 e.preventDefault();
 setError('');
 if (passwords.current !== currentUser.password) { setError('Current password is incorrect.'); return; }
 if (passwords.new.length < 6) { setError('New password must be at least 6 characters.'); return; }
 if (passwords.new !== passwords.confirm) { setError('Passwords do not match.'); return; }
 changeStudentPassword(currentUser.id, passwords.new);
 addNotification('Password updated successfully!', 'success');
 setPasswords({ current: '', new: '', confirm: '' });
 };

 const toggleNotif = (key) => {
 setNotificationSettings({
 ...notificationSettings,
 types: { ...notificationSettings.types, [key]: !notificationSettings.types[key] }
 });
 };

 const tabs = [
 { id: 'profile', label: 'My Profile', icon: 'person' },
 { id: 'security', label: 'Security', icon: 'lock' },
 { id: 'appearance', label: 'Appearance', icon: 'palette' },
 { id: 'notifications', label: 'Notifications', icon: 'notifications' }
 ];

 return (
 <PageLayout role="student" title="Settings">
 <div className="max-w-4xl mx-auto flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Sidebar */}
 <div className="w-64 flex flex-col gap-2 shrink-0">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl  text-label transition-all ${
 activeTab === tab.id 
 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
 : 'bg-white dark:bg-slate-900 text-slate-500/80 dark:text-slate-400/80 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span className="material-symbols-outlined text-display">{tab.icon}</span>
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1">
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
 
 {/* PROFILE (Read Only) */}
 {activeTab === 'profile' && (
 <div className="space-y-8">
 <div className="flex items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
 <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-display text-primary">
 {currentUser?.name?.[0]}
 </div>
 <div>
 <h2 className="text-section text-slate-900 dark:text-white">{currentUser?.name}</h2>
 <p className="text-label text-slate-500/80">Student ID: {currentUser?.id}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
 <p className="text-label text-slate-400/80 mb-1">Current Class</p>
 <p className="text-label text-slate-700 dark:text-slate-200">Grade 10-A</p>
 </div>
 <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
 <p className="text-label text-slate-400/80 mb-1">Enrollment Date</p>
 <p className="text-label text-slate-700 dark:text-slate-200">Sept 12, 2023</p>
 </div>
 <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
 <p className="text-label text-slate-400/80 mb-1">Personal Email</p>
 <p className="text-label text-slate-700 dark:text-slate-200">{currentUser?.email || 'Not Provided'}</p>
 </div>
 <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
 <p className="text-label text-slate-400/80 mb-1">Emergency Contact</p>
 <p className="text-label text-slate-700 dark:text-slate-200">+252 61 XXX XXXX</p>
 </div>
 </div>
 
 <p className="text-label text-slate-400/80 italic">Note: To change your profile information, please contact the school administration office.</p>
 </div>
 )}

 {/* SECURITY */}
 {activeTab === 'security' && (
 <form onSubmit={handlePasswordChange} className="space-y-6">
 <h3 className="text-slate-800 dark:text-white">Update Security Password</h3>
 {error && <div className="p-4 bg-rose-50 text-rose-600 text-label rounded-xl border border-rose-100">{error}</div>}
 
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">Current Password</label>
 <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-label outline-none dark:text-white" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">New Password</label>
 <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-label outline-none dark:text-white" />
 </div>
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">Confirm New</label>
 <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-label outline-none dark:text-white" />
 </div>
 </div>
 </div>
 <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl text-label shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all">Change Password</button>
 </form>
 )}

 {/* APPEARANCE */}
 {activeTab === 'appearance' && (
 <div className="space-y-8">
 <div className="space-y-4">
 <h3 className="text-slate-800 dark:text-white text-label">Dashboard Theme</h3>
 <div className="flex gap-4">
 <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}>
 <span className="material-symbols-outlined">light_mode</span>
 <span className="text-label">Light</span>
 </button>
 <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}>
 <span className="material-symbols-outlined">dark_mode</span>
 <span className="text-label">Dark</span>
 </button>
 </div>
 </div>
 
 <div className="space-y-4">
 <h3 className="text-slate-800 dark:text-white text-label">Preferred Language</h3>
 <div className="grid grid-cols-3 gap-3">
 {['en', 'ar', 'so'].map(lang => (
 <button key={lang} onClick={() => setLanguage(lang)} className={`py-3 rounded-xl border-2  text-label transition-all ${language === lang ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}>
 {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Somali'}
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* NOTIFICATIONS */}
 {activeTab === 'notifications' && (
 <div className="space-y-6">
 <h3 className="text-slate-800 dark:text-white mb-4">Notification Toggles</h3>
 <div className="space-y-3">
 {Object.entries(notificationSettings.types).map(([key, value]) => (
 <label key={key} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-slate-400/80">
 {key === 'grades' ? 'grade' : key === 'announcements' ? 'campaign' : key === 'messages' ? 'mail' : 'event'}
 </span>
 <p className="text-label text-slate-700 dark:text-slate-200 capitalize">{key}</p>
 </div>
 <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`} onClick={() => toggleNotif(key)}>
 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}></div>
 </div>
 </label>
 ))}
 </div>
 </div>
 )}

 </div>
 </div>
 </div>
 </PageLayout>
 );
};

export default StudentSettings;
