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
      const assignedIds = currentUser?.assignedClasses || [];
      return classes.filter(c => assignedIds.includes(c.id));
    }
    return classes.filter(c => String(c.id) === String(currentUser?.classId));
  }, [classes, userRole, currentUser]);

  const currentClass = classes.find(c => parseInt(c.id) === parseInt(selectedClassId));

  // Actions
  const handleSelectClass = (classId) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedClassId(classId);
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
      setViewMode('grid');
    } else if (viewMode === 'detail' && userRole === 'student') {
      setViewMode('history');
    }
  };

  // Student Academic History Calculation
  const studentAcademicHistory = useMemo(() => {
    const targetStudentId = viewingStudentId || currentUser?.id;
    if (!targetStudentId) return [];

    const sId = parseInt(targetStudentId);
    const student = students.find(s => parseInt(s.id) === sId);
    
    // Find all classes this student has published results in
    const studentExams = exams.filter(e => parseInt(e.studentId) === sId && e.status === 'PUBLISHED');
    let classIds = [...new Set(studentExams.map(e => e.classId))];
    
    // Ensure current class is visible even if no results published yet
    const currentCid = student?.classId || currentUser?.classId;
    if (currentCid && !classIds.some(id => parseInt(id) === parseInt(currentCid))) {
      classIds.push(parseInt(currentCid));
    }
    
    if (classIds.length === 0) return [];

    return classIds.map(cid => {
      const classObj = classes.find(c => parseInt(c.id) === parseInt(cid));
      const reportData = getReportCardData(sId, cid);
      
      const subjects = Object.keys(reportData.results);
      const totalAverage = subjects.length > 0 
        ? (subjects.reduce((acc, sub) => acc + (parseFloat(reportData.results[sub].average) || 0), 0) / subjects.length).toFixed(1)
        : "0.0";
      
      const totalScore = subjects.reduce((acc, sub) => acc + (parseFloat(reportData.results[sub].average) || 0), 0).toFixed(1);

      const examAverages = {};
      ["Before Midterm", "Midterm", "After Midterm", "Final"].forEach(type => {
        const scores = subjects.map(sub => reportData.results[sub][type]).filter(s => typeof s === 'number');
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
        student,
        className: classObj?.name || `Class ${cid}`,
        totalAverage,
        totalScore,
        subjectsCount: subjects.length,
        status,
        rank: calculateRankings(cid).find(r => parseInt(r.studentId) === sId)?.rank || '-',
        promotion: status === 'Pass' ? 'Promoted' : 'Held Back'
      };
    }).sort((a, b) => b.classId - a.classId);
  }, [viewingStudentId, currentUser, exams, classes, getReportCardData, students, calculateRankings]);

  // Admin/Teacher Student List Data
  const studentResults = useMemo(() => {
    if (!selectedClassId) return [];
    
    const cid = parseInt(selectedClassId);
    const classStudents = students.filter(s => parseInt(s.classId) === cid)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const rankings = calculateRankings(cid);
    
    return classStudents.map(student => {
      const reportData = getReportCardData(student.id, cid);
      const studentRank = rankings.find(r => parseInt(r.studentId) === parseInt(student.id));
      
      // Calculate averages for each exam type across all subjects
      const subjects = Object.keys(reportData.results);
      const examTypes = ["Before Midterm", "Midterm", "After Midterm", "Final"];
      const examAverages = {};
      
      examTypes.forEach(type => {
        const scores = subjects.map(sub => reportData.results[sub][type]).filter(s => typeof s === 'number');
        examAverages[type] = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) + '%' : "Not entered yet";
      });

      // Calculate Outcome based on Midterm and Final being entered
      let outcome = "Pending";
      const midtermEntered = examAverages["Midterm"] !== "Not entered yet";
      const finalEntered = examAverages["Final"] !== "Not entered yet";
      
      if (midtermEntered && finalEntered) {
        outcome = (studentRank?.averageScore || 0) >= 50 ? 'Pass' : 'Fail';
      }

      return {
        ...student,
        examAverages,
        displayAverage: studentRank ? parseFloat(studentRank.averageScore.toFixed(1)) : 0,
        displayTotal: studentRank ? parseFloat(studentRank.totalScore.toFixed(1)) : 0,
        rank: studentRank?.rank || '-',
        status: outcome
      };
    }).sort((a, b) => {
      if (a.rank === '-') return 1;
      if (b.rank === '-') return -1;
      return a.rank - b.rank;
    });
  }, [students, selectedClassId, searchTerm, getReportCardData, calculateRankings]);

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
                    <p className="text-label text-on-surface-variant mb-6">{c.studentsCount || 0} Students enrolled</p>
                    
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

    if (viewMode === 'list') {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <button onClick={goBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex items-center text-label truncate">
                <span className="text-on-surface-variant cursor-pointer hover:text-primary" onClick={goBack}>Classes</span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-section mx-1">chevron_right</span>
                <span className="text-on-surface truncate font-bold">{currentClass?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePrint(null, { type: 'class-list' })} 
                className="btn-secondary py-2 border-primary/20 text-primary flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-section">print</span>
                Print Class Results
              </button>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-section">search</span>
                <input 
                  type="text"
                  placeholder="Find student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-label outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48"
                />
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
                          <p className="text-[10px] text-on-surface-variant uppercase">ID: {res.id}</p>
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
                            <button 
                              onClick={() => handlePrint(res.id, { type: 'report-card' })}
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                              title="Quick Print Report Card"
                            >
                              <span className="material-symbols-outlined text-section">print</span>
                            </button>
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
      const student = students.find(s => parseInt(s.id) === parseInt(sId));
      
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
            
            <button 
              onClick={() => handlePrint(sId, { type: 'transcript' })}
              className="btn-primary"
            >
              <span className="material-symbols-outlined text-section">print_connect</span>
              Print Full Transcript
            </button>
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
                        {parseInt(classRecord.classId) === parseInt(currentUser?.classId) ? 'Current Session' : 'Archived Record'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePrint(sId, { type: 'report-card', classId: classRecord.classId })}
                    className="btn-secondary py-1.5 px-4 text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-section">print</span>
                    Print Year Results
                  </button>
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
          student={students.find(s => parseInt(s.id) === parseInt(viewingStudentId || currentUser?.id))}
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

      {/* 4. Single Exam Slip */}
      {printConfig.type === 'exam-slip' && (
        <PrintableExamSlip 
          student={students.find(s => parseInt(s.id) === parseInt(viewingStudentId || currentUser?.id))}
          classRecord={studentAcademicHistory.find(h => parseInt(h.classId) === parseInt(printConfig.classId))}
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
        <p className="text-slate-900 font-bold">{schoolName}</p>
        <p>{address}</p>
        <p>Phone: {phone}</p>
        <p>Email: {email}</p>
      </div>
    </div>
  );
};

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
            <th className="p-3 text-center text-[10px] uppercase font-bold">Outcome</th>
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
              <td className={`p-3 text-center font-bold uppercase text-[10px] ${res.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {res.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-footer mt-auto pt-12 flex justify-between">
        <div className="signature-area w-48 text-center border-t-2 border-slate-300 pt-2">
          <p className="text-[10px] font-bold">Principal Signature</p>
        </div>
        <div className="signature-area w-48 text-center border-t-2 border-slate-300 pt-2">
          <p className="text-[10px] font-bold">Class Teacher Signature</p>
        </div>
      </div>
    </div>
  );
};

const PrintableReportCard = ({ studentId, classHistory, classId, schoolSettings }) => {
  const record = classId 
    ? classHistory.find(h => parseInt(h.classId) === parseInt(classId))
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

      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Yearly Average</p>
          <p className="text-xl font-black text-blue-600">{record.totalAverage}%</p>
        </div>
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rank</p>
          <p className="text-xl font-black text-slate-900">#{record.rank}</p>
        </div>
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Decision</p>
          <p className={`text-xl font-black uppercase ${record.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {record.status}
          </p>
        </div>
        <div className="border border-slate-200 p-4 rounded-xl text-center bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Promotion</p>
          <p className="text-xl font-black text-indigo-600 uppercase">{record.promotion}</p>
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

      <div className="mt-auto grid grid-cols-2 gap-12 pt-12">
        <div className="signature-area border-t-2 border-slate-300 pt-2 text-center">
          <p className="text-[10px] font-bold">Controller of Examinations</p>
          <p className="text-[8px] text-slate-400">Official Seal Required</p>
        </div>
        <div className="signature-area border-t-2 border-slate-300 pt-2 text-center">
          <p className="text-[10px] font-bold">Principal / Headmaster</p>
          <p className="text-[8px] text-slate-400">Date: ____ / ____ / 2026</p>
        </div>
      </div>
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
              <p className="text-label font-black">{student?.id}</p>
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

      <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-1">Subject Performance Matrix</h3>
      <table className="w-full border-collapse mb-10">
        <thead>
          <tr className="bg-slate-100 border-y border-slate-900">
            <th className="p-3 text-left text-[10px] uppercase font-black">Subject Identification</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">Marks Obtained</th>
            <th className="p-3 text-center text-[10px] uppercase font-black">Status</th>
            <th className="p-3 text-right text-[10px] uppercase font-black">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Object.keys(classRecord.results).map((subject, idx) => {
            const grade = classRecord.results[subject][examType];
            const isNumeric = typeof grade === 'number';
            return (
              <tr key={idx} className="border-b border-slate-100">
                <td className="p-3">
                  <p className="text-xs font-black">{subject}</p>
                </td>
                <td className="p-3 text-center">
                  <span className="text-label font-bold font-mono">{grade}</span>
                </td>
                <td className="p-3 text-center">
                  {isNumeric ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${grade >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {grade >= 50 ? 'PASS' : 'FAIL'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic">N/A</span>
                  )}
                </td>
                <td className="p-3 text-right text-[10px] text-slate-500 font-bold italic">
                  {isNumeric ? (grade >= 80 ? 'Excellent' : grade >= 60 ? 'Good' : grade >= 50 ? 'Satisfactory' : 'Needs Work') : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="col-span-1 p-6 bg-slate-900 text-white rounded-xl text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Exam Average</p>
          <p className="text-[32px] font-black leading-none">{avg}%</p>
        </div>
        <div className="col-span-2 p-6 border-2 border-dashed border-slate-200 rounded-xl flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">security</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-900">Official Document Security Hash</p>
            <p className="font-mono text-[10px] text-slate-400 break-all leading-tight mt-1">
              SHA256-{Math.random().toString(36).substring(2, 15).toUpperCase()}{Math.random().toString(36).substring(2, 15).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 pt-12 border-t-2 border-slate-100">
        <div className="text-center">
          <div className="h-16 flex items-end justify-center mb-2">
             <div className="w-48 border-b border-slate-300"></div>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-900">Class Teacher Signature</p>
          <p className="text-[8px] text-slate-400 italic">Date: ____ / ____ / 2026</p>
        </div>
        <div className="text-center">
          <div className="h-16 flex items-end justify-center mb-2">
             <div className="w-48 border-b border-slate-300"></div>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-900">Controller of Examinations</p>
          <p className="text-[8px] text-slate-400 italic">Official Seal Required</p>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-slate-100 text-center">
        <p className="text-[8px] text-slate-400 uppercase font-bold tracking-[0.3em]">This is an electronically generated document. No handwritten signature required unless specified.</p>
      </div>
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
          <p>Student ID: {student?.id}</p>
          <p>Enrollment: {student?.enrollmentDate || 'N/A'}</p>
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
            
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
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
              <div>
                <p className="text-[8px] uppercase font-bold text-slate-400">Outcome</p>
                <p className={`text-label font-black ${record.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>{record.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 pt-10 border-t-2 border-slate-900 flex justify-between">
        <div className="text-center w-64">
          <p className="text-xs font-bold uppercase mb-8">Official Registrar Seal</p>
          <div className="w-32 h-32 border-2 border-slate-200 rounded-full mx-auto flex items-center justify-center">
            <span className="text-[10px] text-slate-300 font-bold">CERTIFIED</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase mb-1">Date of Issue</p>
          <p className="text-label font-mono">{new Date().toLocaleDateString()}</p>
          <div className="mt-12 w-64 border-t border-slate-900 pt-2 ml-auto">
            <p className="text-[10px] font-bold">Principal's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
