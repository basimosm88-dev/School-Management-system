import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const navItems = {
  admin: [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { name: 'Students', icon: 'person', path: '/admin/students' },
    { name: 'Teachers', icon: 'supervisor_account', path: '/admin/teachers' },
    { name: 'Classes', icon: 'class', path: '/admin/classes' },
    { name: 'Subjects', icon: 'auto_stories', path: '/admin/subjects' },
    { name: 'Attendance', icon: 'event_available', path: '/admin/attendance' },
    { name: 'Timetable', icon: 'calendar_view_day', path: '/admin/timetable' },
    { name: 'Exams', icon: 'quiz', path: '/admin/exams' },
    { name: 'Events', icon: 'event', path: '/admin/events' },
    { name: 'Announcements', icon: 'campaign', path: '/admin/announcements' },
    { name: 'Messages', icon: 'mail', path: '/admin/messages' },
  ],
  teacher: [
    { name: 'Dashboard', icon: 'dashboard', path: '/teacher' },
    { name: 'My Classes', icon: 'class', path: '/teacher/classes' },
    { name: 'Students', icon: 'person', path: '/teacher/students' },
    { name: 'Attendance', icon: 'event_available', path: '/teacher/attendance' },
    { name: 'Grades', icon: 'grade', path: '/teacher/grades' },
    { name: 'Exams', icon: 'quiz', path: '/teacher/exams' },
    { name: 'Events', icon: 'event', path: '/teacher/events' },
    { name: 'Announcements', icon: 'campaign', path: '/teacher/announcements' },
    { name: 'Timetable', icon: 'calendar_view_day', path: '/teacher/timetable' },
    { name: 'Messages', icon: 'mail', path: '/teacher/messages' },
  ],
  student: [
    { name: 'Dashboard', icon: 'dashboard', path: '/student' },
    { name: 'Profile', icon: 'person', path: '/student/profile' },
    { name: 'Attendance', icon: 'event_available', path: '/student/attendance' },
    { name: 'Grades', icon: 'grade', path: '/student/grades' },
    { name: 'Timetable', icon: 'calendar_view_day', path: '/student/timetable' },
    { name: 'Exams', icon: 'quiz', path: '/student/exams' },
    { name: 'Events', icon: 'event', path: '/student/events' },
    { name: 'Announcements', icon: 'campaign', path: '/student/announcements' },
    { name: 'Messages', icon: 'mail', path: '/student/messages' },
  ]
};

const Sidebar = ({ role = 'admin' }) => {
  const { sidebarOpen, toggleSidebar, logout } = useAppContext();
  const { schoolSettings, permissions } = useSettings();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-4 top-4 bottom-4 ${sidebarOpen ? 'w-[280px]' : 'w-[88px]'} bg-white dark:bg-slate-900 flex flex-col py-6 px-4 gap-y-1 z-50 font-inter text-sm font-medium rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/50 overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'sidebar-collapsed' : ''}`} id="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header flex items-center justify-between px-2 mb-10 transition-all cursor-pointer" onClick={toggleSidebar}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 squircle shadow-sm overflow-hidden">
            {schoolSettings.logo ? (
              <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white">school</span>
            )}
          </div>
          <div className="sidebar-logo-text overflow-hidden">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{schoolSettings.name}</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap font-bold">School System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === `/${role}`}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-4 px-3 py-2 rounded-xl transition-all duration-200 group ${
                isActive
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
                <span className={`sidebar-text ${isActive ? 'font-semibold' : 'font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Footer Zone */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <NavLink to={`/${role}/settings`} className="sidebar-item flex items-center gap-4 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group">
          <div className="w-9 h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0 group-hover:border-slate-200 dark:group-hover:border-slate-600">
            <span className="material-symbols-outlined">settings</span>
          </div>
          <span className="sidebar-text font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200">Settings</span>
        </NavLink>
        <button 
          onClick={handleLogout}
          className="w-full sidebar-item flex items-center gap-4 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">logout</span>
          </div>
          <span className="sidebar-text font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
