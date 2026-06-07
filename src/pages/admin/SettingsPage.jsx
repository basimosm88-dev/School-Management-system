import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useSettings } from '../../contexts/SettingsContext';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

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
  
  const { darkMode, toggleDarkMode, currentUser, fetchProfile } = useAppContext();
  const { 
    students, teachers, classes, subjects, 
    attendance, exams, announcements, events, systemLogs,
    addNotification 
  } = useData();

  const [activeSection, setActiveSection] = useState('profile');

  const [profileData, setProfileData] = useState({
    firstName: currentUser?.first_name || '',
    lastName: currentUser?.last_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || currentUser?.details?.phone || '',
    avatarUrl: currentUser?.avatar_url || currentUser?.photo || currentUser?.details?.photo || ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || currentUser.details?.phone || '',
        avatarUrl: currentUser.avatar_url || currentUser.photo || currentUser.details?.photo || ''
      });
    }
  }, [currentUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('File is too large. Max size is 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          avatar_url: profileData.avatarUrl,
          details: {
            ...currentUser.details,
            phone: profileData.phone
          }
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      await fetchProfile(currentUser);

      setProfileSuccess(t('profileUpdatedSuccess') || 'Profile updated successfully!');
      if (typeof addNotification === 'function') {
        addNotification(t('profileUpdatedSuccess') || 'Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileError('Failed to save profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

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

  const handleExportData = () => {
    const fullData = {
      students, teachers, classes, subjects, 
      attendance, exams, announcements, events, systemLogs,
      settings: {
        schoolSettings,
        academicSettings,
        pdfSettings,
        securitySettings,
        permissions
      }
    };
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sms_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    navigator.clipboard.writeText(JSON.stringify(fullData));
    alert(t('systemExportedAlert'));
  };

  const sections = [
    { id: 'profile', label: t('myProfile') || 'My Profile', icon: 'person' },
    { id: 'branding', label: t('school_branding'), icon: 'school' },
    { id: 'academic', label: t('academic_rules'), icon: 'menu_book' },
    { id: 'permissions', label: t('permissions'), icon: 'lock_person' },
    { id: 'pdf', label: t('pdf_config'), icon: 'picture_as_pdf' },
    { id: 'security', label: t('security'), icon: 'shield' },
    { id: 'appearance', label: t('appearance'), icon: 'palette' },
    { id: 'data', label: t('dataManagement'), icon: 'database' }
  ];

  return (
    <PageLayout role="admin" title={t('settings')}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-heading text-slate-900 dark:text-white">{t('settings')}</h2>
          <p className="text-label text-slate-500/80 mt-1">{t('settingsSubtitle')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-label transition-all ${
                activeSection === section.id 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                : 'text-slate-500/80 hover:text-slate-700 dark:text-slate-400/80 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-section">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        <div className="w-full space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-8 shadow-sm transition-colors">
            
            {activeSection === 'profile' && (
              <form onSubmit={handleProfileSave} className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">person</span>
                  {t('myProfile') || 'My Profile'}
                </h2>

                {profileError && (
                  <div className="p-4 bg-rose-50 text-rose-600 text-label rounded-xl border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-600 text-label rounded-xl border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                    {profileSuccess}
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start gap-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {profileData.avatarUrl ? (
                        <img src={profileData.avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-display text-slate-300">add_a_photo</span>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-3xl cursor-pointer transition-opacity">
                      <span className="text-white text-[12px] font-bold">{t('change') || 'Change'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-800 dark:text-white font-bold">{t('avatar') || 'Profile Picture'}</h3>
                    <p className="text-label text-slate-500/80 dark:text-slate-400/80">
                      {t('photoSizeNotice') || 'Max size 2MB. Auto-compressed for performance.'}
                    </p>
                    {profileData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="text-xs text-rose-500 font-semibold hover:underline flex items-center gap-1 mt-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        {t('remove') || 'Remove Photo'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80 dark:text-slate-400/80 font-medium">{t('firstName') || 'First Name'}</label>
                    <input 
                      type="text" 
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80 dark:text-slate-400/80 font-medium">{t('lastName') || 'Last Name'}</label>
                    <input 
                      type="text" 
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80 dark:text-slate-400/80 font-medium">{t('emailAddress') || 'Email Address'}</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-label opacity-60 outline-none dark:text-slate-400 cursor-not-allowed"
                      title="Email managed by system"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80 dark:text-slate-400/80 font-medium">{t('phoneNumber') || 'Phone Number'}</label>
                    <input 
                      type="text" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={savingProfile}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl text-label shadow-lg shadow-primary/20 transition-all flex items-center gap-2 font-bold disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('saving') || 'Saving...'}
                      </>
                    ) : (
                      t('saveProfileChanges') || 'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">school</span>
                  {t('school_branding')}
                </h2>
                
                <div className="flex items-center gap-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {schoolSettings.logo ? (
                        <img src={schoolSettings.logo} alt="School Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-display text-slate-300">add_a_photo</span>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                      <span className="text-white text-label">{t('change')}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-800 dark:text-white">{t('logo')}</h3>
                    <p className="text-label text-slate-500/80 dark:text-slate-400/80">{t('logoUploadDescription')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('schoolName')}</label>
                    <input 
                      type="text" 
                      value={schoolSettings.name}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('officialEmail')}</label>
                    <input 
                      type="email" 
                      value={schoolSettings.email}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('contactPhone')}</label>
                    <input 
                      type="text" 
                      value={schoolSettings.phone}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('websiteUrl')}</label>
                    <input 
                      type="text" 
                      value={schoolSettings.website}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, website: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('physicalAddress')}</label>
                    <textarea 
                      rows="2"
                      value={schoolSettings.address}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'academic' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  {t('academic_rules')}
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-slate-800 dark:text-white text-label">{t('gradingSystem')}</h3>
                    <div className="space-y-1.5">
                      <label className="text-label text-slate-500/80">{t('globalPassingGrade')}</label>
                      <input 
                        type="number" 
                        value={academicSettings.passingGrade}
                        onChange={(e) => setAcademicSettings({ ...academicSettings, passingGrade: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label text-slate-500/80">{t('minSubjectsPromotion')}</label>
                      <input 
                        type="number" 
                        value={academicSettings.minSubjects}
                        onChange={(e) => setAcademicSettings({ ...academicSettings, minSubjects: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-slate-800 dark:text-white text-label">{t('examWeights')}</h3>
                    {Object.entries(academicSettings.examWeights).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <span className="text-label text-slate-600 dark:text-slate-400/80 capitalize">{t(key)}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={value}
                            onChange={(e) => setAcademicSettings({ 
                              ...academicSettings, 
                              examWeights: { ...academicSettings.examWeights, [key]: parseInt(e.target.value) } 
                            })}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-label"
                          />
                          <span className="text-label text-slate-400/80">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'permissions' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">lock_person</span>
                  {t('permissions')}
                </h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-label text-slate-400/80">{t('teacherPermissions')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(permissions.teachers).map(([key, value]) => (
                        <label key={key} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
                          <span className="text-label text-slate-700 dark:text-slate-300">{t(key)}</span>
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
                    <h3 className="text-label text-slate-400/80">{t('studentPermissions')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(permissions.students).map(([key, value]) => (
                        <label key={key} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all">
                          <span className="text-label text-slate-700 dark:text-slate-300">{t(key)}</span>
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

            {activeSection === 'pdf' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                  {t('pdf_config')}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer">
                      <span className="text-label text-slate-700 dark:text-slate-300">{t('showLogoReports')}</span>
                      <input type="checkbox" checked={pdfSettings.showLogo} onChange={(e) => setPdfSettings({ ...pdfSettings, showLogo: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer">
                      <span className="text-label text-slate-700 dark:text-slate-300">{t('showSignatureLabels')}</span>
                      <input type="checkbox" checked={pdfSettings.showSignatureLabels} onChange={(e) => setPdfSettings({ ...pdfSettings, showSignatureLabels: e.target.checked })} />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-label text-slate-500/80">{t('principalSignatureLabel')}</label>
                      <input type="text" value={pdfSettings.principalTitle} onChange={(e) => setPdfSettings({ ...pdfSettings, principalTitle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label text-slate-500/80">{t('managerSignature')}</label>
                      <input type="text" value={schoolSettings.managerSignature || ''} onChange={(e) => setSchoolSettings({ ...schoolSettings, managerSignature: e.target.value })} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">shield</span>
                  {t('security')}
                </h2>
                <div className="max-w-md space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-label text-slate-500/80">{t('minPasswordLength')}</label>
                    <input type="number" value={securitySettings.minPasswordLength} onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer">
                    <span className="text-label text-slate-700 dark:text-slate-300">{t('requireSpecialChars')}</span>
                    <input type="checkbox" checked={securitySettings.requireSpecialChars} onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChars: e.target.checked })} />
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  {t('appearanceLocalization')}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-label text-slate-400/80">{t('systemLanguage')}</h3>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label outline-none"
                    >
                      <option value="en">English (US)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="so">Somali (SO)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-label text-slate-400/80">{t('systemTheme')}</h3>
                    <div className="flex gap-4">
                      <button onClick={() => { if (darkMode) toggleDarkMode(); }} className={`flex-1 py-3 rounded-xl border-2 text-label transition-all ${!darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}>{t('light')}</button>
                      <button onClick={() => { if (!darkMode) toggleDarkMode(); }} className={`flex-1 py-3 rounded-xl border-2 text-label transition-all ${darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400/80'}`}>{t('dark')}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-6">
                <h2 className="text-section text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">database</span>
                  {t('dataManagementMigration')}
                </h2>
                <div className="max-w-md">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-display">cloud_upload</span>
                    </div>
                    <div>
                      <h3 className="text-label font-black text-on-surface uppercase">{t('exportLocalData')}</h3>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                        {t('exportLocalDataDesc')}
                      </p>
                    </div>
                    <button onClick={handleExportData} className="w-full btn-primary py-3">
                      {t('exportSystemState')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
