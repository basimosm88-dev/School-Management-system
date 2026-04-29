import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const TeacherAttendancePage = () => {
 const { classes, students, saveAttendanceRecords, attendance, addNotification, timetables } = useData();
 const { currentUser } = useAppContext();

 const [selectedClassId, setSelectedClassId] = useState('');
 const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
 const [selectedSessionId, setSelectedSessionId] = useState('');
 const [classStudents, setClassStudents] = useState([]);
 const [attendanceData, setAttendanceData] = useState({}); // { studentId: status }

 const dayName = useMemo(() => {
 const d = new Date(selectedDate);
 return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
 }, [selectedDate]);

 // 1. Get assigned classes for this teacher
 const assignedClasses = classes.filter(cls => 
 (currentUser?.assignedClasses || []).includes(cls.id) || 
 cls.teacherId === currentUser?.id
 );

 // 2. Get sessions for the selected class and day
 const availableSessions = useMemo(() => {
 if (!selectedClassId) return [];
 return timetables.filter(t => 
 t.classId === parseInt(selectedClassId) && 
 t.day === dayName &&
 t.teacherId === currentUser?.id
 ).sort((a, b) => a.startTime.localeCompare(b.startTime));
 }, [selectedClassId, dayName, timetables, currentUser]);

 // 3. Load students and existing session attendance
 useEffect(() => {
 if (selectedClassId) {
 const filtered = students.filter(s => s.classId === parseInt(selectedClassId));
 setClassStudents(filtered);
 
 const session = availableSessions.find(s => s.id === parseInt(selectedSessionId));
 
 if (session) {
 // Load existing attendance for this SPECIFIC session
 const existing = attendance.filter(a => 
 a.classId === parseInt(selectedClassId) && 
 a.date === selectedDate &&
 a.startTime === session.startTime &&
 a.subjectName === session.subjectName
 );
 
 const initialMap = {};
 filtered.forEach(s => {
 const record = existing.find(a => a.studentId === s.id);
 initialMap[s.id] = record ? record.status : 'Present';
 });
 setAttendanceData(initialMap);
 } else {
 setAttendanceData({});
 }
 } else {
 setClassStudents([]);
 setAttendanceData({});
 }
 }, [selectedClassId, selectedDate, selectedSessionId, students, attendance, availableSessions]);

 const handleStatusChange = (studentId, status) => {
 setAttendanceData(prev => ({ ...prev, [studentId]: status }));
 };

 const handleMarkAllPresent = () => {
 const bulk = {};
 classStudents.forEach(s => {
 bulk[s.id] = 'Present';
 });
 setAttendanceData(bulk);
 };

 const handleSave = () => {
 if (!selectedClassId || !selectedSessionId) return;
 
 const session = availableSessions.find(s => s.id === parseInt(selectedSessionId));
 if (!session) return;

 const records = classStudents.map(s => ({
 classId: parseInt(selectedClassId),
 studentId: s.id,
 teacherId: currentUser.id,
 date: selectedDate,
 startTime: session.startTime,
 endTime: session.endTime,
 subjectName: session.subjectName,
 status: attendanceData[s.id] || 'Present'
 }));

 saveAttendanceRecords(records);
 addNotification('Attendance saved successfully', 'success');
 };

 const formatTime = (t) => {
 const [h, m] = t.split(':');
 const hNum = parseInt(h);
 const suffix = hNum >= 12 ? 'PM' : 'AM';
 const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
 return `${h12}:${m} ${suffix}`;
 };

 return (
 <PageLayout role="teacher" title="Take Attendance">
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* CONTROL BAR */}
 <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
 <div>
 <label className="text-body-sm text-slate-400/80 mb-2 block">Select Class</label>
 <select 
 value={selectedClassId}
 onChange={(e) => {
 setSelectedClassId(e.target.value);
 setSelectedSessionId('');
 }}
 className="form-input-custom w-full"
 >
 <option value="">Choose class...</option>
 {assignedClasses.map(cls => (
 <option key={cls.id} value={cls.id}>{cls.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-body-sm text-slate-400/80 mb-2 block">Date</label>
 <input 
 type="date" 
 value={selectedDate}
 onChange={(e) => {
 setSelectedDate(e.target.value);
 setSelectedSessionId('');
 }}
 className="form-input-custom w-full"
 />
 </div>
 <div>
 <label className="text-body-sm text-slate-400/80 mb-2 block">Select Session</label>
 <select 
 value={selectedSessionId}
 onChange={(e) => setSelectedSessionId(e.target.value)}
 disabled={!selectedClassId || availableSessions.length === 0}
 className="form-input-custom w-full disabled:opacity-30"
 >
 <option value="">
 {availableSessions.length === 0 ? 'No sessions today' : 'Choose session...'}
 </option>
 {availableSessions.map(s => (
 <option key={s.id} value={s.id}>
 {s.subjectName} ({formatTime(s.startTime)} - {formatTime(s.endTime)})
 </option>
 ))}
 </select>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={handleMarkAllPresent}
 disabled={!selectedSessionId}
 className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-body-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
 >
 Mark All Present
 </button>
 </div>
 </div>
 {availableSessions.length === 0 && selectedClassId && (
 <p className="mt-4 text-body-sm text-rose-500 flex items-center gap-2">
 <span className="material-symbols-outlined text-body-sm">warning</span>
 No sessions scheduled for this class on {dayName} ({selectedDate})
 </p>
 )}
 </div>

 {/* STUDENTS LIST */}
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors min-h-[400px]">
 {!selectedSessionId ? (
 <div className="flex flex-col items-center justify-center h-[400px] text-slate-400/80">
 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 opacity-40">
 <span className="material-symbols-outlined text-kpi-value">fact_check</span>
 </div>
 <p className="text-body-sm opacity-60">Select class and session to take attendance</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-body-sm">
 <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400/80 text-body-sm border-b border-slate-100 dark:border-slate-800">
 <tr>
 <th className="px-8 py-5">Student Information</th>
 <th className="px-8 py-5">Student ID</th>
 <th className="px-8 py-5 text-center">Mark Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {classStudents.map(student => (
 <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-8 py-5">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-body-sm">
 {student.name[0]}
 </div>
 <div>
 <span className="text-slate-800 dark:text-slate-200 block">{student.name}</span>
 <span className="text-body-sm text-slate-400/80">{student.email}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-5">
 <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-body-sm text-slate-500/80">
 {student.id}
 </span>
 </td>
 <td className="px-8 py-5">
 <div className="flex justify-center gap-3">
 {['Present', 'Absent', 'Late'].map(status => (
 <button
 key={status}
 onClick={() => handleStatusChange(student.id, status)}
 className={`px-6 py-2 rounded-xl text-body-sm  transition-all border ${
 attendanceData[student.id] === status
 ? status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' :
 status === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/20' :
 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-500/20'
 : 'bg-white dark:bg-slate-800 text-slate-400/80 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
 }`}
 >
 {status}
 </button>
 ))}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* SAVE BUTTON */}
 {selectedSessionId && classStudents.length > 0 && (
 <div className="flex justify-end sticky bottom-6 z-10">
 <button 
 onClick={handleSave}
 className="px-12 py-4 bg-primary text-white text-body-sm rounded-2xl shadow-2xl shadow-primary/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3"
 >
 <span className="material-symbols-outlined text-kpi-value">verified</span>
 Submit Session Attendance
 </button>
 </div>
 )}
 </div>
 </PageLayout>
 );
};

export default TeacherAttendancePage;
