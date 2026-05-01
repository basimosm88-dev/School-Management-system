import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialData } from '../data/mockData';
import { useSettings } from './SettingsContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
 const { academicSettings, permissions } = useSettings();
 
 // --- STATE INITIALIZATION ---
 const getInitialState = (key) => {
 try {
 const saved = localStorage.getItem(`sms_${key}`);
 if (saved === null || saved === 'undefined' || saved === 'null') {
 return initialData[key] || [];
 }
 const parsed = JSON.parse(saved);
 return parsed || initialData[key] || [];
 } catch (e) {
 console.error(`Error loading ${key} from localStorage:`, e);
 return initialData[key] || [];
 }
 };

 const [students, setStudents] = useState(() => getInitialState('students'));
 const [teachers, setTeachers] = useState(() => getInitialState('teachers'));
 const [classes, setClasses] = useState(() => getInitialState('classes'));
 const [subjects, setSubjects] = useState(() => getInitialState('subjects'));
 const [grades, setGrades] = useState(() => getInitialState('grades'));
 const [notifications, setNotifications] = useState(() => getInitialState('notifications'));
 const [attendance, setAttendance] = useState(() => getInitialState('attendance'));
 const [timetables, setTimetables] = useState(() => getInitialState('timetables'));
 const [exams, setExams] = useState(() => getInitialState('exams'));
 const [promotionSettings, setPromotionSettings] = useState(() => {
 const saved = localStorage.getItem('sms_promotionSettings');
 return saved ? JSON.parse(saved) : { passingGrade: 50, minSubjects: 5 };
 });
 const [examReleaseSettings, setExamReleaseSettings] = useState(() => {
 const saved = localStorage.getItem('sms_examReleaseSettings');
 return saved ? JSON.parse(saved) : { 
 'Midterm': { date: '', time: '', isApproved: false },
 'Final': { date: '', time: '', isApproved: false }
 };
 });
 const [promotions, setPromotions] = useState(() => getInitialState('promotions'));
 const [events, setEvents] = useState(() => getInitialState('events'));
 const [announcements, setAnnouncements] = useState(() => getInitialState('announcements'));
 const [systemLogs, setSystemLogs] = useState(() => getInitialState('systemLogs'));

 // --- LOCAL STORAGE SYNC ---
 useEffect(() => { localStorage.setItem('sms_students', JSON.stringify(students)); }, [students]);
 useEffect(() => { localStorage.setItem('sms_teachers', JSON.stringify(teachers)); }, [teachers]);
 useEffect(() => { localStorage.setItem('sms_classes', JSON.stringify(classes)); }, [classes]);
 useEffect(() => { localStorage.setItem('sms_subjects', JSON.stringify(subjects)); }, [subjects]);
 useEffect(() => { localStorage.setItem('sms_grades', JSON.stringify(grades)); }, [grades]);
 useEffect(() => { localStorage.setItem('sms_notifications', JSON.stringify(notifications)); }, [notifications]);
 useEffect(() => { localStorage.setItem('sms_attendance', JSON.stringify(attendance)); }, [attendance]);
 useEffect(() => { localStorage.setItem('sms_timetables', JSON.stringify(timetables)); }, [timetables]);
 useEffect(() => { localStorage.setItem('sms_exams', JSON.stringify(exams)); }, [exams]);
 useEffect(() => { localStorage.setItem('sms_promotionSettings', JSON.stringify(promotionSettings)); }, [promotionSettings]);
 useEffect(() => { localStorage.setItem('sms_examReleaseSettings', JSON.stringify(examReleaseSettings)); }, [examReleaseSettings]);
 useEffect(() => { localStorage.setItem('sms_promotions', JSON.stringify(promotions)); }, [promotions]);
 useEffect(() => { localStorage.setItem('sms_events', JSON.stringify(events)); }, [events]);
 useEffect(() => { localStorage.setItem('sms_announcements', JSON.stringify(announcements)); }, [announcements]);
 useEffect(() => { localStorage.setItem('sms_systemLogs', JSON.stringify(systemLogs)); }, [systemLogs]);

 // --- GENERIC HELPERS ---
 const addRecord = (setter) => (record) => {
 setter(prev => [...prev, { ...record, id: Date.now(), createdAt: new Date().toISOString() }]);
 };
 const updateRecord = (setter) => (id, updates) => {
 setter(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
 };
 const deleteRecord = (setter) => (id) => {
 setter(prev => prev.filter(item => item.id !== id));
 };

 // --- NOTIFICATIONS ---
 const addNotification = (message, type = 'info', title = 'System Update', recipientId = 'all') => {
 setNotifications(prev => [...prev, { 
 id: Date.now(), 
 title,
 message, 
 type, 
 timestamp: new Date().toISOString(), 
 read: false,
 recipientId
 }]);
 };

 const triggerSmartNotification = ({ title, message, type = 'info', recipientId = 'all', actionLink = null }) => {
 addNotification(message, type, title, recipientId);
 };

 const markNotificationRead = (id) => {
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
 };

 const markAllNotificationsRead = (recipientId) => {
 setNotifications(prev => prev.map(n => 
 (n.recipientId === recipientId || n.recipientId === 'all') ? { ...n, read: true } : n
 ));
 };

 // --- STUDENTS ---
 const addStudent = (studentData) => {
 const id = Date.now();
 const idStr = id.toString();
 const defaultPassword = idStr.substring(Math.max(0, idStr.length - 6));
 setStudents(prev => [...prev, { ...studentData, id, password: defaultPassword, isDefaultPassword: true, createdAt: new Date().toISOString() }]);
 triggerSmartNotification({
 title: 'New Student Added',
 message: `${studentData.name} has been registered in the system.`,
 type: 'success',
 recipientId: 'admin'
 });
 };
 const updateStudent = (id, updates) => updateRecord(setStudents)(id, updates);
 const deleteStudent = (id) => deleteRecord(setStudents)(id);
 const changeStudentPassword = (id, newPassword) => {
 setStudents(prev => prev.map(s => s.id === id ? { ...s, password: newPassword, isDefaultPassword: false } : s));
 };

 // --- TEACHERS ---
 const addTeacher = (teacherData) => {
 const id = Date.now();
 setTeachers(prev => [...prev, { ...teacherData, id, password: '123456', createdAt: new Date().toISOString() }]);
 triggerSmartNotification({
 title: 'New Teacher Added',
 message: `${teacherData.name} has been added to the faculty.`,
 type: 'success',
 recipientId: 'admin'
 });
 };
 const updateTeacher = (id, updates) => updateRecord(setTeachers)(id, updates);
 const deleteTeacher = (id) => deleteRecord(setTeachers)(id);
 const changeTeacherPassword = (id, newPassword) => {
 setTeachers(prev => prev.map(t => t.id === id ? { ...t, password: newPassword } : t));
 };

 // --- CLASSES ---
 const addClass = (classData) => {
 const id = Date.now();
 const name = `${classData.gradeName} - ${classData.section}`;
 setClasses(prev => [...prev, { ...classData, id, name, studentsCount: 0, subjects: [], createdAt: new Date().toISOString() }]);
 if (classData.teacherId) {
 setTeachers(prev => prev.map(t => t.id === parseInt(classData.teacherId) ? { ...t, assignedClasses: [...(t.assignedClasses || []), id] } : t));
 triggerSmartNotification({
 title: 'Class Assigned',
 message: `You have been assigned to lead ${name}.`,
 type: 'info',
 recipientId: parseInt(classData.teacherId)
 });
 }
 };
 const updateClass = (id, updates) => {
 setClasses(prev => prev.map(item => {
 if (item.id === id) {
 const newGrade = updates.gradeName || item.gradeName;
 const newSection = updates.section || item.section;
 const newName = `${newGrade} - ${newSection}`;
 return { ...item, ...updates, name: newName };
 }
 return item;
 }));
 };
 const deleteClass = (id) => deleteRecord(setClasses)(id);
 const assignStudentToClass = (studentId, classId) => {
 setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: parseInt(classId) } : s));
 setClasses(prev => prev.map(c => {
 if (c.id === parseInt(classId)) return { ...c, studentsCount: (c.studentsCount || 0) + 1 };
 const student = students.find(s => s.id === studentId);
 if (student && student.classId === c.id && c.id !== parseInt(classId)) return { ...c, studentsCount: Math.max(0, (c.studentsCount || 0) - 1) };
 return c;
 }));
 };
 const removeStudentFromClass = (studentId, classId) => {
 setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: null } : s));
 setClasses(prev => prev.map(c => c.id === parseInt(classId) ? { ...c, studentsCount: Math.max(0, (c.studentsCount || 0) - 1) } : c));
 };
 const assignSubjectToClass = (classId, subjectName, teacherId) => {
 setClasses(prev => prev.map(c => {
 if (c.id === classId) {
 const existing = (c.subjects || []).filter(s => s.name !== subjectName);
 return { ...c, subjects: [...existing, { name: subjectName, teacherId: parseInt(teacherId) }] };
 }
 return c;
 }));
 setTeachers(prev => prev.map(t => {
 if (t.id === parseInt(teacherId)) {
 const currentClasses = t.assignedClasses || [];
 if (!currentClasses.includes(classId)) {
 return { ...t, assignedClasses: [...currentClasses, classId] };
 }
 }
 return t;
 }));
 };

 // --- SUBJECTS ---
 const addSubject = (subjectData) => {
 if (subjects.some(s => s.name.toLowerCase() === subjectData.name.toLowerCase())) throw new Error('Subject already exists');
 setSubjects(prev => [...prev, { ...subjectData, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() }]);
 triggerSmartNotification({
 title: 'New Subject Added',
 message: `${subjectData.name} has been added to the curriculum.`,
 type: 'info',
 recipientId: 'admin'
 });
 };
 const updateSubject = (id, updates) => updateRecord(setSubjects)(id, updates);
 const deleteSubject = (id) => deleteRecord(setSubjects)(id);

 // --- EXAMS & GRADING ---
 const saveExamResults = (examType, classId, subjectId, teacherId, results, status = 'SUBMITTED') => {
 const subject = subjects.find(s => s.id === parseInt(subjectId) || s.name === subjectId);
 const subjectName = subject?.name || subjectId;
 setExams(prev => {
 const newExams = [...prev];
 results.forEach(res => {
 const index = newExams.findIndex(e => e.examType === examType && e.classId === parseInt(classId) && e.subjectName === subjectName && e.studentId === parseInt(res.studentId));
 const record = { examType, classId: parseInt(classId), subjectName, teacherId: parseInt(teacherId), studentId: parseInt(res.studentId), grade: parseFloat(res.grade) || 0, remarks: res.remarks || '', status, updatedAt: new Date().toISOString() };
 if (index !== -1) newExams[index] = { ...newExams[index], ...record };
 else newExams.push({ ...record, id: Date.now() + Math.random(), createdAt: new Date().toISOString() });
 });
 return newExams;
 });
 if (status === 'SUBMITTED') {
 addNotification(`Results submitted for ${subjectName}`, 'warning', 'Grades Submitted', 'admin');
 }
 };

 const updateExamStatus = (examType, classId, subjectId, newStatus, releaseDate = null) => {
 setExams(prev => prev.map(e => {
 const classMatch = e.classId === parseInt(classId);
 const subjectMatch = subjectId === 'all' || e.subjectId === parseInt(subjectId) || e.subjectName === subjectId;
 if (e.examType === examType && classMatch && subjectMatch) {
 if (newStatus === 'PUBLISHED' && e.status !== 'PUBLISHED') {
 triggerSmartNotification({
 title: 'Grades Released',
 message: `Your ${e.subjectName} ${e.examType} grades are now available.`,
 type: 'success',
 recipientId: e.studentId
 });
 }
 return { ...e, status: newStatus, releaseDate: releaseDate || e.releaseDate };
 }
 return e;
 }));
 };

 const calculateRankings = (classId) => {
 const classStudents = students.filter(s => s.classId === parseInt(classId));
 const weights = { 
 "Before Midterm": academicSettings.examWeights.beforeMidterm / 100, 
 "Midterm": academicSettings.examWeights.midterm / 100, 
 "After Midterm": academicSettings.examWeights.afterMidterm / 100, 
 "Final": academicSettings.examWeights.final / 100 
 };
 const rankings = classStudents.map(student => {
 const studentExams = exams.filter(e => parseInt(e.studentId) === parseInt(student.id) && e.status === 'PUBLISHED' && parseInt(e.classId) === parseInt(classId));
 const subjectScores = {};
 studentExams.forEach(e => {
 if (!subjectScores[e.subjectName]) subjectScores[e.subjectName] = 0;
 subjectScores[e.subjectName] += e.grade * (weights[e.examType] || 0);
 });
 const totalScore = Object.values(subjectScores).reduce((a, b) => a + b, 0);
 const averageScore = Object.keys(subjectScores).length > 0 ? totalScore / Object.keys(subjectScores).length : 0;
 return { studentId: student.id, name: student.name, totalScore, averageScore };
 });
 rankings.sort((a, b) => b.averageScore - a.averageScore);
 let currentRank = 1;
 for (let i = 0; i < rankings.length; i++) {
 if (i > 0 && rankings[i].averageScore < rankings[i-1].averageScore) currentRank = i + 1;
 rankings[i].rank = currentRank;
 }
 return rankings;
 };

 const calculatePromotion = (studentId) => {
 const studentExams = exams.filter(e => e.studentId === parseInt(studentId) && e.status === 'PUBLISHED');
 if (studentExams.length === 0) return 'Pending';
 const weights = { 
 "Before Midterm": academicSettings.examWeights.beforeMidterm / 100, 
 "Midterm": academicSettings.examWeights.midterm / 100, 
 "After Midterm": academicSettings.examWeights.afterMidterm / 100, 
 "Final": academicSettings.examWeights.final / 100 
 };
 const subjectScores = {};
 studentExams.forEach(e => {
 if (!subjectScores[e.subjectName]) subjectScores[e.subjectName] = 0;
 subjectScores[e.subjectName] += e.grade * (weights[e.examType] || 0);
 });
 const scores = Object.values(subjectScores);
 if (scores.length === 0) return 'Pending';
 const totalAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
 const failedSubjects = scores.filter(s => s < academicSettings.passingGrade).length;
 if (failedSubjects === 0 && totalAverage >= academicSettings.passingGrade) return 'Promoted';
 if (failedSubjects > 0 && failedSubjects <= academicSettings.minSubjects) return 'Conditional';
 return 'Failed';
 };

  const getReportCardData = (studentId, classId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    const targetClassId = classId ? parseInt(classId) : student?.classId;
    
    // 1. Get the class definition to find all assigned subjects
    const classObj = classes.find(c => c.id === targetClassId);
    const classSubjects = classObj?.subjects || [];

    // 2. Filter exams for this student/class that are PUBLISHED
    const studentExams = exams.filter(e => 
      parseInt(e.studentId) === parseInt(studentId) && 
      e.status === 'PUBLISHED' && 
      (!targetClassId || parseInt(e.classId) === parseInt(targetClassId))
    );
    
    const classRankings = targetClassId ? calculateRankings(targetClassId) : [];
    const studentRank = classRankings.find(r => r.studentId === parseInt(studentId))?.rank || '-';
    
    // 3. Initialize report with ALL subjects from the class
    const report = {};
    classSubjects.forEach(sub => {
      report[sub.name] = { 
        "Before Midterm": "-", 
        "Midterm": "-", 
        "After Midterm": "-", 
        "Final": "-", 
        average: 0 
      };
    });

    // 4. Fill in the published grades
    studentExams.forEach(e => {
      if (!report[e.subjectName]) {
        // If an exam exists for a subject not currently in class (archived/transferred)
        report[e.subjectName] = { "Before Midterm": "-", "Midterm": "-", "After Midterm": "-", "Final": "-", average: 0 };
      }
      report[e.subjectName][e.examType] = e.grade;
    });
    
    const weights = { 
      "Before Midterm": academicSettings.examWeights.beforeMidterm / 100, 
      "Midterm": academicSettings.examWeights.midterm / 100, 
      "After Midterm": academicSettings.examWeights.afterMidterm / 100, 
      "Final": academicSettings.examWeights.final / 100 
    };
    
    Object.keys(report).forEach(sub => {
      let weightedSum = 0;
      let hasData = false;
      Object.keys(weights).forEach(type => { 
        if (typeof report[sub][type] === 'number') {
          weightedSum += report[sub][type] * weights[type];
          hasData = true;
        }
      });
      report[sub].average = hasData ? weightedSum.toFixed(1) : "0";
    });
    
    return { 
      student, 
      results: report, 
      rank: studentRank, 
      classId: targetClassId,
      promotion: promotions?.find(p => p.studentId === parseInt(studentId) && p.classId === targetClassId)?.status || 'Pending' 
    };
  };

 // --- LEGACY GRADES (For Dashboard compatibility) ---
 const submitGrade = (gradeData) => {
 setGrades(prev => [...prev, { ...gradeData, id: Date.now(), date: new Date().toISOString() }]);
 };

 // --- ATTENDANCE ---
 const getAttendanceStats = (filter = {}) => {
 let filtered = attendance;
 if (filter.classId) filtered = filtered.filter(a => a.classId === parseInt(filter.classId));
 if (filter.studentId) filtered = filtered.filter(a => a.studentId === parseInt(filter.studentId));
 if (filter.date) filtered = filtered.filter(a => a.date === filter.date);
 const total = filtered.length;
 if (total === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
 const present = filtered.filter(a => a.status === 'Present').length;
 const absent = filtered.filter(a => a.status === 'Absent').length;
 const late = filtered.filter(a => a.status === 'Late').length;
 return { total, present, absent, late, rate: Math.round(((present + late) / total) * 100) };
 };

  const getStudentAttendanceSummary = (studentId) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const total = studentAttendance.length;
    const present = studentAttendance.filter(a => a.status === 'Present').length;
    const absent = studentAttendance.filter(a => a.status === 'Absent').length;
    const late = studentAttendance.filter(a => a.status === 'Late').length;

    // Group by date for daily summary
    const dailyMap = {};
    studentAttendance.forEach(a => {
      if (!dailyMap[a.date]) dailyMap[a.date] = { date: a.date, status: 'Present', count: 0, presentCount: 0 };
      dailyMap[a.date].count++;
      if (a.status === 'Present') dailyMap[a.date].presentCount++;
      else if (a.status === 'Absent') dailyMap[a.date].status = 'Absent';
      else if (a.status === 'Late' && dailyMap[a.date].status !== 'Absent') dailyMap[a.date].status = 'Late';
    });

    const dailySummary = Object.values(dailyMap).map(d => ({
      ...d,
      status: d.presentCount === d.count ? 'Present' : (d.presentCount === 0 ? 'Absent' : 'Partial')
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    return { 
      present, absent, late, 
      rate: total === 0 ? 0 : Math.round(((present + late) / total) * 100), 
      sessionHistory: studentAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)),
      dailySummary
    };
  };

 const saveAttendanceRecords = (records) => {
 setAttendance(prev => {
 const next = [...prev];
 records.forEach(rec => {
 const idx = next.findIndex(a => a.studentId === rec.studentId && a.date === rec.date && a.startTime === rec.startTime);
 if (idx !== -1) next[idx] = { ...next[idx], ...rec };
 else next.push({ ...rec, id: Date.now() + Math.random() });
 });
 return next;
 });
 };

 // --- TIMETABLES ---
 const getTimetableForClass = (classId) => timetables.filter(t => t.classId === parseInt(classId));
 const getTimetableForTeacher = (teacherId) => timetables.filter(t => t.teacherId === parseInt(teacherId));
 const addTimetableSlot = (slot) => setTimetables(prev => [...prev, { ...slot, id: Date.now() }]);
 const deleteTimetableSlot = (id) => setTimetables(prev => prev.filter(t => t.id !== id));

 // --- SCHEDULED TASKS ---
 useEffect(() => {
 const interval = setInterval(() => {
 const now = new Date().toISOString();
 setExams(prev => {
 let changed = false;
 const next = prev.map(e => {
 if (e.status === 'APPROVED' && e.releaseDate && e.releaseDate <= now) {
 changed = true;
 return { ...e, status: 'PUBLISHED' };
 }
 return e;
 });
 return changed ? next : prev;
 });
 Object.keys(examReleaseSettings).forEach(type => {
 const s = examReleaseSettings[type];
 if (s.isApproved && s.date && s.time) {
 if (new Date(`${s.date}T${s.time}`).toISOString() <= now) {
 setExams(prev => prev.map(e => (e.examType === type && e.status === 'APPROVED') ? { ...e, status: 'PUBLISHED' } : e));
 setExamReleaseSettings(prev => ({ ...prev, [type]: { ...prev[type], isApproved: false } }));
 }
 }
 });
 }, 60000);
 return () => clearInterval(interval);
 }, [examReleaseSettings]);

 // --- VALUE MEMOIZATION ---
 const addEventWithNotification = (eventData) => {
 addRecord(setEvents)(eventData);
 triggerSmartNotification({
 title: 'New Event',
 message: `${eventData.title} has been scheduled.`,
 type: 'info',
 recipientId: 'all'
 });
 };

 const addAnnouncementWithNotification = (announcementData) => {
 addRecord(setAnnouncements)(announcementData);
 triggerSmartNotification({
 title: 'New Announcement',
 message: announcementData.title,
 type: 'info',
 recipientId: 'all'
 });
 };

 const value = useMemo(() => ({
 students, addStudent, updateStudent, deleteStudent, changeStudentPassword,
 teachers, addTeacher, updateTeacher, deleteTeacher, changeTeacherPassword,
 classes, addClass, updateClass, deleteClass, assignStudentToClass, removeStudentFromClass, assignSubjectToClass,
 subjects, addSubject, updateSubject, deleteSubject,
 exams, saveExamResults, updateExamStatus, calculateRankings, calculatePromotion, getReportCardData, promotionSettings, setPromotionSettings, examReleaseSettings, setExamReleaseSettings, promotions,
 grades, submitGrade, deleteGrade: deleteRecord(setGrades), updateGrade: updateRecord(setGrades),
 attendance, saveAttendanceRecords, getAttendanceStats, getStudentAttendanceSummary,
 timetables, addTimetableSlot, deleteTimetableSlot, getTimetableForClass, getTimetableForTeacher,
 events, addEvent: addEventWithNotification, deleteEvent: deleteRecord(setEvents), updateEvent: updateRecord(setEvents),
 announcements, addAnnouncement: addAnnouncementWithNotification, deleteAnnouncement: deleteRecord(setAnnouncements), updateAnnouncement: updateRecord(setAnnouncements),
 notifications, addNotification, markNotificationRead, triggerSmartNotification, markAllNotificationsRead,
 systemLogs, resetData: () => { if(confirm("Reset all data? This will clear everything.")) { localStorage.clear(); window.location.reload(); } }
 }), [students, teachers, classes, subjects, exams, promotionSettings, examReleaseSettings, promotions, grades, attendance, timetables, events, announcements, notifications, systemLogs]);

 return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
