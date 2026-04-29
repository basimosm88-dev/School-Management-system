import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useSettings } from '../../contexts/SettingsContext';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const SettingsPage = () => {
 const { 
 schoolSettings, setSchoolSettings,
 language, setLanguage,
 permissions, setPermissions,
 academicSettings, setAcademicSettings,
 pdfSettings, setPdfSettings,
 securitySettings, setSecuritySettings,
 t 
 } = useSettings();
 
 const { darkMode, toggleDarkMode } = useAppContext();
 
 const { resetData } = useData();

 const [activeSection, setActiveSection] = useState('branding');

 const handleLogoUpload = (e) => {
 const file = e.target.files[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setSchoolSettings({ ...schoolSettings, logo: reader.result });
 };
 reader.readAsDataURL(file);
 }
 };

 const sections = [
 { id: 'branding', label: t('school_branding'), icon: 'school' },
 { id: 'academic', label: t('academic_rules'), icon: 'menu_book' },
 { id: 'permissions', label: t('permissions'), icon: 'lock_person' },
 { id: 'pdf', label: t('pdf_config'), icon: 'picture_as_pdf' },
 { id: 'security', label: t('security'), icon: 'shield' },
 { id: 'appearance', label: 'Appearance', icon: 'palette' }
 ];

 return (
 <PageLayout role="admin" title={t('settings')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{t('settings')}</h2>
 <p className="text-xs font-bold text-slate-500 mt-1">{t('settingsSubtitle')}</p>
 </div>
 
 {/* Settings Navigation Tabs (Top) */}
 <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
 {sections.map(section => (
 <button
 key={section.id}
 onClick={() => setActiveSection(section.id)}
 className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold tracking-tight transition-all ${
 activeSection === section.id 
 ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
 : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
 }`}
 >
 <span className="material-symbols-outlined text-xl">{section.icon}</span>
 {section.label}
 </button>
 ))}
 <button 
 onClick={resetData}
 className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold tracking-tight text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all ml-4"
 >
 <span className="material-symbols-outlined text-xl">factory</span>
 Factory Reset
 </button>
 </div>

 {/* Settings Content */}
 <div className="w-full space-y-6">
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-8 shadow-sm transition-colors">
 
 {/* 1. BRANDING */}
 {activeSection === 'branding' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">school</span>
 {t('school_branding')}
 </h2>
 
 <div className="flex items-center gap-8 pb-6 border-b border-slate-100 dark:border-slate-800">
 <div className="relative group">
 <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
 {schoolSettings.logo ? (
 <img src={schoolSettings.logo} alt="School Logo" className="w-full h-full object-cover" />
 ) : (
 <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
 )}
 </div>
 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
 <span className="text-white text-xs font-bold ">Change</span>
 <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
 </label>
 </div>
 <div className="space-y-1">
 <h3 className="font-bold text-slate-800 dark:text-white">{t('logo')}</h3>
 <p className="text-xs text-slate-500 dark:text-slate-400">Upload your official school logo. This will appear on all dashboards and PDF reports.</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">{t('schoolName')}</label>
 <input 
 type="text" 
 value={schoolSettings.name}
 onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Official Email</label>
 <input 
 type="email" 
 value={schoolSettings.email}
 onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Contact Phone</label>
 <input 
 type="text" 
 value={schoolSettings.phone}
 onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Website URL</label>
 <input 
 type="text" 
 value={schoolSettings.website}
 onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 <div className="col-span-2 space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Physical Address</label>
 <textarea 
 rows="2"
 value={schoolSettings.address}
 onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
 ></textarea>
 </div>
 </div>
 </div>
 )}

 {/* 2. ACADEMIC RULES */}
 {activeSection === 'academic' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">menu_book</span>
 {t('academic_rules')}
 </h2>
 
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-4">
 <h3 className="font-bold text-slate-800 dark:text-white text-sm">Grading System</h3>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Global Passing Grade (%)</label>
 <input 
 type="number" 
 value={academicSettings.passingGrade}
 onChange={(e) => setAcademicSettings({ ...academicSettings, passingGrade: parseInt(e.target.value) })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Min. Subjects for Promotion</label>
 <input 
 type="number" 
 value={academicSettings.minSubjects}
 onChange={(e) => setAcademicSettings({ ...academicSettings, minSubjects: parseInt(e.target.value) })}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
 />
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="font-bold text-slate-800 dark:text-white text-sm">Exam Weights</h3>
 {Object.entries(academicSettings.examWeights).map(([key, value]) => (
 <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
 <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
 <div className="flex items-center gap-2">
 <input 
 type="number" 
 value={value}
 onChange={(e) => setAcademicSettings({ 
 ...academicSettings, 
 examWeights: { ...academicSettings.examWeights, [key]: parseInt(e.target.value) } 
 })}
 className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-sm font-bold"
 />
 <span className="text-xs font-bold text-slate-400">%</span>
 </div>
 </div>
 ))}
 <p className="text-xs text-slate-400 italic">Total must equal 100% for correct average calculations.</p>
 </div>
 </div>
 </div>
 )}

 {/* 3. PERMISSIONS */}
 {activeSection === 'permissions' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">lock_person</span>
 {t('permissions')}
 </h2>
 
 <div className="space-y-6">
 <div className="space-y-4">
 <h3 className="text-xs font-semibold text-slate-400 ">Teacher Permissions</h3>
 <div className="grid grid-cols-2 gap-4">
 {Object.entries(permissions.teachers).map(([key, value]) => (
 <label key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
 <input 
 type="checkbox" 
 checked={value}
 onChange={(e) => setPermissions({
 ...permissions,
 teachers: { ...permissions.teachers, [key]: e.target.checked }
 })}
 className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
 />
 </label>
 ))}
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-xs font-semibold text-slate-400 ">Student Permissions</h3>
 <div className="grid grid-cols-2 gap-4">
 {Object.entries(permissions.students).map(([key, value]) => (
 <label key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
 <input 
 type="checkbox" 
 checked={value}
 onChange={(e) => setPermissions({
 ...permissions,
 students: { ...permissions.students, [key]: e.target.checked }
 })}
 className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
 />
 </label>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 4. PDF CONFIG */}
 {activeSection === 'pdf' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
 {t('pdf_config')}
 </h2>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer">
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Show Logo on Reports</span>
 <input type="checkbox" checked={pdfSettings.showLogo} onChange={(e) => setPdfSettings({ ...pdfSettings, showLogo: e.target.checked })} />
 </label>
 <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer">
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Show Signature Labels</span>
 <input type="checkbox" checked={pdfSettings.showSignatureLabels} onChange={(e) => setPdfSettings({ ...pdfSettings, showSignatureLabels: e.target.checked })} />
 </label>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Principal Signature Label</label>
 <input type="text" value={pdfSettings.principalTitle} onChange={(e) => setPdfSettings({ ...pdfSettings, principalTitle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">{t('managerSignature')}</label>
 <input type="text" value={schoolSettings.managerSignature || ''} onChange={(e) => setSchoolSettings({ ...schoolSettings, managerSignature: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g., Manager: Jane Doe" />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Academic Manager Label</label>
 <input type="text" value={pdfSettings.academicManagerTitle} onChange={(e) => setPdfSettings({ ...pdfSettings, academicManagerTitle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
 </div>
 </div>
 
 <div className="col-span-2 space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">PDF Footer Text</label>
 <input type="text" value={pdfSettings.footerText} onChange={(e) => setPdfSettings({ ...pdfSettings, footerText: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
 </div>
 </div>
 </div>
 )}

 {/* 5. SECURITY */}
 {activeSection === 'security' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">shield</span>
 {t('security')}
 </h2>
 
 <div className="max-w-md space-y-6">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Minimum Password Length</label>
 <input type="number" value={securitySettings.minPasswordLength} onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
 </div>
 <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer">
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Require Special Characters</span>
 <input type="checkbox" checked={securitySettings.requireSpecialChars} onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChars: e.target.checked })} />
 </label>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 ">Session Timeout (Minutes)</label>
 <input type="number" value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
 </div>
 </div>
 </div>
 )}

 {/* 6. APPEARANCE */}
 {activeSection === 'appearance' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
 <span className="material-symbols-outlined text-primary">palette</span>
 Appearance & Localization
 </h2>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <h3 className="text-xs font-semibold text-slate-400 ">System Language</h3>
 <select 
 value={language}
 onChange={(e) => setLanguage(e.target.value)}
 className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
 >
 <option value="en">English (US)</option>
 <option value="ar">العربية (Arabic)</option>
 <option value="so">Somali (SO)</option>
 </select>
 </div>
 
 <div className="space-y-4">
 <h3 className="text-xs font-semibold text-slate-400 ">System Theme</h3>
 <div className="flex gap-4">
 <button onClick={() => { if (darkMode) toggleDarkMode(); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${!darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Light</button>
 <button onClick={() => { if (!darkMode) toggleDarkMode(); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Dark</button>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 
 <div className="flex justify-end p-4">
 <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
 <span className="material-symbols-outlined text-base">info</span>
 All changes are saved automatically and applied instantly.
 </p>
 </div>
 </div>
 </div>
 </PageLayout>
 );
};

export default SettingsPage;
