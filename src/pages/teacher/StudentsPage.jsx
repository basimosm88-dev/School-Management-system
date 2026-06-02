import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const StudentsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialClassId = queryParams.get('classId');

  const { classes, students, attendance, exams } = useData();
  const { currentUser } = useAppContext();
  const { t } = useSettings();
  
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingStudent, setViewingStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, attendance, grades

  // Get teacher's assigned classes
  const assignedClasses = classes.filter(cls => 
    (currentUser?.assignedClasses || []).some(id => String(id) === String(cls.id)) || 
    String(cls.teacherId) === String(currentUser?.id)
  );

  // Filter students based on assigned classes and selection
  const filteredStudents = useMemo(() => {
    const assignedClassIds = assignedClasses.map(c => String(c.id));
    let list = students.filter(s => 
      assignedClassIds.includes(String(s.classId))
    );

    if (selectedClassId) {
      list = list.filter(s => String(s.classId) === String(selectedClassId));
    }

    if (searchTerm) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toString().includes(searchTerm) ||
        (s.systemId || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return list;
  }, [students, classes, currentUser, selectedClassId, searchTerm]);

  // Group by class
  const groupedStudents = useMemo(() => {
    const groups = {};
    filteredStudents.forEach(s => {
      const className = classes.find(c => c.id === s.classId)?.name || t('unknown');
      if (!groups[className]) groups[className] = [];
      groups[className].push(s);
    });
    return groups;
  }, [filteredStudents, classes, t]);

  const handleViewStudent = (student) => {
    setViewingStudent(student);
    setActiveTab('profile');
  };

  const renderStudentModalContent = () => {
    if (!viewingStudent) return null;

    const studentAttendance = attendance.filter(a => 
      a.studentId === viewingStudent.id && 
      a.teacherId === currentUser?.id
    );

    const studentGrades = exams.filter(e => 
      e.studentId === viewingStudent.id && 
      (e.teacherId === currentUser?.id || (e.status === 'PUBLISHED'))
    );

    return (
      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {['profile', 'attendance', 'grades'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-label font-bold capitalize transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t(tab)}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t('fullName')}</p>
                <p className="text-label text-slate-900 dark:text-white font-bold">{viewingStudent.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t('studentId')}</p>
                <p className="text-label font-mono text-slate-600 dark:text-slate-300">#{viewingStudent.systemId || viewingStudent.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t('email')}</p>
                <p className="text-label text-slate-600 dark:text-slate-300">{viewingStudent.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t('phone')}</p>
                <p className="text-label text-slate-600 dark:text-slate-300">{viewingStudent.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t('class')}</p>
                <p className="text-label text-slate-900 dark:text-white font-bold">
                  {classes.find(c => c.id === viewingStudent.classId)?.name || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h4 className="text-label font-bold text-slate-900 dark:text-white">{t('recentSessionsWithYou')}</h4>
              {studentAttendance.length === 0 ? (
                <p className="text-label text-slate-400 italic">{t('noAttendanceSessionsDesc')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-label">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3">{t('date')}</th>
                        <th className="px-4 py-3">{t('subject')}</th>
                        <th className="px-4 py-3">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentAttendance.slice(0, 10).map((record, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.date}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.subjectName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                              record.status === 'Absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-4">
              <h4 className="text-label font-bold text-slate-900 dark:text-white">{t('academicPerformance')}</h4>
              {studentGrades.length === 0 ? (
                <p className="text-label text-slate-400 italic">{t('noGradesForSubjectsDesc')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-label">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3">{t('examType')}</th>
                        <th className="px-4 py-3">{t('subject')}</th>
                        <th className="px-4 py-3 text-center">{t('grade')}</th>
                        <th className="px-4 py-3">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentGrades.map((record, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.examType}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.subjectName}</td>
                          <td className="px-4 py-3 text-center font-bold text-primary">{record.grade}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              record.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' :
                              record.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                              record.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <PageLayout role="teacher" title={t('students')}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* PAGE HEADER */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-heading text-slate-900 dark:text-white">{t('students')}</h2>
          <p className="text-label text-slate-500/80 mt-1">{t('studentsSubtitle')}</p>
        </div>
        {/* Header Control Bar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full md:w-auto relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            <input 
              type="text" 
              placeholder={t('searchByNameOrIdPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="w-full md:w-64">
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-label focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">{t('allMyClasses')}</option>
              {assignedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.keys(groupedStudents).length === 0 ? (
          <EmptyState 
            icon="group_off" 
            message={t('noStudentsFound')} 
            description={t('noResultsDescription')} 
          />
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedStudents).map(className => (
              <section key={className} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                  <h2 className="text-section font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {className}
                  </h2>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md">
                    {groupedStudents[className].length} {t('students')}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-label">
                      <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">{t('fullName')}</th>
                          <th className="px-6 py-4">{t('studentId')}</th>
                          <th className="px-6 py-4">{t('phone')}</th>
                          <th className="px-6 py-4">{t('status')}</th>
                          <th className="px-6 py-4 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groupedStudents[className].map(student => (
                          <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                                  {student.name[0]}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-slate-500">#{student.systemId || student.id}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {student.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">
                                {t('active')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleViewStudent(student)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                {t('viewDetails')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!viewingStudent} 
        onClose={() => setViewingStudent(null)} 
        title={t('studentInsight')}
        showFooter={false}
      >
        {renderStudentModalContent()}
      </Modal>
    </PageLayout>
  );
};

export default StudentsPage;
