import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const navItems = {
 admin: [
 { name: 'dashboard', icon: 'dashboard', path: '/admin' },
 { name: 'students', icon: 'person', path: '/admin/students' },
 { name: 'teachers', icon: 'supervisor_account', path: '/admin/teachers' },
 { name: 'classes', icon: 'class', path: '/admin/classes' },
 { name: 'subjects', icon: 'auto_stories', path: '/admin/subjects' },
 { name: 'attendance', icon: 'event_available', path: '/admin/attendance' },
 { name: 'timetable', icon: 'calendar_view_day', path: '/admin/timetable' },
 { name: 'exams', icon: 'quiz', path: '/admin/exams' },
 { name: 'results', icon: 'bar_chart', path: '/admin/results' },
 { name: 'events', icon: 'event', path: '/admin/events' },
 { name: 'announcements', icon: 'campaign', path: '/admin/announcements' },
 ],
 teacher: [
 { name: 'dashboard', icon: 'dashboard', path: '/teacher' },
 { name: 'myClasses', icon: 'class', path: '/teacher/classes' },
 { name: 'students', icon: 'person', path: '/teacher/students' },
 { name: 'attendance', icon: 'event_available', path: '/teacher/attendance' },
 { name: 'grades', icon: 'grade', path: '/teacher/grades' },
 { name: 'exams', icon: 'quiz', path: '/teacher/exams' },
 { name: 'results', icon: 'bar_chart', path: '/teacher/results' },
 { name: 'events', icon: 'event', path: '/teacher/events' },
 { name: 'announcements', icon: 'campaign', path: '/teacher/announcements' },
 { name: 'timetable', icon: 'calendar_view_day', path: '/teacher/timetable' },
 ],
 student: [
 { name: 'dashboard', icon: 'dashboard', path: '/student' },
 { name: 'myProfile', icon: 'person', path: '/student/profile' },
 { name: 'attendance', icon: 'event_available', path: '/student/attendance' },
 { name: 'grades', icon: 'grade', path: '/student/grades' },
 { name: 'timetable', icon: 'calendar_view_day', path: '/student/timetable' },
 { name: 'exams', icon: 'quiz', path: '/student/exams' },
 { name: 'results', icon: 'bar_chart', path: '/student/results' },
 { name: 'events', icon: 'event', path: '/student/events' },
 { name: 'announcements', icon: 'campaign', path: '/student/announcements' },
 ]
};

