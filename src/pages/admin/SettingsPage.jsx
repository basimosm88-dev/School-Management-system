import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useSettings } from '../../contexts/SettingsContext';
import { useData } from '../../contexts/DataContext';

const SettingsPage = () => {
  const { 
    schoolSettings, setSchoolSettings,
    language, setLanguage,
    theme, setTheme,
    permissions, setPermissions,
    academicSettings, setAcademicSettings,
    pdfSettings, setPdfSettings,
    securitySettings, setSecuritySettings,
    t 
  } = useSettings();
  
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
      <div className="grid grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="col-span-3 flex flex-col gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeSection === section.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
              {section.label}
            </button>
          ))}
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={resetData}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">factory</span>
              Factory Reset
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-9 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm transition-colors animate-in fade-in slide-in-from-right-4 duration-300">
            
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
                      <span className="text-white text-[10px] font-bold uppercase">Change</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">School Logo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Upload your official school logo. This will appear on all dashboards and PDF reports.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">School Name</label>
                    <input 
                      type="text" 
                      value={schoolSettings.name}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Email</label>
                    <input 
                      type="email" 
                      value={schoolSettings.email}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                    <input 
                      type="text" 
                      value={schoolSettings.phone}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website URL</label>
                    <input 
                      type="text" 
                      value={schoolSettings.website}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Address</label>
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global Passing Grade (%)</label>
                      <input 
                        type="number" 
                        value={academicSettings.passingGrade}
                        onChange={(e) => setAcademicSettings({ ...academicSettings, passingGrade: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min. Subjects for Promotion</label>
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
                    <p className="text-[10px] text-slate-400 italic">Total must equal 100% for correct average calculations.</p>
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Teacher Permissions</h3>
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Student Permissions</h3>
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Principal Signature Label</label>
                      <input type="text" value={pdfSettings.principalTitle} onChange={(e) => setPdfSettings({ ...pdfSettings, principalTitle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Manager Label</label>
                      <input type="text" value={pdfSettings.academicManagerTitle} onChange={(e) => setPdfSettings({ ...pdfSettings, academicManagerTitle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                  </div>
                  
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDF Footer Text</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minimum Password Length</label>
                    <input type="number" value={securitySettings.minPasswordLength} onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Require Special Characters</span>
                    <input type="checkbox" checked={securitySettings.requireSpecialChars} onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChars: e.target.checked })} />
                  </label>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Timeout (Minutes)</label>
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">System Language</h3>
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Default Theme</h3>
                    <div className="flex gap-4">
                      <button onClick={() => setTheme('light')} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Light</button>
                      <button onClick={() => setTheme('dark')} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Dark</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          <div className="flex justify-end p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">info</span>
              All changes are saved automatically and applied instantly.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
