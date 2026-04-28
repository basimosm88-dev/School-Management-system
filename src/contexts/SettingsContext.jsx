import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const translations = {
  en: {
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers",
    classes: "Classes",
    subjects: "Subjects",
    timetable: "Timetable",
    exams: "Exams",
    events: "Events",
    announcements: "Announcements",
    messages: "Messages",
    settings: "Settings",
    logout: "Logout",
    search_placeholder: "Search...",
    total_students: "Total Students",
    total_teachers: "Total Teachers",
    total_classes: "Total Classes",
    total_subjects: "Total Subjects",
    grade_approvals: "Grade Approvals",
    system_health: "System Health",
    add_student: "Add Student",
    // New settings keys
    school_branding: "School Branding",
    academic_rules: "Academic Rules",
    permissions: "Permissions",
    pdf_config: "PDF Configuration",
    security: "Security",
    save_all: "Save All Changes",
    system_language: "System Language",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode"
  },
  so: {
    dashboard: "Dashboard-ka",
    students: "Ardayda",
    teachers: "Macalimiinta",
    classes: "Fasallada",
    subjects: "Maadooyinka",
    timetable: "Jadwalka",
    exams: "Imtixaannada",
    events: "Dhacdooyinka",
    announcements: "Ogeysiisyada",
    messages: "Farriimaha",
    settings: "Settings",
    logout: "Ka Bax",
    search_placeholder: "Raadi...",
    total_students: "Wadarta Ardayda",
    total_teachers: "Wadarta Macalimiinta",
    total_classes: "Wadarta Fasallada",
    total_subjects: "Wadarta Maadooyinka",
    grade_approvals: "Ansixinta Darajooyinka",
    system_health: "Caafimaadka Nidaamka",
    add_student: "Ku dar Arday",
    school_branding: "Sumadda Dugsiga",
    academic_rules: "Xeerarka Akadeemiyada",
    permissions: "Ogolaanshaha",
    pdf_config: "Habaynta PDF",
    security: "Amniga",
    save_all: "Keydi Dhammaan Isbeddelada",
    system_language: "Luqadda Nidaamka",
    dark_mode: "Habka Mugdiga",
    light_mode: "Habka Iftiinka"
  },
  ar: {
    dashboard: "لوحة القيادة",
    students: "الطلاب",
    teachers: "المعلمون",
    classes: "الفصول",
    subjects: "المواد",
    timetable: "الجدول الزمني",
    exams: "الامتحانات",
    events: "الفعاليات",
    announcements: "الإعلانات",
    messages: "الرسائل",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    search_placeholder: "بحث...",
    total_students: "إجمالي الطلاب",
    total_teachers: "إجمالي المعلمين",
    total_classes: "إجمالي الفصول",
    total_subjects: "إجمالي المواد",
    grade_approvals: "موافقات الدرجات",
    system_health: "حالة النظام",
    add_student: "إضافة طالب",
    school_branding: "العلامة التجارية للمدرسة",
    academic_rules: "القواعد الأكاديمية",
    permissions: "الأذونات",
    pdf_config: "تكوين PDF",
    security: "الأمن",
    save_all: "حفظ كل التغييرات",
    system_language: "لغة النظام",
    dark_mode: "الوضع الداكن",
    light_mode: "الوضع الفاتح"
  }
};

export const SettingsProvider = ({ children }) => {
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
  const [schoolSettings, setSchoolSettings] = useState(() => getSaved('schoolSettings', {
    name: 'Elite Academy',
    logo: null, // Base64 or URL
    phone: '+1 234 567 890',
    email: 'info@eliteacademy.edu',
    address: '123 Education St, Knowledge City',
    website: 'www.eliteacademy.edu'
  }));

  // --- 2. APPEARANCE & LOCALIZATION ---
  const [language, setLanguage] = useState(() => localStorage.getItem('sms_language') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('sms_theme') || 'light');

  // --- 3. PERMISSIONS ---
  const [permissions, setPermissions] = useState(() => getSaved('permissions', {
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
  const [academicSettings, setAcademicSettings] = useState(() => getSaved('academicSettings', {
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
  const [pdfSettings, setPdfSettings] = useState(() => getSaved('pdfSettings', {
    showLogo: true,
    showSignatureLabels: true,
    principalTitle: 'Principal Signature',
    academicManagerTitle: 'Academic Manager',
    footerText: 'Official School Document - Valid only with school seal.'
  }));

  // --- 7. SECURITY SETTINGS ---
  const [securitySettings, setSecuritySettings] = useState(() => getSaved('securitySettings', {
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
  useEffect(() => { 
    localStorage.setItem('sms_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  useEffect(() => { localStorage.setItem('sms_permissions', JSON.stringify(permissions)); }, [permissions]);
  useEffect(() => { localStorage.setItem('sms_academicSettings', JSON.stringify(academicSettings)); }, [academicSettings]);
  useEffect(() => { localStorage.setItem('sms_notificationSettings', JSON.stringify(notificationSettings)); }, [notificationSettings]);
  useEffect(() => { localStorage.setItem('sms_pdfSettings', JSON.stringify(pdfSettings)); }, [pdfSettings]);
  useEffect(() => { localStorage.setItem('sms_securitySettings', JSON.stringify(securitySettings)); }, [securitySettings]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{
      schoolSettings, setSchoolSettings,
      language, setLanguage,
      theme, setTheme,
      permissions, setPermissions,
      academicSettings, setAcademicSettings,
      notificationSettings, setNotificationSettings,
      pdfSettings, setPdfSettings,
      securitySettings, setSecuritySettings,
      t
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
