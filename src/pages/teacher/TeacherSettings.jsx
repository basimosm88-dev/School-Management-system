import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useAppContext } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const TeacherSettings = () => {
 const { currentUser } = useAppContext();
 const { changeTeacherPassword, addNotification, updateTeacher } = useData();
 const { 
 language, setLanguage, 
 theme, setTheme, 
 notificationSettings, setNotificationSettings,
 t 
 } = useSettings();

 const [activeTab, setActiveTab] = useState('profile');
 const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
 const [profileData, setProfileData] = useState({
 name: currentUser?.name || '',
 email: currentUser?.email || '',
 phone: currentUser?.phone || ''
 });
 const [error, setError] = useState('');

 const handleProfileUpdate = (e) => {
 e.preventDefault();
 updateTeacher(currentUser.id, profileData);
 addNotification(t('profileUpdatedSuccess'), 'success');
 };

 const handlePasswordChange = (e) => {
 e.preventDefault();
 setError('');
 if (passwords.current !== currentUser.password) { setError('Current password is incorrect.'); return; }
 if (passwords.new.length < 6) { setError('New password must be at least 6 characters.'); return; }
 if (passwords.new !== passwords.confirm) { setError('Passwords do not match.'); return; }
 changeTeacherPassword(currentUser.id, passwords.new);
 addNotification('Password changed successfully!', 'success');
 setPasswords({ current: '', new: '', confirm: '' });
 };

 const toggleNotif = (key) => {
 setNotificationSettings({
 ...notificationSettings,
 types: { ...notificationSettings.types, [key]: !notificationSettings.types[key] }
 });
 };

 const tabs = [
 { id: 'profile', label: t('profile'), icon: 'person' },
 { id: 'security', label: t('security'), icon: 'lock' },
 { id: 'appearance', label: t('appearance'), icon: 'palette' },
 { id: 'notifications', label: t('notifications'), icon: 'notifications' }
 ];

 return (
 <PageLayout role="teacher" title={t('settings')}>
  <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  {/* Settings Sidebar - Top on Mobile */}
  <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 shrink-0 scrollbar-hide">
  {tabs.map(tab => (
  <button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label transition-all whitespace-nowrap lg:whitespace-normal flex-1 lg:flex-none justify-center lg:justify-start ${
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

 {/* Settings Content */}
 <div className="flex-1 space-y-6">
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm transition-colors">
 
 {/* PROFILE TAB */}
 {activeTab === 'profile' && (
 <form onSubmit={handleProfileUpdate} className="space-y-6">
 <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
 <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-display text-indigo-600 dark:text-indigo-400">
 {currentUser?.name?.[0] || 'T'}
 </div>
 <div>
 <h2 className="text-section text-slate-900 dark:text-white">{currentUser?.name}</h2>
 <p className="text-label text-slate-500/80 dark:text-slate-400/80">{t('teacherIdLabel')} {currentUser?.id}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">{t('fullName')}</label>
 <input 
 type="text" 
 value={profileData.name}
 onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
 className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">{t('emailAddress')}</label>
 <input 
 type="email" 
 value={profileData.email}
 onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
 className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-label text-slate-500/80">{t('phoneNumber')}</label>
 <input 
 type="text" 
 value={profileData.phone}
 onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
 className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
 />
 </div>
 </div>
 <div className="pt-4">
 <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl text-label shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all">{t('saveProfileChanges')}</button>
 </div>
 </form>
 )}

  {/* SECURITY TAB */}
  {activeTab === 'security' && (
    <div className="space-y-6">
      <h3 className="text-slate-800 dark:text-white mb-4">{t('securityAndPassword')}</h3>
      <div className="p-6 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 flex gap-4">
        <span className="material-symbols-outlined text-[24px] text-primary shrink-0">info</span>
        <div>
          <p className="font-bold text-slate-900 dark:text-white mb-1">{t('passwordManagement')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('passwordManagementDesc')}
          </p>
        </div>
      </div>
    </div>
  )}

 {/* APPEARANCE TAB */}
 {activeTab === 'appearance' && (
 <div className="space-y-8">
 <div className="space-y-4">
 <h3 className="text-slate-800 dark:text-white text-label">{t('systemLanguage')}</h3>
 <div className="grid grid-cols-3 gap-3">
 {['en', 'ar', 'so'].map(lang => (
 <button
 key={lang}
 onClick={() => setLanguage(lang)}
 className={`py-3 rounded-xl border-2  text-label transition-all ${
 language === lang 
 ? 'border-primary bg-primary/5 text-primary' 
 : 'border-slate-100 dark:border-slate-800 text-slate-400/80'
 }`}
 >
 {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Somali'}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-slate-800 dark:text-white text-label">{t('themeMode')}</h3>
 <div className="flex gap-4">
 <button 
 onClick={() => setTheme('light')}
 className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}
 >
 <span className="material-symbols-outlined">light_mode</span>
 <span className="text-label">{t('lightMode')}</span>
 </button>
 <button 
 onClick={() => setTheme('dark')}
 className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}
 >
 <span className="material-symbols-outlined">dark_mode</span>
 <span className="text-label">{t('darkMode')}</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* NOTIFICATIONS TAB */}
 {activeTab === 'notifications' && (
 <div className="space-y-6">
 <h3 className="text-slate-800 dark:text-white mb-4">{t('notificationPreferences')}</h3>
 <div className="space-y-3">
 {Object.entries(notificationSettings.types).map(([key, value]) => (
 <label key={key} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
 <span className="material-symbols-outlined text-slate-400/80">
 {key === 'grades' ? 'grade' : key === 'announcements' ? 'campaign' : key === 'messages' ? 'mail' : 'event'}
 </span>
 </div>
 <div>
 <p className="text-label text-slate-700 dark:text-slate-200 capitalize">{t(key)}</p>
 <p className="text-label text-slate-400/80">{t('receiveAlertsForNew').replace('{type}', t(key))}</p>
 </div>
 </div>
 <div 
 className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
 onClick={() => toggleNotif(key)}
 >
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

export default TeacherSettings;
