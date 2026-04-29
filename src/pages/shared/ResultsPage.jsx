import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

const ResultsPage = ({ role }) => {
 const { 
 students, classes, currentUser,
 getReportCardData, calculateRankings 
 } = useData();
 const { t } = useSettings();
 
 // --- STATE ---
 const userRole = role || currentUser?.role || 'admin';
 const [viewMode, setViewMode] = useState(userRole === 'student' ? 'detail' : 'grid'); // 'grid', 'list', 'detail'
 const [selectedClassId, setSelectedClassId] = useState(null);
 const [viewingStudentId, setViewingStudentId] = useState(userRole === 'student' ? currentUser?.id : null);
 const [searchTerm, setSearchTerm] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 // --- DERIVED DATA ---
 const availableClasses = useMemo(() => {
 if (userRole === 'admin') return classes;
 if (userRole === 'teacher') {
 const assignedIds = currentUser?.assignedClasses || [];
 return classes.filter(c => assignedIds.includes(c.id));
 }
 return classes.filter(c => c.id === currentUser?.classId);
 }, [classes, userRole, currentUser]);

 // Effect to handle student automatic view
 useEffect(() => {
 if (userRole === 'student') {
 setViewMode('detail');
 setViewingStudentId(currentUser?.id);
 }
 }, [userRole, currentUser]);

 // Handle class selection
 const handleSelectClass = (classId) => {
 setIsLoading(true);
 setTimeout(() => {
 setSelectedClassId(classId);
 setViewMode('list');
 setIsLoading(false);
 }, 400);
 };

 // Handle student selection
 const handleSelectStudent = (studentId) => {
 setIsLoading(true);
 setTimeout(() => {
 setViewingStudentId(studentId);
 setViewMode('detail');
 setIsLoading(false);
 }, 400);
 };

 // Back navigation
 const goBack = () => {
 if (viewMode === 'detail' && userRole !== 'student') {
 setViewMode('list');
 } else if (viewMode === 'list') {
 setViewMode('grid');
 }
 };

 // Get data for the current class list
 const classStudents = useMemo(() => {
 if (!selectedClassId) return [];
 return students.filter(s => s.classId === parseInt(selectedClassId))
 .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
 }, [students, selectedClassId, searchTerm]);

 const studentResults = useMemo(() => {
 if (!selectedClassId) return [];
 const rankings = calculateRankings(selectedClassId);
 
 return classStudents.map(student => {
 const reportData = getReportCardData(student.id);
 const studentRank = rankings.find(r => r.studentId === student.id);
 
 return {
 ...student,
 displayAverage: studentRank ? parseFloat(studentRank.averageScore.toFixed(1)) : 0,
 displayTotal: studentRank ? parseFloat(studentRank.totalScore.toFixed(1)) : 0,
 rank: studentRank?.rank || '-',
 status: (studentRank?.averageScore || 0) >= 50 ? 'Pass' : 'Fail'
 };
 }).sort((a, b) => {
 if (a.rank === '-') return 1;
 if (b.rank === '-') return -1;
 return a.rank - b.rank;
 });
 }, [classStudents, selectedClassId, getReportCardData, calculateRankings]);

 // KPIs for Class
 const classKpis = useMemo(() => {
 if (studentResults.length === 0) return { avg: 0, passRate: 0 };
 const averages = studentResults.map(r => r.displayAverage);
 return {
 avg: (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1),
 passRate: ((studentResults.filter(r => r.status === 'Pass').length / studentResults.length) * 100).toFixed(0)
 };
 }, [studentResults]);

 // --- ACTIONS ---
 const handlePrintStudent = (id) => {
 window.open(`/print-report/${id}`, '_blank');
 };

 const handlePrintClass = () => {
 if (selectedClassId) {
 window.open(`/print-class-full-results/${selectedClassId}`, '_blank');
 }
 };

 // --- RENDERING ---

 if (isLoading) {
 return (
 <PageLayout role={userRole} title={t('results')}>
 <div className="flex flex-col items-center justify-center min-h-[400px]">
 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
 <p className="mt-4 text-slate-500 animate-pulse">Loading Results...</p>
 </div>
 </PageLayout>
 );
 }

 // 1. CLASS GRID VIEW
 if (viewMode === 'grid') {
 return (
 <PageLayout role={userRole} title={t('results')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-stat-value text-slate-900 dark:text-white">{t('results')}</h2>
 <p className="text-body-sm text-slate-500 mt-1">Select a class to view academic performance and rankings.</p>
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
 <span className="material-symbols-outlined text-stat-value">school</span>
 </div>
 <h3 className="text-headline-sm text-slate-900 dark:text-white mb-1">{c.name}</h3>
 <p className="text-body-sm text-slate-500 mb-6">{c.studentsCount || 0} Students registered</p>
 
 <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
 <div>
 <p className="text-body-sm text-slate-400 uppercase">Avg Score</p>
 <p className="text-body-sm text-primary">{avg}%</p>
 </div>
 <span className="text-body-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
 View Results
 <span className="material-symbols-outlined text-headline-sm">arrow_forward</span>
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 
 {availableClasses.length === 0 && (
 <EmptyState icon="class" message="No Classes Assigned" description="You don't have any classes assigned to view results." />
 )}
 </div>
 </PageLayout>
 );
 }

 // 2. STUDENT LIST VIEW (CLASS VIEW)
 if (viewMode === 'list') {
 const currentClass = classes.find(c => c.id === parseInt(selectedClassId));

 return (
 <PageLayout role={userRole} title={`${currentClass?.name} Results`}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Breadcrumbs & Actions */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <div className="flex items-center gap-2 overflow-hidden">
 <button 
 onClick={goBack}
 className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
 >
 <span className="material-symbols-outlined">arrow_back</span>
 </button>
 <div className="flex items-center text-body-sm truncate">
 <span className="text-slate-400 cursor-pointer hover:text-primary" onClick={goBack}>Results</span>
 <span className="material-symbols-outlined text-slate-300 text-headline-sm mx-1">chevron_right</span>
 <span className="text-slate-900 dark:text-white truncate">{currentClass?.name}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-headline-sm">search</span>
 <input 
 type="text"
 placeholder="Search students..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-body-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48"
 />
 </div>
 <button 
 onClick={handlePrintClass}
 className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-body-sm uppercase flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
 >
 <span className="material-symbols-outlined text-headline-sm">print</span>
 Print Class Results
 </button>
 </div>
 </div>

 {/* Class Summary Header */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-primary/20">
 <h1 className="text-stat-value mb-1">{currentClass?.name}</h1>
 <p className="text-white/70 text-body-sm uppercase">Academic Overview</p>
 </div>
 <StatCard title="Total Students" value={studentResults.length} icon="groups" iconColorClass="bg-blue-50 text-primary" />
 <StatCard title="Class Average" value={`${classKpis.avg}%`} icon="analytics" iconColorClass="bg-emerald-50 text-emerald-600" />
 </div>

 {/* Student Table */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden table-container">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr>
 <th>Rank</th>
 <th>Student Name</th>
 <th className="text-center">Total Score</th>
 <th className="text-center">Average</th>
 <th className="text-center">Status</th>
 <th className="text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {studentResults.length === 0 ? (
 <tr>
 <td colSpan="6" className="py-20 text-center">
 <EmptyState icon="person_search" message="No results available for this class" description="Grades might not have been published yet for any subjects in this class." />
 </td>
 </tr>
 ) : (
 studentResults.map((res, i) => (
 <tr key={res.id} className="table-row-hover group">
 <td className="px-6 py-4">
 <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm  ${
 res.rank === 1 ? 'bg-amber-100 text-amber-700' : 
 res.rank === 2 ? 'bg-slate-100 text-slate-700' :
 res.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
 }`}>
 #{res.rank}
 </span>
 </td>
 <td className="px-6 py-4">
 <p className="text-body-sm text-slate-800 dark:text-slate-200">{res.name}</p>
 <p className="text-body-sm text-slate-400 uppercase">ID: {res.id}</p>
 </td>
 <td className="px-6 py-4 text-center text-body-sm text-slate-700 dark:text-slate-300">
 {res.displayTotal}
 </td>
 <td className="px-6 py-4 text-center">
 <span className="text-body-sm text-primary">{res.displayAverage}%</span>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={`px-3 py-1 rounded-full text-body-sm  uppercase  ${
 res.status === 'Pass' 
 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
 : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
 }`}>
 {res.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => handleSelectStudent(res.id)}
 className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-button hover:bg-primary hover:text-white transition-all shadow-sm group-hover:shadow-primary/20"
 >
 View
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </PageLayout>
 );
 }

 // 3. STUDENT DETAIL VIEW
 if (viewMode === 'detail') {
 const student = students.find(s => s.id === viewingStudentId);
 const report = getReportCardData(viewingStudentId);
 const currentClass = classes.find(c => c.id === student?.classId);
 
 return (
 <PageLayout role={userRole} title={userRole === 'student' ? 'My Results' : `${student?.name} Results`}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
 
 {/* Breadcrumbs & Actions */}
 {userRole !== 'student' && (
 <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <div className="flex items-center gap-2">
 <button 
 onClick={goBack}
 className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
 >
 <span className="material-symbols-outlined">arrow_back</span>
 </button>
 <div className="flex items-center text-body-sm">
 <span className="text-slate-400 cursor-pointer hover:text-primary" onClick={() => setViewMode('grid')}>Results</span>
 <span className="material-symbols-outlined text-slate-300 text-headline-sm mx-1">chevron_right</span>
 <span className="text-slate-400 cursor-pointer hover:text-primary" onClick={goBack}>{currentClass?.name}</span>
 <span className="material-symbols-outlined text-slate-300 text-headline-sm mx-1">chevron_right</span>
 <span className="text-slate-900 dark:text-white truncate max-w-[150px]">{student?.name}</span>
 </div>
 </div>
 <button 
 onClick={() => handlePrintStudent(viewingStudentId)}
 className="px-6 py-2 bg-primary text-white rounded-xl text-body-sm uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-primary/20"
 >
 <span className="material-symbols-outlined text-headline-sm">print</span>
 Print Student Result
 </button>
 </div>
 )}

 {userRole === 'student' && (
 <div className="flex justify-between items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <div>
 <h2 className="text-stat-value text-slate-900 dark:text-white">My Academic Record</h2>
 <p className="text-body-sm text-slate-500 mt-1">Official breakdown of your performance for the current year.</p>
 </div>
 <button 
 onClick={() => handlePrintStudent(currentUser.id)}
 className="px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-body-sm uppercase flex items-center gap-2 hover:bg-slate-800 transition-all"
 >
 <span className="material-symbols-outlined text-headline-sm">print</span>
 Print My Record
 </button>
 </div>
 )}

 {/* Student Banner */}
 <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
 <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
 <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-display-bold border border-white/20 shadow-inner backdrop-blur-sm">
 {student?.name?.charAt(0)}
 </div>
 <div>
 <h1 className="text-stat-value mb-3">{student?.name}</h1>
 <div className="flex flex-wrap gap-6 text-white/60 text-body-sm uppercase">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-stat-value">school</span>
 Class: {currentClass?.name}
 </div>
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-indigo-400 text-stat-value">fingerprint</span>
 Student ID: {student?.id}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Grades Table */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
 <h3 className="text-slate-900 dark:text-white uppercase text-body-sm">Academic Subject Breakdown</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50 dark:bg-slate-800/50 text-body-sm text-slate-400 uppercase">
 <th className="px-6 py-5">Subject</th>
 <th className="px-4 py-5 text-center">Before Mid</th>
 <th className="px-4 py-5 text-center">Midterm</th>
 <th className="px-4 py-5 text-center">After Mid</th>
 <th className="px-4 py-5 text-center">Final</th>
 <th className="px-6 py-5 text-right bg-slate-100/50 dark:bg-slate-800">Total Avg</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {Object.keys(report.results).length === 0 ? (
 <tr>
 <td colSpan="6" className="py-20 text-center text-slate-400 italic">No grades published for this student yet.</td>
 </tr>
 ) : (
 Object.keys(report.results).map((subject, idx) => (
 <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
 <td className="px-6 py-5 text-body-sm text-slate-700 dark:text-slate-300">{subject}</td>
 <td className="px-4 py-5 text-center text-body-sm text-slate-600 dark:text-slate-400">{report.results[subject]["Before Midterm"]}</td>
 <td className="px-4 py-5 text-center text-body-sm text-slate-600 dark:text-slate-400">{report.results[subject]["Midterm"]}</td>
 <td className="px-4 py-5 text-center text-body-sm text-slate-600 dark:text-slate-400">{report.results[subject]["After Midterm"]}</td>
 <td className="px-4 py-5 text-center text-body-sm text-slate-600 dark:text-slate-400">{report.results[subject]["Final"]}</td>
 <td className="px-6 py-5 text-right text-body-sm text-primary bg-slate-50/30 dark:bg-slate-800/20">{report.results[subject].average}%</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Summary Section */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
 <p className="text-body-sm text-slate-400 uppercase mb-2">Total Score</p>
 <p className="text-stat-value text-slate-900 dark:text-white">
 {Object.values(report.results).reduce((a, b) => a + parseFloat(b.average), 0).toFixed(1)}
 </p>
 </div>
 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
 <p className="text-body-sm text-slate-400 uppercase mb-2">Average %</p>
 <p className="text-stat-value text-primary">
 {(Object.values(report.results).reduce((a, b) => a + parseFloat(b.average), 0) / Object.keys(report.results).length || 0).toFixed(1)}%
 </p>
 </div>
 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
 <p className="text-body-sm text-slate-400 uppercase mb-2">Class Rank</p>
 <p className="text-stat-value text-amber-500">#{report.rank}</p>
 </div>
 <div className={`p-6 rounded-2xl border text-center shadow-lg transition-all ${
 report.promotion === 'Promoted' ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' : 
 report.promotion === 'Conditional' ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/20' : 
 report.promotion === 'Failed' ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20' :
 'bg-slate-900 border-slate-800 text-slate-400'
 }`}>
 <p className="text-body-sm text-white/60 uppercase mb-2">Promotion Status</p>
 <p className="text-headline-sm">{report.promotion}</p>
 </div>
 </div>
 </div>
 </PageLayout>
 );
 }

 return null;
};

export default ResultsPage;
