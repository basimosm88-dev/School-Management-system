import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useData } from '../../contexts/DataContext';

const Header = () => {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, currentUser, logout } = useAppContext();
  const { language, setLanguage, t } = useSettings();
  const { notifications, markNotificationRead, students, teachers, classes, subjects } = useData();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = currentUser?.role || 'admin';
  const filteredNotifications = notifications.filter(n => {
    return n.recipientId === 'all' || 
           n.recipientId === currentUser?.id || 
           n.recipientId === role || 
           (currentUser?.classId && n.recipientId === `class_${currentUser.classId}`);
  });
  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate(role === 'admin' ? '/admin/login' : '/login');
  };

  const handleSearchClick = (path) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    window.location.href = path;
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];
    const role = currentUser?.role || window.location.pathname.split('/')[1] || 'admin';

    if (role === 'admin') {
      students.filter(s => s.name?.toLowerCase().includes(q)).slice(0, 3).forEach(s => results.push({ type: 'Student', text: s.name, path: `/admin/students` }));
      teachers.filter(t => t.name?.toLowerCase().includes(q)).slice(0, 3).forEach(t => results.push({ type: 'Teacher', text: t.name, path: `/admin/teachers` }));
      classes.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 3).forEach(c => results.push({ type: 'Class', text: c.name, path: `/admin/classes` }));
      subjects.filter(s => s.name?.toLowerCase().includes(q)).slice(0, 3).forEach(s => results.push({ type: 'Subject', text: s.name, path: `/admin/subjects` }));
    } else if (role === 'teacher') {
      students.filter(s => s.name?.toLowerCase().includes(q)).slice(0, 3).forEach(s => results.push({ type: 'Student', text: s.name, path: `/teacher/students` }));
      classes.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 3).forEach(c => results.push({ type: 'Class', text: c.name, path: `/teacher/classes` }));
    } else if (role === 'student') {
      subjects.filter(s => s.name?.toLowerCase().includes(q)).slice(0, 3).forEach(s => results.push({ type: 'Subject', text: s.name, path: `/student/profile` }));
    }
    return results;
  };

  const searchResults = getSearchResults();

  return (
    <>
      <header className={`fixed top-0 lg:top-4 right-0 lg:right-4 left-0 ${sidebarOpen ? 'lg:left-[312px]' : 'lg:left-[120px]'} h-16 bg-white dark:bg-slate-900 flex justify-between items-center px-4 lg:px-6 z-40 lg:rounded-2xl border-b lg:border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-all duration-300`} id="header">
      <div className="flex items-center gap-2 lg:gap-8">
        {/* Hamburger Menu - Mobile only */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm w-48 lg:w-64 focus:ring-2 focus:ring-primary/10 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none dark:text-slate-200"
            placeholder={t('searchPlaceholder')}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(e.target.value.length > 0);
            }}
            onFocus={() => setShowSearchDropdown(searchQuery.length > 0)}
          />
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 w-64 lg:w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl overflow-hidden z-50">
              {searchResults.map((res, i) => (
                <button key={i} onClick={() => handleSearchClick(res.path)} className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {res.type === 'Student' ? 'person' : res.type === 'Teacher' ? 'badge' : res.type === 'Class' ? 'class' : 'menu_book'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{res.text}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{t(res.type.toLowerCase())}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        <div className="flex items-center gap-0.5 relative">
          {/* Language Dropdown */}
          <button onClick={() => setLangOpen(!langOpen)} className="p-1.5 lg:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className="w-8 h-8 lg:w-9 lg:h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">language</span>
            </div>
          </button>
          {langOpen && (
            <div className="absolute top-12 right-12 lg:right-16 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl overflow-hidden z-50">
              <button onClick={() => { setLanguage('en'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'en' ? 'font-bold text-primary' : ''}`}>English</button>
              <button onClick={() => { setLanguage('ar'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'ar' ? 'font-bold text-primary' : ''}`}>العربية</button>
              <button onClick={() => { setLanguage('so'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'so' ? 'font-bold text-primary' : ''}`}>Somali</button>
            </div>
          )}

          {/* Notifications Dropdown */}
          <button onClick={() => setNotifOpen(!notifOpen)} className="p-1.5 lg:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative" id="notification-button">
            <div className="w-8 h-8 lg:w-9 lg:h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 lg:w-5 lg:h-5 bg-rose-500 text-white text-[9px] lg:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-12 right-0 w-72 md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl z-50 flex flex-col max-h-[400px] md:max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-t-2xl">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} {t('new')}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                    <p className="text-xs italic">{t('noNotificationsYet')}</p>
                  </div>
                ) : (
                  filteredNotifications.slice().reverse().slice(0, 8).map(n => (
                    <div key={n.id} onClick={() => { markNotificationRead(n.id); setNotifOpen(false); navigate(n.actionLink || `/${role}/notifications`); }} className={`p-3 mb-1 rounded-xl cursor-pointer transition-all border ${n.read ? 'border-transparent opacity-60 hover:bg-slate-100 dark:hover:bg-slate-800/50' : 'bg-blue-50/40 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                            n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                              'bg-blue-50 text-primary'
                           }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : 'info'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.title || t('systemUpdate')}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(n.timestamp).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-b-2xl shrink-0">
                <Link 
                  to={`/${role}/notifications`} 
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  {t('viewAllNotifications')}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}

          <button onClick={toggleDarkMode} className="p-1.5 lg:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className={`w-8 h-8 lg:w-9 lg:h-9 border ${darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-700'} rounded-lg flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </div>
          </button>
        </div>
        <div className="h-6 lg:h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <div className="relative ml-1 lg:ml-2">
          <button 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
            className="flex items-center gap-2 lg:gap-3 focus:outline-none group p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            id="profile-dropdown-button"
          >
            <div className="hidden md:flex flex-col text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight max-w-[120px]">{currentUser?.name || t('user')}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">{t(role)}</p>
            </div>
            <img
              alt="User profile avatar"
              className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-slate-100 dark:border-slate-700 object-cover transition-transform group-hover:scale-105"
              src={currentUser?.avatar_url || currentUser?.photo || currentUser?.details?.photo || "https://lh3.googleusercontent.com/aida-public/AB6AXuD8tWnO0wzkfevdY1uHYDDDPCCW21qH9FnRZwOp2n8PRTPfPvC79VVAMzq9YQc60jssVlpoWljbQQIm7AYDnpShdOfOOAeR3wmSiCXTk_VkV5swLXnBICJa54A2ZMnTWyHrPyxVwD5hHwo9AQx0YGwRVodtqoIdMyF4zRlHlV7XyyO87uEr4t1b5lVRoHi7VWnoMHbNHD25KcCFKQMqkAN4ey9Ih_tlhHncX1jiplCZT7NQNuqxuKyZ4vvdV0keDCQYasLdTICPuRw"}
            />
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 transition-colors">
              keyboard_arrow_down
            </span>
          </button>

          {profileDropdownOpen && (
            <div className="absolute top-12 right-0 w-56 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">

              
              <Link 
                to={`/${role}/settings`}
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all font-semibold text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                {t('settings')}
              </Link>
              
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setShowLogoutModal(true);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all font-semibold text-xs text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {showLogoutModal && (
      <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <span className="material-symbols-outlined text-[40px]">logout</span>
            </div>
            <h3 className="text-2xl font-black text-on-surface dark:text-on-surface mb-2 tracking-tight">{t('signOut')}</h3>
            <p className="text-sm font-bold text-on-surface-variant dark:text-on-surface-variant mb-8 leading-relaxed">{t('logoutConfirm')}</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-outline dark:border-outline font-bold text-on-surface-variant dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

export default Header;