const Sidebar = ({ role = 'admin' }) => {
 const { sidebarOpen, toggleSidebar, logout } = useAppContext();
 const { schoolSettings, permissions, t } = useSettings();
 const navigate = useNavigate();
 const [showLogoutModal, setShowLogoutModal] = useState(false);

 const filteredItems = navItems[role]?.filter(item => {
 if (role === 'admin') return true;

 const roleKey = role === 'teacher' ? 'teachers' : 'students';
 const rolePerms = permissions?.[roleKey] || {};

 // Logic: Only hide if the permission is explicitly set to false
 if (item.path.includes('announcements') && rolePerms.viewAnnouncements === false) return false;
 if (item.path.includes('events') && rolePerms.viewEvents === false) return false;
 if (item.path.includes('messages') && rolePerms.sendMessage === false) return false;
 if (item.path.includes('grades') && rolePerms.viewGrades === false) return false;
 if (item.path.includes('timetable') && rolePerms.viewTimetable === false) return false;

 return true;
 }) || [];

 const handleLogoutClick = () => {
 setShowLogoutModal(true);
 };

 const confirmLogout = () => {
 setShowLogoutModal(false);
 logout();
 navigate('/login');
 };

 return (
 <>
 {/* Mobile Overlay */}
 {sidebarOpen && (
 <div 
 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
 onClick={toggleSidebar}
 ></div>
 )}

 <aside 
 className={`fixed left-0 lg:left-4 top-0 lg:top-4 bottom-0 lg:bottom-4 ${sidebarOpen ? 'w-[280px] translate-x-0' : 'w-[88px] -translate-x-full lg:translate-x-0'} bg-white dark:bg-slate-900 flex flex-col py-6 px-4 gap-y-1 z-[60] text-sm font-medium lg:rounded-2xl shadow-xl lg:shadow-sm border-r lg:border border-slate-200/80 dark:border-slate-700/50 overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'sidebar-collapsed' : ''}`} 
 id="sidebar"
 >
 {/* Sidebar Header */}
 <div className={`sidebar-header flex ${sidebarOpen ? 'items-center justify-between' : 'flex-col items-center gap-4'} px-2 mb-6 transition-all`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 squircle shadow-sm overflow-hidden">
 {schoolSettings.logo ? (
 <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
 ) : (
 <span className="material-symbols-outlined text-white">school</span>
 )}
 </div>
 <div className={`sidebar-logo-text overflow-hidden ${!sidebarOpen ? 'hidden' : 'block'}`}>
 <h1 className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap tracking-tight">{schoolSettings.name}</h1>
 <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap font-semibold uppercase tracking-widest">School management</p>
 </div>
 </div>

 {/* Dedicated Toggle Button - Desktop */}
 <button 
 onClick={toggleSidebar}
 className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 text-slate-400 hover:text-primary transition-all group shadow-sm hover:shadow-md shrink-0"
 id="sidebar-toggle"
 title={sidebarOpen ? "Collapse" : "Expand"}
 >
 <span className={`material-symbols-outlined text-lg transition-all duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`}>
 chevron_left
 </span>
 </button>

 {/* Close Button - Mobile */}
 <button 
 onClick={toggleSidebar}
 className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-primary transition-all"
 >
 <span className="material-symbols-outlined text-2xl">close</span>
 </button>
 </div>

 <div className="mx-2 mb-6 border-b border-slate-100 dark:border-slate-800 transition-opacity duration-200 sidebar-divider"></div>

 {/* Navigation Items */}
 <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
 {filteredItems.map((item) => (
 <NavLink
 key={item.name}
 to={item.path}
 end={item.path === `/${role}`}
 onClick={() => {
 if (window.innerWidth < 1024) toggleSidebar();
 }}
 className={({ isActive }) =>
 `sidebar-item flex items-center gap-4 px-3 py-2 rounded-xl transition-all duration-200 group ${isActive
 ? 'bg-blue-50/80 dark:bg-primary/10 text-primary'
 : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
 }`
 }
 >
 {({ isActive }) => (
 <>
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/10' : 'border border-slate-100 dark:border-slate-700 group-hover:border-slate-200 dark:group-hover:border-slate-600'}`}>
 <span className={`material-symbols-outlined ${isActive ? 'text-primary' : ''}`}>{item.icon}</span>
 </div>
 <span className={`sidebar-text ${isActive ? 'font-semibold' : 'font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>{t(item.name)}</span>
 </>
 )}
 </NavLink>
 ))}
 </nav>

 {/* Footer Zone */}
 <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
 <NavLink 
 to={`/${role}/settings`} 
 onClick={() => {
 if (window.innerWidth < 1024) toggleSidebar();
 }}
 className="sidebar-item flex items-center gap-4 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group"
 >
 <div className="w-9 h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0 group-hover:border-slate-200 dark:group-hover:border-slate-600">
 <span className="material-symbols-outlined">settings</span>
 </div>
 <span className="sidebar-text font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200">{t('settings')}</span>
 </NavLink>
 <button
 onClick={handleLogoutClick}
 className="w-full sidebar-item flex items-center gap-4 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 rounded-xl transition-all group"
 >
 <div className="w-9 h-9 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined">logout</span>
 </div>
 <span className="sidebar-text font-medium">{t('logout')}</span>
 </button>
 </div>

 </aside>

 {showLogoutModal && (
 <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
 <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300">
 <div className="flex flex-col items-center text-center">
 <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
 <span className="material-symbols-outlined text-3xl">logout</span>
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Sign out</h3>
 <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Are you sure you want to logout? You will need to login again to access your account.</p>

 <div className="flex gap-3 w-full">
 <button
 onClick={() => setShowLogoutModal(false)}
 className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
 >
 {t('cancel')}
 </button>
 <button
 onClick={confirmLogout}
 className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-sm shadow-rose-600/20"
 >
 {t('confirm')}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </>
 );
};

export default Sidebar;
