import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations } from '../lib/translations';
import { initialData } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAppContext } from './AppContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
 const { currentSchool, currentUser, schoolLoading } = useAppContext();
 const [loadedFromDB, setLoadedFromDB] = useState(false);

 const getSaved = (key, fallback) => {
 const saved = localStorage.getItem(`sms_${key}`);
 if (!saved) return fallback;
 try {
 const parsed = JSON.parse(saved);
 if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
 // Deep merge for permissions specifically
 if (key === 'permissions') {
 return {
 teachers: { ...fallback.teachers, ...(parsed.teachers || {}) },
 students: { ...fallback.students, ...(parsed.students || {}) }
 };
 }
 return { ...fallback, ...parsed }; 
 }
 return parsed;
 } catch (e) {
 return saved;
 }
 };

 // --- 1. SCHOOL BRANDING ---
 const [schoolSettings, setSchoolSettings] = useState(() => getSaved('schoolSettings', initialData.settings?.schoolSettings || {
 name: 'Elite Academy',
 logo: null, // Base64 or URL
 managerSignature: null, // Base64 or URL
 phone: '+1 234 567 890',
 email: 'info@eliteacademy.edu',
 address: '123 Education St, Knowledge City',
 website: 'www.eliteacademy.edu'
 }));

 // --- 2. APPEARANCE & LOCALIZATION ---
 const [language, setLanguage] = useState(() => localStorage.getItem('sms_language') || 'en');

 // --- 3. PERMISSIONS ---
 const [permissions, setPermissions] = useState(() => getSaved('permissions', initialData.settings?.permissions || {
 teachers: {
 createAnnouncements: true,
 createEvents: true,
 viewAnnouncements: true,
 viewEvents: true,
 editGrades: true,
 releaseExams: false,
 sendMessage: true
 },
 students: {
 sendMessage: true,
 viewGrades: true,
 viewTimetable: true,
 viewAnnouncements: true,
 viewEvents: true
 }
 }));

 // --- 4. ACADEMIC SETTINGS ---
 const [academicSettings, setAcademicSettings] = useState(() => getSaved('academicSettings', initialData.settings?.academicSettings || {
 passingGrade: 50,
 minSubjects: 5,
 examWeights: {
 beforeMidterm: 10,
 midterm: 30,
 afterMidterm: 10,
 final: 50
 }
 }));

 // --- 5. NOTIFICATION SETTINGS ---
 const [notificationSettings, setNotificationSettings] = useState(() => getSaved('notificationSettings', {
 enabled: true,
 types: {
 grades: true,
 announcements: true,
 messages: true,
 events: true
 },
 expirationDays: 30
 }));

 // --- 6. PDF SETTINGS ---
 const [pdfSettings, setPdfSettings] = useState(() => getSaved('pdfSettings', initialData.settings?.pdfSettings || {
 showLogo: true,
 showSignatureLabels: true,
 principalTitle: 'Principal Signature',
 academicManagerTitle: 'Academic Manager',
 footerText: 'Official School Document - Valid only with school seal.'
 }));

 // --- 7. SECURITY SETTINGS ---
 const [securitySettings, setSecuritySettings] = useState(() => getSaved('securitySettings', initialData.settings?.securitySettings || {
 minPasswordLength: 6,
 requireSpecialChars: false,
 sessionTimeout: 60 // minutes
 }));

 // --- SYNC TO LOCAL STORAGE ---
 useEffect(() => { localStorage.setItem('sms_schoolSettings', JSON.stringify(schoolSettings)); }, [schoolSettings]);
 useEffect(() => { 
 localStorage.setItem('sms_language', language);
 document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
 document.documentElement.lang = language;
 }, [language]);
 useEffect(() => { localStorage.setItem('sms_permissions', JSON.stringify(permissions)); }, [permissions]);
 useEffect(() => { localStorage.setItem('sms_academicSettings', JSON.stringify(academicSettings)); }, [academicSettings]);
 useEffect(() => { localStorage.setItem('sms_notificationSettings', JSON.stringify(notificationSettings)); }, [notificationSettings]);
 useEffect(() => { localStorage.setItem('sms_pdfSettings', JSON.stringify(pdfSettings)); }, [pdfSettings]);
 useEffect(() => { localStorage.setItem('sms_securitySettings', JSON.stringify(securitySettings)); }, [securitySettings]);

  // Load settings from database currentSchool on mount or when currentSchool resolves
  useEffect(() => {
    if (!schoolLoading) {
      if (currentSchool && currentSchool.settings) {
        const dbSettings = currentSchool.settings;
        if (dbSettings.schoolSettings) setSchoolSettings(dbSettings.schoolSettings);
        if (dbSettings.academicSettings) setAcademicSettings(dbSettings.academicSettings);
        if (dbSettings.permissions) setPermissions(dbSettings.permissions);
        if (dbSettings.pdfSettings) setPdfSettings(dbSettings.pdfSettings);
        if (dbSettings.securitySettings) setSecuritySettings(dbSettings.securitySettings);
      }
      setLoadedFromDB(true);
    }
  }, [currentSchool, schoolLoading]);

  // Debounced database sync
  useEffect(() => {
    if (!loadedFromDB || !currentUser || currentUser.role !== 'admin' || !currentUser.school_id) return;

    const timer = setTimeout(async () => {
      try {
        const settingsPayload = {
          schoolSettings,
          academicSettings,
          permissions,
          pdfSettings,
          securitySettings
        };

        await supabase
          .from('schools')
          .update({
            name: schoolSettings.name,
            logo_url: schoolSettings.logo,
            settings: settingsPayload
          })
          .eq('id', currentUser.school_id);
      } catch (err) {
        console.error("Failed to sync settings to database:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [schoolSettings, academicSettings, permissions, pdfSettings, securitySettings, currentUser, loadedFromDB]);

 const t = useCallback((key) => {
 return translations[language]?.[key] || translations['en'][key] || key;
 }, [language]);

 const contextValue = useMemo(() => ({
 schoolSettings, setSchoolSettings,
 language, setLanguage,
 permissions, setPermissions,
 academicSettings, setAcademicSettings,
 notificationSettings, setNotificationSettings,
 pdfSettings, setPdfSettings,
 securitySettings, setSecuritySettings,
 t
 }), [
 schoolSettings, language, permissions, academicSettings, 
 notificationSettings, pdfSettings, securitySettings, t
 ]);

 return (
 <SettingsContext.Provider value={contextValue}>
 {children}
 </SettingsContext.Provider>
 );
};

export const useSettings = () => useContext(SettingsContext);
