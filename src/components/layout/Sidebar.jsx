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
    { name: 'timetable', icon: 'calendar_view_day', path: '/student/timetable' },
    { name: 'results', icon: 'bar_chart', path: '/student/results' },
    { name: 'events', icon: 'event', path: '/student/events' },
    { name: 'announcements', icon: 'campaign', path: '/student/announcements' },
  ]
};

const Sidebar = ({ role = 'admin' }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const { schoolSettings, permissions, t } = useSettings();

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
            <div className="w-10 h-10 bg-transparent flex items-center justify-center shrink-0 overflow-hidden">
              {schoolSettings.logo ? (
                <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-primary text-[28px]">school</span>
              )}
            </div>
            <div className={`sidebar-logo-text overflow-hidden ${!sidebarOpen ? 'hidden' : 'block'}`}>
              <h1 className="text-[12px] font-bold text-on-surface whitespace-nowrap tracking-tight max-w-[110px] truncate leading-tight">{schoolSettings.name}</h1>
              <p className="text-[8px] text-on-surface-variant whitespace-nowrap font-bold uppercase tracking-[0.15em] mt-0.5">School Management</p>
            </div>
          </div>

          {/* Dedicated Toggle Button - Desktop */}
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 text-slate-400 hover:text-primary transition-all group shadow-sm hover:shadow-md shrink-0"
            id="sidebar-toggle"
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            <span className={`material-symbols-outlined text-[16px] transition-all duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`}>
              chevron_left
            </span>
          </button>

          {/* Close Button - Mobile */}
          <button 
            onClick={toggleSidebar}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
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
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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

      </aside>
    </>
  );
};

export default Sidebar;
