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
        let currentSubjects = [];
        if (subjectData) {
          currentSubjects = subjectData.map(s => ({ ...s.details, id: s.id, name: s.name }));
          setSubjects(currentSubjects);
        }

        // 4. Fetch Attendance
        const { data: attData } = await supabase.from('attendance').select('*');
        if (attData) setAttendance(attData.map(a => ({ ...a.details, id: a.id, studentId: a.student_id, classId: a.class_id, date: a.date, status: a.status })));

        // 5. Fetch Exams & Grades
        const { data: examData } = await supabase.from('exams').select('*');
        const { data: gradeData } = await supabase.from('grades').select('*');
        
        if (examData && gradeData) {
          setGrades(gradeData.map(g => ({
            ...g.details,
            id: g.id,
            examId: g.exam_id,
            studentId: g.student_id,
            score: parseFloat(g.score),
            status: g.status,
            releaseDate: g.release_date
          })));

          const mergedExams = [];
          gradeData.forEach(g => {
            const exam = examData.find(e => e.id === g.exam_id);
            if (exam) {
              const subjectObj = currentSubjects.find(s => s.id === exam.subject_id);
              const subjectName = subjectObj ? subjectObj.name : '';
              mergedExams.push({
                id: g.id,
                examId: exam.id,
                classId: exam.class_id,
                subjectId: exam.subject_id,
                subjectName,
                examType: exam.title,
                studentId: g.student_id,
                grade: parseFloat(g.score),
                status: g.status === 'pending' ? 'DRAFT' : g.status.toUpperCase(),
                releaseDate: g.release_date,
                remarks: g.details?.remarks || '',
                date: exam.date,
                teacherId: g.submitted_by
              });
            }
          });
          setExams(mergedExams);
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
    setStudents(prev => prev.map(s => String(s.id) === String(studentId) ? { ...s, classId } : s));
    const student = students.find(s => String(s.id) === String(studentId));
    if (student) await supabase.from('profiles').update({ details: { ...student, classId } }).eq('id', studentId);
  };
  const removeStudentFromClass = async (studentId, classId) => {
    setStudents(prev => prev.map(s => String(s.id) === String(studentId) ? { ...s, classId: null } : s));
    const student = students.find(s => String(s.id) === String(studentId));
    if (student) await supabase.from('profiles').update({ details: { ...student, classId: null } }).eq('id', studentId);
  };
  const assignSubjectToClass = async (classId, subjectName, teacherId) => {
    try {
      const cls = classes.find(c => String(c.id) === String(classId));
      if (!cls) return;

      const updatedSubjects = [...(cls.subjects || []), { name: subjectName, teacherId }];
      const updatedClass = { ...cls, subjects: updatedSubjects };

      // Update local state
      setClasses(prev => prev.map(c => String(c.id) === String(classId) ? updatedClass : c));

      // Persist class details in classes table
      const details = { ...updatedClass };
      delete details.id;
      delete details.name;
      delete details.section;

      const { error } = await supabase
        .from('classes')
        .update({ details })
        .eq('id', classId);

      if (error) throw error;

      // Persist assignment in teacher_subjects table
      const subjectObj = subjects.find(s => s.name === subjectName);
      if (subjectObj) {
        const { error: tsError } = await supabase
          .from('teacher_subjects')
          .insert({
            teacher_id: teacherId,
            subject_id: subjectObj.id,
            class_id: classId,
            school_id: currentUser?.school_id,
            details: { subjectName }
          });
        if (tsError) console.error("Error inserting into teacher_subjects:", tsError);
      }
    } catch (err) {
      console.error("Error in assignSubjectToClass:", err);
    }
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
  const refreshExamData = async () => {
    try {
      const { data: examData } = await supabase.from('exams').select('*');
      const { data: gradeData } = await supabase.from('grades').select('*');
      const { data: subjectData } = await supabase.from('subjects').select('*');

      if (examData && gradeData) {
        const formattedGrades = gradeData.map(g => ({
          ...g.details,
          id: g.id,
          examId: g.exam_id,
          studentId: g.student_id,
          score: parseFloat(g.score),
          status: g.status,
          releaseDate: g.release_date
        }));
        setGrades(formattedGrades);

        const currentSubjects = subjectData ? subjectData.map(s => ({ ...s.details, id: s.id, name: s.name })) : subjects;

        const mergedExams = [];
        gradeData.forEach(g => {
          const exam = examData.find(e => e.id === g.exam_id);
          if (exam) {
            const subjectObj = currentSubjects.find(s => s.id === exam.subject_id);
            const subjectName = subjectObj ? subjectObj.name : '';
            mergedExams.push({
              id: g.id,
              examId: exam.id,
              classId: exam.class_id,
              subjectId: exam.subject_id,
              subjectName,
              examType: exam.title,
              studentId: g.student_id,
              grade: parseFloat(g.score),
              status: g.status === 'pending' ? 'DRAFT' : g.status.toUpperCase(),
              releaseDate: g.release_date,
              remarks: g.details?.remarks || '',
              date: exam.date,
              teacherId: g.submitted_by
            });
          }
        });
        setExams(mergedExams);
      }
    } catch (err) {
      console.error("Error refreshing exam data:", err);
    }
  };

  const saveExamResults = async (examType, classId, subjectId, teacherId, results, status = 'SUBMITTED') => {
    try {
      let resolvedSubjectId = subjectId;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(subjectId)) {
        const subjectObj = subjects.find(s => s.name.toLowerCase() === subjectId.toLowerCase());
        if (subjectObj) {
          resolvedSubjectId = subjectObj.id;
        } else {
          const { data: newSub, error: subErr } = await supabase
            .from('subjects')
            .insert({ name: subjectId, school_id: currentUser.school_id, details: {} })
            .select()
            .single();
          if (subErr) throw subErr;
          resolvedSubjectId = newSub.id;
          setSubjects(prev => [...prev, { id: newSub.id, name: newSub.name }]);
        }
      }

      let examId;
      const { data: existingExams, error: findErr } = await supabase
        .from('exams')
        .select('id')
        .eq('class_id', classId)
        .eq('subject_id', resolvedSubjectId)
        .eq('title', examType);

      if (findErr) throw findErr;

      if (existingExams && existingExams.length > 0) {
        examId = existingExams[0].id;
      } else {
        const { data: newExam, error: createErr } = await supabase
          .from('exams')
          .insert({
            title: examType,
            class_id: classId,
            subject_id: resolvedSubjectId,
            date: new Date().toLocaleDateString('en-CA'),
            school_id: currentUser.school_id,
            details: { examType }
          })
          .select()
          .single();

        if (createErr) throw createErr;
        examId = newExam.id;
      }

      const dbStatus = status === 'DRAFT' ? 'pending' : (status.toLowerCase() === 'submitted' ? 'submitted' : status.toLowerCase());
      const gradeRows = results.map(res => ({
        exam_id: examId,
        student_id: res.studentId,
        score: parseFloat(res.grade) || 0,
        status: dbStatus,
        submitted_by: teacherId,
        school_id: currentUser.school_id,
        details: { remarks: res.remarks || '' }
      }));

      const { error: gradesErr } = await supabase
        .from('grades')
        .upsert(gradeRows, { onConflict: 'exam_id,student_id' });

      if (gradesErr) throw gradesErr;

      await refreshExamData();
    } catch (err) {
      console.error("Error saving exam results:", err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to save exam results', type: 'error' });
    }
  };

  const updateExamStatus = async (examType, classId, subjectId, newStatus, releaseDate = null) => {
    try {
      const dbStatus = newStatus === 'APPROVED' ? 'approved' :
                       (newStatus === 'REJECTED' ? 'pending' :
                       (newStatus === 'PUBLISHED' ? 'published' : 'submitted'));

      let query = supabase.from('exams').select('id').eq('class_id', classId).eq('title', examType);
      if (subjectId && subjectId !== 'all') {
        const subjectObj = subjects.find(s => s.id === subjectId || s.name.toLowerCase() === subjectId.toLowerCase());
        if (subjectObj) {
          query = query.eq('subject_id', subjectObj.id);
        }
      }
      
      const { data: matchedExams, error: examErr } = await query;
      if (examErr) throw examErr;

      if (matchedExams && matchedExams.length > 0) {
        const examIds = matchedExams.map(e => e.id);
        const updates = { status: dbStatus };
        if (releaseDate) {
          updates.release_date = releaseDate;
        } else if (newStatus === 'PUBLISHED') {
          updates.release_date = new Date().toISOString();
        }

        const { error: gradeErr } = await supabase
          .from('grades')
          .update(updates)
          .in('exam_id', examIds);

        if (gradeErr) throw gradeErr;
      }

      await refreshExamData();
    } catch (err) {
      console.error("Error in updateExamStatus:", err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to update status', type: 'error' });
    }
  };
  const calculateRankings = (classId) => {
    const classStudents = students.filter(s => String(s.classId) === String(classId));
    const isStudent = currentUser?.role === 'student';
    
    const rankings = classStudents.map(student => {
      let studentGrades = grades.filter(g => String(g.studentId) === String(student.id));
      
      // If student is viewing, only rank based on published exam grades
      if (isStudent) {
        studentGrades = studentGrades.filter(g => {
          const exam = exams.find(e => String(e.id) === String(g.id));
          return exam && exam.status === 'PUBLISHED';
        });
      }
      
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
    const isStudent = currentUser?.role === 'student';
    
    studentGrades.forEach(g => {
      // Find the merged exam row in the exams state by comparing grade row IDs
      const exam = exams.find(e => String(e.id) === String(g.id));
      if (!exam) return;
      
      // If student is requesting report card, only show PUBLISHED results
      if (isStudent && exam.status !== 'PUBLISHED') return;
      
      const subject = subjects.find(s => String(s.id) === String(exam.subjectId));
      const subjectName = subject ? subject.name : 'Unknown';
      
      if (!results[subjectName]) {
        results[subjectName] = {
          marks: [],
          average: 0,
          "Before Midterm": "-",
          "Midterm": "-",
          "After Midterm": "-",
          "Final": "-"
        };
      }
      
      results[subjectName][exam.examType] = g.score;
      results[subjectName].marks.push(g.score);
    });
    
    Object.keys(results).forEach(sub => {
      const marks = results[sub].marks;
      results[sub].average = marks.length > 0
        ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length)
        : 0;
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
    try {
      const dbRecords = records.map(r => ({
        student_id: r.studentId,
        class_id: r.classId,
        date: r.date,
        status: r.status,
        marked_by: currentUser.id,
        school_id: currentUser.school_id,
        details: {
          startTime: r.startTime,
          endTime: r.endTime,
          subjectName: r.subjectName,
          teacherId: r.teacherId,
          status: r.status
        }
      }));

      const { data, error } = await supabase
        .from('attendance')
        .upsert(dbRecords, { onConflict: 'student_id,class_id,date' })
        .select();

      if (error) throw error;

      setAttendance(prev => {
        const filtered = prev.filter(p => !records.some(r => 
          String(r.studentId) === String(p.studentId) && 
          String(r.classId) === String(p.classId) && 
          r.date === p.date &&
          r.startTime === p.startTime &&
          r.subjectName === p.subjectName
        ));
        
        return [...filtered, ...records.map((r, index) => ({
          ...r,
          id: (data && data[index]) ? data[index].id : Date.now() + index
        }))];
      });
    } catch (err) {
      console.error("Error saving attendance:", err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to save attendance', type: 'error' });
    }
  };

  // --- TIMETABLES, EVENTS, ANNOUNCEMENTS ---
  const getTimetableForClass = (classId) => timetables.filter(t => t.classId === classId);
  const getTimetableForTeacher = (teacherId) => timetables.filter(t => t.teacherId === teacherId);
  const addTimetableSlot = async (slot) => {
    try {
      let subjectId = slot.subjectId;
      let teacherId = slot.teacherId;

      const dayMapping = {
        'Sunday': 1,
        'Monday': 2,
        'Tuesday': 3,
        'Wednesday': 4,
        'Thursday': 5,
        'Friday': 6,
        'Saturday': 7
      };
      const day_of_week = dayMapping[slot.day] || 1;

      if (slot.isBreak) {
        // Find or create "Break" subject for this school
        let breakSubject = subjects.find(s => s.name === 'Break');
        if (!breakSubject) {
          const { data: newSub, error: subErr } = await supabase
            .from('subjects')
            .insert({ name: 'Break', school_id: currentUser.school_id, details: { levels: ['Primary', 'Middle', 'Secondary'] } })
            .select()
            .single();
          if (subErr) throw subErr;
          breakSubject = { id: newSub.id, name: 'Break' };
          setSubjects(prev => [...prev, breakSubject]);
        }
        subjectId = breakSubject.id;
        // Fallback: Admin acts as teacher for break session
        teacherId = currentUser.id;
      } else {
        const subjectObj = subjects.find(s => s.name === slot.subjectName);
        if (subjectObj) {
          subjectId = subjectObj.id;
        } else {
          const { data: newSub, error: subErr } = await supabase
            .from('subjects')
            .insert({ name: slot.subjectName, school_id: currentUser.school_id, details: {} })
            .select()
            .single();
          if (subErr) throw subErr;
          subjectId = newSub.id;
          setSubjects(prev => [...prev, { id: newSub.id, name: newSub.name }]);
        }
      }

      if (!teacherId) {
        teacherId = currentUser.id;
      }

      const formatTime = (tStr) => tStr.length === 5 ? `${tStr}:00` : tStr;

      const dbSlot = {
        class_id: slot.classId,
        subject_id: subjectId,
        teacher_id: teacherId,
        day_of_week,
        start_time: formatTime(slot.startTime),
        end_time: formatTime(slot.endTime),
        school_id: currentUser.school_id,
        details: {
          ...slot,
          subjectId,
          teacherId
        }
      };

      const { data: newDbSlot, error: insertErr } = await supabase
        .from('timetable')
        .insert(dbSlot)
        .select()
        .single();

      if (insertErr) throw insertErr;

      setTimetables(prev => [...prev, {
        ...slot,
        id: newDbSlot.id,
        subjectId,
        teacherId
      }]);
    } catch (err) {
      console.error("Error adding timetable slot:", err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to add session', type: 'error' });
    }
  };

  const deleteTimetableSlot = async (id) => {
    try {
      const { error } = await supabase.from('timetable').delete().eq('id', id);
      if (error) throw error;
      setTimetables(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting timetable slot:", err);
      triggerSmartNotification({ title: 'Error', message: 'Failed to delete session', type: 'error' });
    }
  };
  
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
