import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from './AppContext';
import { useSettings } from './SettingsContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { academicSettings } = useSettings();
  const { currentUser } = useAppContext();

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [exams, setExams] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [promotionSettings, setPromotionSettings] = useState({ passingGrade: 50, minSubjects: 5 });
  const [examReleaseSettings, setExamReleaseSettings] = useState({
    'Midterm': { date: '', time: '', isApproved: false },
    'Final': { date: '', time: '', isApproved: false }
  });

  // Fetch all data from Supabase on mount
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Profiles
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
          setStudents(profiles.filter(p => p.role === 'student').map(p => ({ ...p.details, id: p.id, name: `${p.first_name} ${p.last_name}`, role: 'student' })));
          setTeachers(profiles.filter(p => p.role === 'teacher').map(p => ({ ...p.details, id: p.id, name: `${p.first_name} ${p.last_name}`, role: 'teacher' })));
        }

        // 2. Fetch Classes
        const { data: classData } = await supabase.from('classes').select('*');
        if (classData) setClasses(classData.map(c => ({ ...c.details, id: c.id, name: c.name, section: c.section })));

        // 3. Fetch Subjects
        const { data: subjectData } = await supabase.from('subjects').select('*');
        if (subjectData) setSubjects(subjectData.map(s => ({ ...s.details, id: s.id, name: s.name })));

        // 4. Fetch Attendance
        const { data: attData } = await supabase.from('attendance').select('*');
        if (attData) setAttendance(attData.map(a => ({ ...a.details, id: a.id, studentId: a.student_id, classId: a.class_id, date: a.date, status: a.status })));

        // 5. Fetch Exams & Grades
        const { data: examData } = await supabase.from('exams').select('*');
        if (examData) {
          const formattedExams = examData.map(e => ({ ...e.details, id: e.id, title: e.title, classId: e.class_id, subjectId: e.subject_id }));
          setExams(formattedExams);
        }

        const { data: gradeData } = await supabase.from('grades').select('*');
        if (gradeData) {
          setGrades(gradeData.map(g => ({
            ...g.details,
            id: g.id,
            examId: g.exam_id,
            studentId: g.student_id,
            score: parseFloat(g.score),
            status: g.status,
            releaseDate: g.release_date
          })));
        }

        // 6. Fetch Timetables, Events, Announcements
        const { data: ttData } = await supabase.from('timetable').select('*');
        if (ttData) setTimetables(ttData.map(t => ({ ...t.details, id: t.id, classId: t.class_id, subjectId: t.subject_id, teacherId: t.teacher_id })));

        const { data: eventData } = await supabase.from('events').select('*');
        if (eventData) setEvents(eventData.map(e => ({ ...e.details, id: e.id, title: e.title })));

        const { data: annData } = await supabase.from('announcements').select('*');
        if (annData) setAnnouncements(annData.map(a => ({ ...a.details, id: a.id, title: a.title, content: a.content })));

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [currentUser]);

  // --- NOTIFICATIONS ---
  const addNotification = (message, type = 'info', title = 'System Update', recipientId = 'all') => {
    setNotifications(prev => [...prev, { id: Date.now(), title, message, type, timestamp: new Date().toISOString(), read: false, recipientId }]);
  };
  const triggerSmartNotification = ({ title, message, type = 'info', recipientId = 'all' }) => addNotification(message, type, title, recipientId);
  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = (recipientId) => setNotifications(prev => prev.map(n => (n.recipientId === recipientId || n.recipientId === 'all') ? { ...n, read: true } : n));

  const addStudent = async (studentData) => {
    try {
      const parts = studentData.name.split(' ');
      const systemId = studentData.systemId || `STU${Math.floor(10000 + Math.random() * 90000)}`;
      const loginEmail = `${systemId}@educore.local`.toLowerCase();

      const res = await supabase.functions.invoke('create-tenant-user', {
        body: {
          email: loginEmail,
          password: studentData.password || '123456',
          first_name: parts[0] || 'Student',
          last_name: parts.slice(1).join(' ') || '',
          role: 'student'
        }
      });
      if (res.error) throw res.error;
      const newId = res.data.user.id;
      
      const finalDetails = { ...studentData, systemId };
      // Update details
      await supabase.from('profiles').update({ details: finalDetails }).eq('id', newId);
      setStudents(prev => [...prev, { ...finalDetails, id: newId, isDefaultPassword: true }]);
      triggerSmartNotification({ title: 'New Student Added', message: `${studentData.name} registered with ID ${systemId}.`, type: 'success', recipientId: 'admin' });
    } catch (err) {
      console.error(err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to add student', type: 'error' });
    }
  };

  const bulkAddStudents = async (studentsList) => {
    // Basic optimistic fallback for bulk to prevent slow UI
    const mapped = studentsList.map((s, i) => ({ ...s, id: `temp-${Date.now()}-${i}`, isDefaultPassword: true }));
    setStudents(prev => [...prev, ...mapped]);
    triggerSmartNotification({ title: 'Bulk Import Started', message: `Importing ${studentsList.length} students in background.`, type: 'info', recipientId: 'admin' });
    // In production, this should loop through Edge Function or use a dedicated bulk endpoint.
  };

  const updateStudent = async (id, updates) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    await supabase.from('profiles').update({ details: updates }).eq('id', id);
  };
  const deleteStudent = async (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    await supabase.from('profiles').delete().eq('id', id);
  };
  const changeStudentPassword = (id, newPassword) => {}; // Requires Edge Function

  // --- TEACHERS ---
  const addTeacher = async (teacherData) => {
    try {
      const parts = teacherData.name.split(' ');
      const res = await supabase.functions.invoke('create-tenant-user', {
        body: {
          email: teacherData.email,
          password: teacherData.password || '123456',
          first_name: parts[0] || 'Teacher',
          last_name: parts.slice(1).join(' ') || '',
          role: 'teacher'
        }
      });
      if (res.error) throw res.error;
      const newId = res.data.user.id;
      
      await supabase.from('profiles').update({ details: teacherData }).eq('id', newId);
      setTeachers(prev => [...prev, { ...teacherData, id: newId }]);
      triggerSmartNotification({ title: 'New Teacher', message: `${teacherData.name} added.`, type: 'success', recipientId: 'admin' });
    } catch (err) {
      console.error(err);
    }
  };
  const updateTeacher = async (id, updates) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await supabase.from('profiles').update({ details: updates }).eq('id', id);
  };
  const deleteTeacher = async (id) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    await supabase.from('profiles').delete().eq('id', id);
  };
  const changeTeacherPassword = () => {};

  // --- CLASSES ---
  const addClass = async (classData) => {
    const name = `${classData.gradeName} - ${classData.section}`;
    const { data: newDbClass, error } = await supabase.from('classes').insert({ name, section: classData.section, details: classData, school_id: currentUser.school_id }).select().single();
    if (error) console.error("Error adding class:", error);
    if (newDbClass) {
      setClasses(prev => [...prev, { ...classData, id: newDbClass.id, name, studentsCount: 0, subjects: [] }]);
    }
  };
  const updateClass = async (id, updates) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await supabase.from('classes').update({ details: updates }).eq('id', id);
  };
  const deleteClass = async (id) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    await supabase.from('classes').delete().eq('id', id);
  };
  const assignStudentToClass = async (studentId, classId) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId } : s));
    const student = students.find(s => s.id === studentId);
    if (student) await supabase.from('profiles').update({ details: { ...student, classId } }).eq('id', studentId);
  };
  const removeStudentFromClass = async (studentId, classId) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: null } : s));
    const student = students.find(s => s.id === studentId);
    if (student) await supabase.from('profiles').update({ details: { ...student, classId: null } }).eq('id', studentId);
  };
  const assignSubjectToClass = async (classId, subjectName, teacherId) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, subjects: [...(c.subjects||[]), { name: subjectName, teacherId }] } : c));
  };

  // --- SUBJECTS ---
  const addSubject = async (subjectData) => {
    const { data: newSub, error } = await supabase.from('subjects').insert({ name: subjectData.name, details: subjectData, school_id: currentUser.school_id }).select().single();
    if (error) console.error("Error adding subject:", error);
    if (newSub) setSubjects(prev => [...prev, { ...subjectData, id: newSub.id, name: newSub.name }]);
  };
  const updateSubject = async (id, updates) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    await supabase.from('subjects').update({ details: updates }).eq('id', id);
  };
  const deleteSubject = async (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    await supabase.from('subjects').delete().eq('id', id);
  };

  // --- EXAMS & GRADING ---
  const saveExamResults = async (examType, classId, subjectId, teacherId, results, status = 'SUBMITTED') => {
    const newExams = [...exams];
    results.forEach(res => {
      newExams.push({ examType, classId, subjectId, teacherId, studentId: res.studentId, grade: parseFloat(res.grade), status });
    });
    setExams(newExams);
  };
  const updateExamStatus = (examType, classId, subjectId, newStatus, releaseDate = null) => {
    setExams(prev => prev.map(e => e.examType === examType ? { ...e, status: newStatus, releaseDate } : e));
  };
  const calculateRankings = (classId) => {
    const classStudents = students.filter(s => String(s.classId) === String(classId));
    const rankings = classStudents.map(student => {
      const studentGrades = grades.filter(g => String(g.studentId) === String(student.id));
      if (studentGrades.length === 0) return { studentId: student.id, name: student.name, averageScore: 0, totalScore: 0 };
      const total = studentGrades.reduce((acc, g) => acc + g.score, 0);
      const averageScore = total / studentGrades.length;
      return { studentId: student.id, name: student.name, averageScore, totalScore: total };
    });
    return rankings
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const calculatePromotion = () => 'Pending';

  const getReportCardData = (studentId, classId) => {
    const studentGrades = grades.filter(g => String(g.studentId) === String(studentId));
    const results = {};
    studentGrades.forEach(g => {
      const exam = exams.find(e => String(e.id) === String(g.examId));
      if (!exam) return;
      const subject = subjects.find(s => String(s.id) === String(exam.subjectId));
      const subjectName = subject ? subject.name : 'Unknown';
      if (!results[subjectName]) {
        results[subjectName] = { marks: [], average: 0 };
      }
      results[subjectName].marks.push(g.score);
    });
    Object.keys(results).forEach(sub => {
      const marks = results[sub].marks;
      results[sub].average = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
    });
    const rankings = calculateRankings(classId);
    const myRankObj = rankings.find(r => String(r.studentId) === String(studentId));
    return {
      results,
      rank: myRankObj ? myRankObj.rank : '-',
      classId,
      promotion: 'Pending'
    };
  };

  // --- ATTENDANCE ---
  const getAttendanceStats = (filter = {}) => {
    const total = attendance.length;
    if (total === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
    const present = attendance.filter(a => a.status === 'Present').length;
    return { total, present, absent: total - present, late: 0, rate: Math.round((present / total) * 100) };
  };
  const getStudentAttendanceSummary = (studentId) => {
    const studentRecords = attendance.filter(a => String(a.studentId) === String(studentId));
    const total = studentRecords.length;
    if (total === 0) return { present: 0, absent: 0, late: 0, rate: 100, sessionHistory: [], dailySummary: [] };
    const present = studentRecords.filter(r => r.status.toLowerCase() === 'present').length;
    const late = studentRecords.filter(r => r.status.toLowerCase() === 'late').length;
    const absent = studentRecords.filter(r => r.status.toLowerCase() === 'absent').length;
    const rate = Math.round(((present + late) / total) * 100);
    const dailySummary = studentRecords.map(r => ({
      date: r.date,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
    return { present, absent, late, rate, sessionHistory: [], dailySummary };
  };
  const saveAttendanceRecords = async (records) => {
    setAttendance(prev => [...prev, ...records.map(r => ({ ...r, id: Date.now() }))]);
  };

  // --- TIMETABLES, EVENTS, ANNOUNCEMENTS ---
  const getTimetableForClass = (classId) => timetables.filter(t => t.classId === classId);
  const getTimetableForTeacher = (teacherId) => timetables.filter(t => t.teacherId === teacherId);
  const addTimetableSlot = async (slot) => setTimetables(prev => [...prev, { ...slot, id: Date.now() }]);
  const deleteTimetableSlot = async (id) => setTimetables(prev => prev.filter(t => t.id !== id));
  
  const addEvent = async (eventData) => {
    const { data, error } = await supabase.from('events').insert({ title: eventData.title, date: eventData.date, details: eventData, school_id: currentUser.school_id }).select().single();
    if (error) console.error("Error adding event:", error);
    if (data) setEvents(prev => [...prev, { ...eventData, id: data.id }]);
  };
  const updateEvent = async (id, updates) => setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteEvent = async (id) => setEvents(prev => prev.filter(e => e.id !== id));

  const addAnnouncement = async (dataObj) => {
    const { data, error } = await supabase.from('announcements').insert({ title: dataObj.title, content: dataObj.content, details: dataObj, school_id: currentUser.school_id }).select().single();
    if (error) console.error("Error adding announcement:", error);
    if (data) setAnnouncements(prev => [...prev, { ...dataObj, id: data.id }]);
  };
  const updateAnnouncement = async (id, data) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  const deleteAnnouncement = async (id) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  const submitGrade = () => {};
  const deleteGrade = () => {};
  const updateGrade = () => {};
  const resetData = () => { if(confirm("Reset data?")) localStorage.clear(); window.location.reload(); };

  const value = useMemo(() => ({
    students, addStudent, bulkAddStudents, updateStudent, deleteStudent, changeStudentPassword,
    teachers, addTeacher, updateTeacher, deleteTeacher, changeTeacherPassword,
    classes, addClass, updateClass, deleteClass, assignStudentToClass, removeStudentFromClass, assignSubjectToClass,
    subjects, addSubject, updateSubject, deleteSubject,
    exams, saveExamResults, updateExamStatus, calculateRankings, calculatePromotion, getReportCardData, promotionSettings, setPromotionSettings, examReleaseSettings, setExamReleaseSettings, promotions,
    grades, submitGrade, deleteGrade, updateGrade,
    attendance, saveAttendanceRecords, getAttendanceStats, getStudentAttendanceSummary,
    timetables, addTimetableSlot, deleteTimetableSlot, getTimetableForClass, getTimetableForTeacher,
    events, addEvent, deleteEvent, updateEvent,
    announcements, addAnnouncement, deleteAnnouncement, updateAnnouncement,
    notifications, addNotification, markNotificationRead, triggerSmartNotification, markAllNotificationsRead,
    systemLogs, resetData
  }), [students, teachers, classes, subjects, exams, promotionSettings, examReleaseSettings, promotions, grades, attendance, timetables, events, announcements, notifications, systemLogs]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
