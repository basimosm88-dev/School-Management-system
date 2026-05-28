import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

const ResultsPage = ({ role }) => {
  const { 
    students, classes, exams,
    getReportCardData, calculateRankings 
  } = useData();
  const { schoolSettings, t } = useSettings();
  const { currentUser } = useAppContext();
  
  // --- STATE ---
  const userRole = role || currentUser?.role || 'admin';
  const [viewMode, setViewMode] = useState(userRole === 'student' ? 'history' : 'grid'); 
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [printConfig, setPrintConfig] = useState({ type: 'report-card', examType: null });

  // Helper for printing
  const handlePrint = (studentId = null, config = { type: 'report-card', examType: null }) => {
    if (studentId) setViewingStudentId(studentId);
    setPrintConfig(config);
    setTimeout(() => {
      window.print();
      // Reset after print dialog
      setPrintConfig({ type: 'report-card', examType: null });
    }, 300);
  };

  // --- DERIVED DATA ---
  const availableClasses = useMemo(() => {
    if (userRole === 'admin') return classes;
    if (userRole === 'teacher') {
      const assignedIds = (currentUser?.assignedClasses || []).map(id => String(id));
      return classes.filter(c => 
        assignedIds.includes(String(c.id)) || 
        String(c.teacherId) === String(currentUser?.id)
      );
    }
    return classes.filter(c => String(c.id) === String(currentUser?.classId));
  }, [classes, userRole, currentUser]);

  const currentClass = classes.find(c => String(c.id) === String(selectedClassId));

  // Actions
  const handleSelectClass = (classId) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedClassId(classId);
      setSelectedSubject(null); // Reset subject state from any prior selections to prevent crashes on other classes
      if (userRole === 'teacher') {
        setViewMode('subject');
      } else {
        setViewMode('list');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleSelectSubject = (subjectName) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedSubject(subjectName);
      setViewMode('list');
      setIsLoading(false);
    }, 400);
  };

  const handleSelectStudent = (studentId) => {
    setIsLoading(true);
    setTimeout(() => {
      setViewingStudentId(studentId);
      setViewMode('detail');
      setIsLoading(false);
    }, 400);
  };

  const goBack = () => {
    if (viewMode === 'detail' && userRole !== 'student') {
      setViewMode('list');
    } else if (viewMode === 'list') {
      if (userRole === 'teacher') {
        setViewMode('subject');
      } else {
        setViewMode('grid');
      }
    } else if (viewMode === 'subject') {
      setViewMode('grid');
    } else if (viewMode === 'detail' && userRole === 'student') {
      setViewMode('history');
    }
  };

  // Teacher Subject Filter
  const teacherSubjectNames = useMemo(() => {
    if (userRole !== 'teacher') return null;
    const subjects = new Set();
    classes.forEach(c => {
      (c.subjects || []).forEach(s => {
        if (s.teacherId === currentUser?.id) subjects.add(s.name);
      });
    });
    return subjects;
  }, [classes, currentUser, userRole]);

  // Student Academic History Calculation
  const studentAcademicHistory = useMemo(() => {
    const targetStudentId = viewingStudentId || currentUser?.id;
    if (!targetStudentId) return [];

    const sId = targetStudentId;
    const student = students.find(s => String(s.id) === String(sId));
    
    // Find all classes this student has published results in
    const studentExams = exams.filter(e => String(e.studentId) === String(sId) && e.status === 'PUBLISHED');
    let classIds = [...new Set(studentExams.map(e => e.classId))];
    
    // Ensure current class is visible even if no results published yet
    const currentCid = student?.classId || currentUser?.classId;
    if (currentCid && !classIds.some(id => String(id) === String(currentCid))) {
      classIds.push(currentCid);
    }
    
    if (classIds.length === 0) return [];

    return classIds.map(cid => {
      const classObj = classes.find(c => String(c.id) === String(cid));
      const reportData = getReportCardData(sId, cid);
      
      // Filter subjects for teacher role
      let subjects = Object.keys(reportData.results);
      if (userRole === 'teacher' && teacherSubjectNames) {
        subjects = subjects.filter(s => teacherSubjectNames.has(s));
      }

      const filteredResults = {};
      subjects.forEach(s => { filteredResults[s] = reportData.results[s]; });

      const totalAverage = subjects.length > 0 
        ? (subjects.reduce((acc, sub) => acc + (parseFloat(filteredResults[sub].average) || 0), 0) / subjects.length).toFixed(1)
        : "0.0";
      
      const totalScore = subjects.reduce((acc, sub) => acc + (parseFloat(filteredResults[sub].average) || 0), 0).toFixed(1);

      const examAverages = {};
      ["Before Midterm", "Midterm", "After Midterm", "Final"].forEach(type => {
        const scores = subjects.map(sub => filteredResults[sub][type]).filter(s => typeof s === 'number');
        examAverages[type] = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
      });

      const midtermEntered = examAverages["Midterm"] !== null;
      const finalEntered = examAverages["Final"] !== null;
      
      let status = "Pending";
      if (midtermEntered && finalEntered) {
        status = parseFloat(totalAverage) >= 50 ? 'Pass' : 'Fail';
      }

      return {
        ...reportData,
        results: filteredResults,
        student,
        className: classObj?.name || `Class ${cid}`,
        totalAverage,
        totalScore,
        subjectsCount: subjects.length,
        status,
        rank: calculateRankings(cid).find(r => String(r.studentId) === String(sId))?.rank || '-',
        promotion: status === 'Pass' ? 'Promoted' : 'Held Back'
      };
    }).sort((a, b) => String(b.classId).localeCompare(String(a.classId)));
  }, [viewingStudentId, currentUser, exams, classes, getReportCardData, students, calculateRankings, userRole, teacherSubjectNames]);

  // Admin/Teacher Student List Data
  const studentResults = useMemo(() => {
    if (!selectedClassId) return [];
    
    const cid = selectedClassId;
    const classStudents = students.filter(s => String(s.classId) === String(cid))
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const rankings = calculateRankings(cid);
    
    return classStudents.map(student => {
      const reportData = getReportCardData(student.id, cid);
      const studentRank = rankings.find(r => String(r.studentId) === String(student.id));
      
      // Calculate averages for each exam type
      // If teacher role with a selected subject, only show that subject's scores
      const subjects = userRole === 'teacher' && selectedSubject 
        ? [selectedSubject] 
        : Object.keys(reportData?.results || {});

      const examTypes = ["Before Midterm", "Midterm", "After Midterm", "Final"];
      const examAverages = {};
      
      examTypes.forEach(type => {
        const scores = subjects.map(sub => {
          const subData = reportData?.results?.[sub];
          return subData ? subData[type] : undefined;
        }).filter(s => typeof s === 'number');
        examAverages[type] = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "Not entered yet";
      });

      // Calculate Outcome
      let outcome = "Pending";
      const midtermEntered = examAverages["Midterm"] !== "Not entered yet";
      const finalEntered = examAverages["Final"] !== "Not entered yet";
      
      if (midtermEntered && finalEntered) {
        const validSubjects = subjects.filter(sub => reportData?.results?.[sub]);
        if (validSubjects.length > 0) {
          const avg = validSubjects.reduce((acc, sub) => acc + (parseFloat(reportData.results[sub].average) || 0), 0) / validSubjects.length;
          outcome = avg >= 50 ? 'Pass' : 'Fail';
        }
      }

      const displayAverage = userRole === 'teacher' && selectedSubject
        ? parseFloat(reportData?.results?.[selectedSubject]?.average || 0)
        : (studentRank ? parseFloat(studentRank.averageScore.toFixed(1)) : 0);

      return {
        ...student,
        results: reportData?.results || {},
        examAverages,
        displayAverage,
        displayTotal: studentRank && typeof studentRank.totalScore === 'number' ? parseFloat(studentRank.totalScore.toFixed(1)) : 0,
        rank: studentRank?.rank || '-',
        status: outcome
      };
    }).sort((a, b) => {
      if (a.rank === '-') return 1;
      if (b.rank === '-') return -1;
      return a.rank - b.rank;
    });
  }, [students, selectedClassId, searchTerm, getReportCardData, calculateRankings, userRole, selectedSubject]);

  if (isLoading) {
    return (
      <PageLayout role={userRole} title={t('results')}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-on-surface-variant animate-pulse">Processing results...</p>
        </div>
      </PageLayout>
    );
  }

  const renderContent = () => {
    if (viewMode === 'grid') {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h2 className="text-heading text-on-surface">{t('results')}</h2>
            <p className="text-label text-on-surface-variant mt-1">Access verified academic records and performance metrics across all classes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableClasses.map(c => {
              const classRankings = calculateRankings(c.id);
              const avg = classRankings.length > 0 
                ? (classRankings.reduce((acc, curr) => acc + curr.averageScore, 0) / classRankings.length).toFixed(1)
                : '0.0';
              
              return (
                <div 
                  key={c.id} 
                  onClick={() => handleSelectClass(c.id)}
                  className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-display">school</span>
                    </div>
                    <h3 className="text-section text-on-surface mb-1">{c.name}</h3>
                    <p className="text-label text-on-surface-variant mb-6">{students.filter(s => String(s.classId) === String(c.id)).length} Students enrolled</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Class Average</p>
                        <p className="text-label text-primary font-bold">{avg}%</p>
                      </div>
                      <span className="text-label text-primary font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View List
                        <span className="material-symbols-outlined text-section">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {availableClasses.length === 0 && (
            <EmptyState icon="auto_stories" message="No Results Found" description="Select a class to view or publish academic results." />
          )}
        </div>
      );
    }

    if (viewMode === 'subject') {
      // Get subjects for the selected class that this teacher teaches
      const classSubjects = currentClass?.subjects?.filter(s => s.teacherId === currentUser?.id) || [];
      
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={goBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center text-label truncate">
              <span className="text-on-surface-variant cursor-pointer hover:text-primary" onClick={goBack}>Classes</span>
              <span className="material-symbols-outlined text-on-surface-variant/30 text-section mx-1">chevron_right</span>
              <span className="text-on-surface truncate font-bold">{currentClass?.name} Subjects</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classSubjects.map((sub, idx) => (
              <div 
                key={idx}
                onClick={() => handleSelectSubject(sub.name)}
                className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-display">auto_stories</span>
                  </div>
                  <div>
                    <h3 className="text-section font-black text-on-surface">{sub.name}</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mt-1">Select to view results</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {classSubjects.length === 0 && (
            <EmptyState icon="auto_stories" message="No Subjects Found" description="You are not assigned to any subjects in this class." />
          )}
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <button onClick={goBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex items-center text-label truncate">
                <span className="text-on-surface-variant cursor-pointer hover:text-primary" onClick={goBack}>
                  {userRole === 'teacher' ? 'Subjects' : 'Classes'}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-section mx-1">chevron_right</span>
                <span className="text-on-surface truncate font-bold">
                  {userRole === 'teacher' ? selectedSubject : currentClass?.name}
                </span>
              </div>
            </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search Bar - Top on mobile */}
            <div className="relative order-1 lg:order-2 w-full lg:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-section">search</span>
              <input 
                type="text"
                placeholder="Find student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full lg:w-48"
              />
            </div>

            {/* Print Buttons - Bottom of search on mobile */}
            <div className="flex items-center gap-3 order-2 lg:order-1 w-full lg:w-auto">
              {userRole === 'teacher' && selectedSubject && (
                <button 
                  onClick={() => handlePrint(null, { type: 'subject-class', subjectName: selectedSubject })} 
                  className="btn-primary flex-1 lg:flex-none py-2 px-6 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-section">print</span>
                  Print Full Class Results
                </button>
              )}
              {userRole !== 'teacher' && (
                <button 
                  onClick={() => handlePrint(null, { type: 'class-list' })} 
                  className="btn-secondary flex-1 lg:flex-none py-2 border-primary/20 text-primary flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-section">print</span>
                  Print Class Results
                </button>
              )}
            </div>
          </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-4 py-4 text-center">Before Mid</th>
                    <th className="px-4 py-4 text-center">Midterm</th>
                    <th className="px-4 py-4 text-center">After Mid</th>
                    <th className="px-4 py-4 text-center">Final</th>
                    <th className="px-4 py-4 text-center">Avg Score</th>
                    <th className="px-6 py-4 text-center">Outcome</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentResults.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-20 text-center">
                        <EmptyState icon="person_search" message="No results found" description="Adjust your search or wait for data publication." />
                      </td>
                    </tr>
                  ) : (
                    studentResults.map((res) => (
                      <tr key={res.id} className="table-row-hover group">
                        <td className="px-6 py-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-label font-bold ${
                            res.rank === 1 ? 'bg-amber-100 text-amber-700' : 
                            res.rank === 2 ? 'bg-slate-100 text-slate-700' :
                            res.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-on-surface-variant'
                          }`}>
                            #{res.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-label text-on-surface font-bold whitespace-nowrap">{res.name}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase">ID: {res.systemId || res.id}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-bold ${res.examAverages["Before Midterm"] === 'Not entered yet' ? 'text-slate-400 italic' : 'text-on-surface'}`}>
                            {res.examAverages["Before Midterm"]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-bold ${res.examAverages["Midterm"] === 'Not entered yet' ? 'text-slate-400 italic' : 'text-on-surface'}`}>
                            {res.examAverages["Midterm"]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-bold ${res.examAverages["After Midterm"] === 'Not entered yet' ? 'text-slate-400 italic' : 'text-on-surface'}`}>
                            {res.examAverages["After Midterm"]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-bold ${res.examAverages["Final"] === 'Not entered yet' ? 'text-slate-400 italic' : 'text-on-surface font-black'}`}>
                            {res.examAverages["Final"]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-label text-primary font-bold">{res.displayAverage}%</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            res.status === 'Pass' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' 
                            : res.status === 'Fail'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                            : 'bg-slate-100 text-slate-500/80 dark:bg-slate-800'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {userRole !== 'teacher' && (
                               <button 
                                 onClick={() => handlePrint(res.id, { type: 'report-card' })}
                                 className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                 title="Quick Print Report Card"
                               >
                                 <span className="material-symbols-outlined text-section">print</span>
                               </button>
                             )}
                            <button onClick={() => handleSelectStudent(res.id)} className="btn-secondary py-1.5 px-4">Full Details</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'history' || viewMode === 'detail') {
      const sId = viewingStudentId || currentUser?.id;
      const student = students.find(s => String(s.id) === String(sId));
      
      return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {userRole !== 'student' && (
                  <button onClick={goBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                )}
                <h1 className="text-display text-on-surface font-bold">{userRole === 'student' ? 'My Academic Journey' : student?.name}</h1>
              </div>
              <p className="text-label text-on-surface-variant">Official academic transcript and historical examination data.</p>
            </div>
            
            {userRole !== 'teacher' && (
              <button 
                onClick={() => handlePrint(sId, { type: 'transcript' })}
                className="btn-primary"
              >
                <span className="material-symbols-outlined text-section">print_connect</span>
                Print Full Transcript
              </button>
            )}
          </div>

          {/* History Sections */}
          {studentAcademicHistory.length === 0 ? (
            <EmptyState icon="grading" message="No Published Results" description="Results for your enrolled subjects have not been released yet." />
          ) : (
            studentAcademicHistory.map((classRecord) => (
              <div key={classRecord.classId} className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-section">history_edu</span>
                    </div>
                    <div>
                      <h2 className="text-section text-on-surface font-bold uppercase tracking-wider">{classRecord.className}</h2>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                        {String(classRecord.classId) === String(currentUser?.classId) ? 'Current Session' : 'Archived Record'}
                      </p>
                    </div>
                  </div>
                  {/* Removed individual subject print buttons per user request */}
                </div>

                {/* Performance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard title="Yearly Average" value={`${classRecord.totalAverage}%`} icon="analytics" iconColorClass="bg-blue-50 text-primary" />
                  <StatCard title="Total Points" value={classRecord.totalScore} icon="functions" iconColorClass="bg-indigo-50 text-indigo-600" />
                  <StatCard title="Class Rank" value={`#${classRecord.rank}`} icon="military_tech" iconColorClass="bg-amber-50 text-amber-600" />
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      classRecord.status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 
                      classRecord.status === 'Fail' ? 'bg-rose-50 text-rose-600' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Verdict</p>
                      <p className={`text-label font-bold uppercase ${
                        classRecord.status === 'Pass' ? 'text-emerald-600' : 
                        classRecord.status === 'Fail' ? 'text-rose-600' : 
                        'text-slate-500'
                      }`}>{classRecord.status}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${classRecord.promotion === 'Promoted' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status</p>
                      <p className="text-label font-bold uppercase">{classRecord.promotion}</p>
                    </div>
                  </div>
                </div>

                {/* Result Breakdown Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/50 text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
                          <th className="px-6 py-4">Subject Name</th>
                          <th className="px-4 py-4 text-center">Before Mid</th>
                          <th className="px-4 py-4 text-center">Midterm</th>
                          <th className="px-4 py-4 text-center">After Mid</th>
                          <th className="px-4 py-4 text-center">Final</th>
                          <th className="px-6 py-4 text-right bg-slate-100/50 dark:bg-slate-800/50">Weighted Avg</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.keys(classRecord.results).map((subject, sIdx) => (
                          <tr key={sIdx} className="hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-label text-on-surface font-bold">{subject}</p>
                            </td>
                            <td className="px-4 py-4 text-center text-on-surface-variant text-label">{classRecord.results[subject]["Before Midterm"]}</td>
                            <td className="px-4 py-4 text-center text-on-surface-variant text-label">{classRecord.results[subject]["Midterm"]}</td>
                            <td className="px-4 py-4 text-center text-on-surface-variant text-label">{classRecord.results[subject]["After Midterm"]}</td>
                            <td className="px-4 py-4 text-center text-on-surface font-bold text-label">{classRecord.results[subject]["Final"]}</td>
                            <td className="px-6 py-4 text-right bg-slate-100/30 dark:bg-slate-800/10">
                              <span className="text-label text-primary font-bold">{classRecord.results[subject].average}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exam Slip Print Center - ENHANCED UI */}
                {userRole !== 'teacher' && (
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 mt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">print</span>
                      </div>
                      <div>
                        <h3 className="text-label font-black text-on-surface uppercase tracking-tight">Exam Slip Print Center</h3>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Select an individual exam type to generate a printable slip</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["Before Midterm", "Midterm", "After Midterm", "Final"].map(type => (
                        <button 
                          key={type}
                          onClick={() => handlePrint(sId, { type: 'exam-slip', examType: type, classId: classRecord.classId })}
                          className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center mb-2 transition-colors">
                            <span className="material-symbols-outlined text-section">description</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors text-center">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <PageLayout role={userRole} title={t('results')}>
      {renderContent()}

      {/* 4. PRINTABLE COMPONENTS (ONLY VISIBLE ON PRINT) */}
      
      {/* 1. Class-wise summary table (Admin/Teacher) */}
      {selectedClassId && printConfig.type === 'class-list' && (
        <PrintableClassResults 
          className={currentClass?.name} 
          results={studentResults} 
          schoolSettings={schoolSettings} 
        />
      )}
      
      {/* 2. Full Academic Transcript (All years) */}
      {printConfig.type === 'transcript' && (
        <PrintableFullTranscript 
          student={students.find(s => String(s.id) === String(viewingStudentId || currentUser?.id))}
          history={studentAcademicHistory}
          schoolSettings={schoolSettings}
        />
      )}

      {/* 3. Annual Report Card (Specific Year) */}
      {printConfig.type === 'report-card' && (
        <PrintableReportCard 
          studentId={viewingStudentId || currentUser?.id}
          classHistory={studentAcademicHistory}
          classId={printConfig.classId}
          schoolSettings={schoolSettings}
        />
      )}

      {/* 5. Subject Results Slip (Class-wide) */}
      {printConfig.type === 'subject-class' && (
        <PrintableSubjectClassResults 
          className={currentClass?.name}
          subjectName={printConfig.subjectName}
          results={studentResults}
          schoolSettings={schoolSettings}
        />
      )}

      {/* 6. Subject Results Slip (Individual Student) */}
      {printConfig.type === 'subject-student' && (
        <PrintableSubjectStudentResults 
          student={students.find(s => String(s.id) === String(viewingStudentId || currentUser?.id))}
          classRecord={studentAcademicHistory.find(h => String(h.classId) === String(printConfig.classId))}
          subjectName={printConfig.subjectName}
          schoolSettings={schoolSettings}
        />
      )}

      {/* 7. Individual Exam Slip */}
      {printConfig.type === 'exam-slip' && (
        <PrintableExamSlip 
          student={students.find(s => String(s.id) === String(viewingStudentId || currentUser?.id))}
          classRecord={studentAcademicHistory.find(h => String(h.classId) === String(printConfig.classId))}
          examType={printConfig.examType}
          schoolSettings={schoolSettings}
        />
      )}
    </PageLayout>
  );
};

// --- PRINTABLE COMPONENTS ---

const PrintableHeader = ({ schoolSettings, title }) => {
  const { name: schoolName, logo, phone, email, address } = schoolSettings || {};
  return (
    <div className="print-header flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-display">school</span>
          </div>
        )}
        <div>
          <h1 className="text-display text-slate-900">{schoolName}</h1>
          <p className="text-label text-slate-500/80 uppercase tracking-widest font-bold">{title}</p>
        </div>
      </div>
      <div className="text-right text-label leading-relaxed text-slate-600">
        <p>{address}</p>
        <p>Phone: {phone}</p>
        <p>Email: {email}</p>
      </div>
    </div>
  );
};

const PrintableFooter = ({ signatureTitle }) => (
  <div className="mt-auto pt-12 text-center">
    <div className="signature-area w-64 mx-auto border-t-2 border-slate-900 pt-2 mb-4">
      <p className="text-[10px] font-black uppercase tracking-widest">{signatureTitle || "Manager's Signature"}</p>
    </div>
    <p className="text-[9px] text-slate-400 italic">Official School Seal Required. This document remains valid for administrative purposes in the absence of a physical seal.</p>
  </div>
);

const PrintableClassResults = ({ className, results, schoolSettings }) => {
  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Academic Performance Division" />
      <h2 className="text-section border-l-4 border-blue-600 pl-4 mb-8">Class Results Summary Table: {className}</h2>

      <table className="w-full border-collapse mb-12">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-800">
            <th className="p-3 text-left text-[10px] uppercase font-bold">Rank</th>
            <th className="p-3 text-left text-[10px] uppercase font-bold">Student Name</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">B.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">A.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">Final</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">Average</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {results.map(res => (
            <tr key={res.id}>
              <td className="p-3 font-bold">#{res.rank}</td>
              <td className="p-3 font-bold">{res.name}</td>
              <td className="p-3 text-center text-xs">{res.examAverages["Before Midterm"]}</td>
              <td className="p-3 text-center text-xs">{res.examAverages["Midterm"]}</td>
              <td className="p-3 text-center text-xs">{res.examAverages["After Midterm"]}</td>
              <td className="p-3 text-center text-xs">{res.examAverages["Final"]}</td>
              <td className="p-3 text-center font-bold text-blue-600">{res.displayAverage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <PrintableFooter signatureTitle="Manager's Signature" />
    </div>
  );
};

const PrintableReportCard = ({ studentId, classHistory, classId, schoolSettings }) => {
  const record = classId 
    ? classHistory.find(h => String(h.classId) === String(classId))
    : classHistory[0];

  if (!record) return null;
  const student = record.student;

  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Annual Progress Report" />
      
      <div className="mb-8 p-4 bg-slate-50 border-y border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Student Name</p>
          <p className="text-section font-black">{student?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Class / Session</p>
          <p className="text-section font-black">{record.className} (2026)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Yearly Average</p>
          <p className="text-xl font-black text-blue-600">{record.totalAverage}%</p>
        </div>
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rank</p>
          <p className="text-xl font-black text-slate-900">#{record.rank}</p>
        </div>
      </div>

      <h3 className="text-label uppercase font-bold tracking-widest mb-4 border-b pb-2">Subject Performance Matrix</h3>
      <table className="w-full border-collapse mb-12">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-800">
            <th className="p-3 text-left text-[10px] uppercase font-bold">Subject</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">B.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">A.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-bold">Final</th>
            <th className="p-3 text-right text-[10px] uppercase font-bold">W.Avg</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Object.keys(record.results).map((subject, idx) => (
            <tr key={idx}>
              <td className="p-3 font-bold">{subject}</td>
              <td className="p-3 text-center text-xs">{record.results[subject]["Before Midterm"]}</td>
              <td className="p-3 text-center text-xs">{record.results[subject]["Midterm"]}</td>
              <td className="p-3 text-center text-xs">{record.results[subject]["After Midterm"]}</td>
              <td className="p-3 text-center text-xs">{record.results[subject]["Final"]}</td>
              <td className="p-3 text-right font-bold text-blue-600">{record.results[subject].average}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <PrintableFooter signatureTitle="Manager's Signature" />
    </div>
  );
};

const PrintableExamSlip = ({ student, classRecord, examType, schoolSettings }) => {
  if (!classRecord) return null;
  const results = Object.values(classRecord.results).map(r => r[examType]).filter(v => typeof v === 'number');
  const avg = results.length > 0 ? (results.reduce((a, b) => a + b, 0) / results.length).toFixed(1) : 'N/A';

  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Individual Examination Performance Slip" />
      
      <div className="flex justify-between items-stretch mb-8 border border-slate-900 overflow-hidden rounded-xl">
        <div className="bg-slate-900 text-white p-6 flex flex-col justify-center min-w-[200px]">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Assessment Cycle</p>
          <h2 className="text-display font-black leading-none">{examType}</h2>
          <p className="text-[10px] mt-4 text-slate-400 font-bold uppercase tracking-[0.2em]">Session 2025/2026</p>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center bg-slate-50">
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-[8px] uppercase font-bold text-slate-500">Student Name</p>
              <p className="text-label font-black">{student?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-slate-500">Student ID</p>
              <p className="text-label font-black">{student?.systemId || student?.id}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-slate-500">Class / Grade</p>
              <p className="text-label font-black">{classRecord.className}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-slate-500">Print Date</p>
              <p className="text-label font-black">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-slate-900 pb-1">Subject Performance Matrix</h3>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-slate-100 border-y border-slate-900">
            <th className="p-2 text-left text-[10px] uppercase font-black">Subject Identification</th>
            <th className="p-2 text-center text-[10px] uppercase font-black">Marks Obtained</th>
            <th className="p-2 text-center text-[10px] uppercase font-black">Status</th>
            <th className="p-2 text-right text-[10px] uppercase font-black">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Object.keys(classRecord.results).map((subject, idx) => {
            const grade = classRecord.results[subject][examType];
            const isNumeric = typeof grade === 'number';
            return (
              <tr key={idx} className="border-b border-slate-100">
                <td className="p-2">
                  <p className="text-xs font-black">{subject}</p>
                </td>
                <td className="p-2 text-center">
                  <span className="text-label font-bold font-mono">{grade}</span>
                </td>
                <td className="p-2 text-center">
                  {isNumeric ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${grade >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {grade >= 50 ? 'PASS' : 'FAIL'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic">N/A</span>
                  )}
                </td>
                <td className="p-2 text-right text-[10px] text-slate-500 font-bold italic">
                  {isNumeric ? (grade >= 80 ? 'Excellent' : grade >= 60 ? 'Good' : grade >= 50 ? 'Satisfactory' : 'Needs Work') : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-center mb-8">
        <div className="w-48 p-4 bg-slate-900 text-white rounded-xl text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Exam Average</p>
          <p className="text-[28px] font-black leading-none">{avg}%</p>
        </div>
      </div>

      <PrintableFooter signatureTitle="Manager's Signature" />
    </div>
  );
};

const PrintableFullTranscript = ({ student, history, schoolSettings }) => {
  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Official Academic Transcript" />
      
      <div className="mb-12 flex justify-between border-b-4 border-slate-900 pb-6">
        <div>
          <h2 className="text-display font-black">{student?.name}</h2>
          <p className="text-label text-slate-500 uppercase tracking-widest font-bold">Cumulative Student Record</p>
        </div>
        <div className="text-right text-label uppercase font-bold text-slate-500">
          <p>Student ID: {student?.systemId || student?.id}</p>
        </div>
      </div>

      <div className="space-y-12">
        {history.map((record) => (
          <div key={record.classId} className="avoid-break">
            <h3 className="text-section font-black uppercase mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-xs">Y</span>
              {record.className} Performance
            </h3>
            
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300">
                  <th className="p-2 text-left text-[10px] uppercase">Subject</th>
                  <th className="p-2 text-center text-[10px] uppercase">B.Mid</th>
                  <th className="p-2 text-center text-[10px] uppercase">Mid</th>
                  <th className="p-2 text-center text-[10px] uppercase">A.Mid</th>
                  <th className="p-2 text-center text-[10px] uppercase">Final</th>
                  <th className="p-2 text-right text-[10px] uppercase font-bold">Year Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(record.results).map((subject, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-xs font-bold">{subject}</td>
                    <td className="p-2 text-center text-xs">{record.results[subject]["Before Midterm"]}</td>
                    <td className="p-2 text-center text-xs">{record.results[subject]["Midterm"]}</td>
                    <td className="p-2 text-center text-xs">{record.results[subject]["After Midterm"]}</td>
                    <td className="p-2 text-center text-xs">{record.results[subject]["Final"]}</td>
                    <td className="p-2 text-right text-xs font-bold">{record.results[subject].average}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-[8px] uppercase font-bold text-slate-400">Yearly Average</p>
                <p className="text-label font-black text-blue-700">{record.totalAverage}%</p>
              </div>
              <div>
                <p className="text-[8px] uppercase font-bold text-slate-400">Class Rank</p>
                <p className="text-label font-black">#{record.rank}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase font-bold text-slate-400">Total Points</p>
                <p className="text-label font-black">{record.totalScore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PrintableFooter signatureTitle="Manager's Signature" />
    </div>
  );
};

const PrintableSubjectClassResults = ({ className, subjectName, results, schoolSettings }) => {
  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Subject Performance Analysis" />
      <div className="mb-8 border-b-4 border-slate-900 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-display font-black">{subjectName}</h2>
          <p className="text-label text-slate-500 uppercase tracking-widest font-bold">Class: {className}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Academic Year</p>
          <p className="text-section font-black">2025 / 2026</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-12">
        <thead>
          <tr className="bg-slate-100 border-y border-slate-900">
            <th className="p-3 text-left text-[10px] uppercase font-black">Student Name</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">B.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">A.Mid</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">Final</th>
            <th className="p-3 text-right text-[10px] uppercase font-black">Subject Avg</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {results.map(res => {
            const subjData = res.results[subjectName];
            if (!subjData) return null;
            return (
              <tr key={res.id}>
                <td className="p-3 font-bold">{res.name}</td>
                <td className="p-3 text-center text-xs">{subjData["Before Midterm"]}</td>
                <td className="p-3 text-center text-xs">{subjData["Midterm"]}</td>
                <td className="p-3 text-center text-xs">{subjData["After Midterm"]}</td>
                <td className="p-3 text-center text-xs">{subjData["Final"]}</td>
                <td className="p-3 text-right font-bold text-blue-600">{subjData.average}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <PrintableFooter signatureTitle="Subject Teacher's Signature" />
    </div>
  );
};

const PrintableSubjectStudentResults = ({ student, classRecord, subjectName, schoolSettings }) => {
  if (!classRecord || !classRecord.results[subjectName]) return null;
  const subjData = classRecord.results[subjectName];

  return (
    <div className="print-only font-sans text-slate-900 bg-white">
      <PrintableHeader schoolSettings={schoolSettings} title="Individual Subject Performance" />
      
      <div className="mb-12 flex justify-between border-b-4 border-slate-900 pb-6">
        <div>
          <h2 className="text-display font-black">{student?.name}</h2>
          <p className="text-label text-slate-500 uppercase tracking-widest font-bold">Subject: {subjectName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Class Section</p>
          <p className="text-section font-black">{classRecord.className}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-12">
        {[
          { label: 'B.Midterm', val: subjData["Before Midterm"] },
          { label: 'Midterm', val: subjData["Midterm"] },
          { label: 'A.Midterm', val: subjData["After Midterm"] },
          { label: 'Final', val: subjData["Final"] },
          { label: 'Total Avg', val: subjData.average + '%', highlight: true }
        ].map((item, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${item.highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'} text-center shadow-sm`}>
            <p className={`text-[10px] uppercase font-bold mb-2 ${item.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
            <p className="text-2xl font-black">{item.val || '-'}</p>
          </div>
        ))}
      </div>

      <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-3xl mb-12">
        <h3 className="text-label font-black uppercase tracking-widest text-blue-700 mb-2">Teacher Assessment</h3>
        <p className="text-label text-slate-600 leading-relaxed italic">
          "The student has shown {parseFloat(subjData.average) >= 80 ? 'exceptional' : parseFloat(subjData.average) >= 50 ? 'consistent' : 'room for improvement'} performance in {subjectName} during this academic cycle. Continued focus on core concepts is recommended."
        </p>
      </div>

      <PrintableFooter signatureTitle="Manager's Signature" />
    </div>
  );
};

export default ResultsPage;
