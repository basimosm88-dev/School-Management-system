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

  const assignedClasses = classes.filter(cls => 
    (currentUser?.assignedClasses || []).includes(cls.id) || 
    cls.teacherId === currentUser?.id
  );

  const availableSessions = useMemo(() => {
    if (!selectedClassId) return [];
    return timetables.filter(t => 
      t.classId === parseInt(selectedClassId) && 
      t.day === dayName &&
      t.teacherId === currentUser?.id
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedClassId, dayName, timetables, currentUser]);

  useEffect(() => {
    if (selectedClassId) {
      const filtered = students.filter(s => s.classId === parseInt(selectedClassId));
      setClassStudents(filtered);
      
      const session = availableSessions.find(s => s.id === parseInt(selectedSessionId));
      
      if (session) {
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
    <PageLayout role="teacher" title="Daily Attendance">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* PAGE HEADER */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-heading text-slate-900 dark:text-white">Attendance</h2>
          <p className="text-label text-slate-500/80 mt-1">Record and manage student daily attendance for your assigned classes.</p>
        </div>
        
        {/* ENHANCED CONTROL BAR */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Class Section</label>
              <select 
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSessionId('');
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="">Choose class...</option>
                {assignedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Session Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSessionId('');
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block px-1">Scheduled Session</label>
              <select 
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedClassId || availableSessions.length === 0}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <option value="">
                  {availableSessions.length === 0 ? (selectedClassId ? 'No sessions today' : 'Select class first') : 'Choose session...'}
                </option>
                {availableSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({formatTime(s.startTime)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button 
                onClick={handleMarkAllPresent}
                disabled={!selectedSessionId}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-label font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-section">done_all</span>
                Mark All Present
              </button>
            </div>
          </div>
          
          {availableSessions.length === 0 && selectedClassId && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-rose-500 text-section">info</span>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                No sessions scheduled for this class on {dayName} ({selectedDate})
              </p>
            </div>
          )}
        </div>

        {/* REFINED STUDENTS TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all min-h-[500px]">
          {!selectedSessionId ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[40px] opacity-20">fact_check</span>
              </div>
              <h3 className="text-section font-bold uppercase tracking-widest opacity-40">Ready to Record</h3>
              <p className="text-label opacity-40 mt-1">Select class and session parameters above to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-label">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5">Identifier</th>
                    <th className="px-8 py-5 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {classStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {student.name[0]}
                          </div>
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold block leading-tight">{student.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-[11px] text-slate-500 font-bold tracking-wider border border-slate-200/50 dark:border-slate-700">
                          #{student.id}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-2">
                          {[
                            { id: 'Present', color: 'emerald' },
                            { id: 'Late', color: 'amber' },
                            { id: 'Absent', color: 'rose' }
                          ].map(status => (
                            <button
                              key={status.id}
                              onClick={() => handleStatusChange(student.id, status.id)}
                              className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                                attendanceData[student.id] === status.id
                                  ? `bg-${status.color}-500 text-white border-${status.color}-500 shadow-lg shadow-${status.color}-500/20`
                                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {status.id}
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

        {/* PRIMARY SAVE ACTION */}
        {selectedSessionId && classStudents.length > 0 && (
          <div className="flex justify-end p-2 animate-in slide-in-from-bottom-2">
            <button 
              onClick={handleSave}
              className="px-10 py-4 bg-primary text-white text-label font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-section">verified</span>
              Submit Session Records
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TeacherAttendancePage;
