import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useData } from '../../contexts/DataContext';

const Header = () => {
  const { sidebarOpen, darkMode, toggleDarkMode } = useAppContext();
  const { language, setLanguage, t } = useSettings();
  const { notifications, markNotificationRead } = useData();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`fixed top-4 right-4 ${sidebarOpen ? 'left-[312px]' : 'left-[120px]'} h-16 bg-white dark:bg-slate-900 flex justify-between items-center px-6 z-40 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm font-inter transition-all duration-300`} id="header">
      <div className="flex items-center gap-8">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/10 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none dark:text-slate-200"
            placeholder={t('search_placeholder')}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-0.5 relative">
          {/* Language Dropdown */}
          <button onClick={() => setLangOpen(!langOpen)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className="w-9 h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">language</span>
            </div>
          </button>
          {langOpen && (
            <div className="absolute top-12 right-16 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl overflow-hidden z-50">
              <button onClick={() => { setLanguage('en'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'en' ? 'font-bold text-primary' : ''}`}>English</button>
              <button onClick={() => { setLanguage('ar'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'ar' ? 'font-bold text-primary' : ''}`}>العربية</button>
              <button onClick={() => { setLanguage('so'); setLangOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 ${language === 'so' ? 'font-bold text-primary' : ''}`}>Somali</button>
            </div>
          )}

          {/* Notifications Dropdown */}
          <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors relative" id="notification-button">
            <div className="w-9 h-9 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl z-50 flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                    <p className="text-xs italic">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.slice().reverse().slice(0, 8).map(n => (
                    <div key={n.id} onClick={() => { markNotificationRead(n.id); setNotifOpen(false); }} className={`p-3 mb-1 rounded-xl cursor-pointer transition-all border ${n.read ? 'border-transparent opacity-60 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-blue-50/40 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                          n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 
                          'bg-blue-50 text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : 'info'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.title || 'System Update'}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 rounded-b-2xl">
                <button 
                  onClick={() => {
                    setNotifOpen(false);
                    // Determine route based on current path to stay in role context
                    const currentRole = window.location.pathname.split('/')[1];
                    window.location.href = `/${currentRole}/notifications`;
                  }}
                  className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  View All Notifications
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          <button onClick={toggleDarkMode} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className={`w-9 h-9 border ${darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-700'} rounded-lg flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[20px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </div>
          </button>
        </div>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <div className="ml-2">
          <img
            alt="User profile avatar"
            className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700 object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8tWnO0wzkfevdY1uHYDDDPCCW21qH9FnRZwOp2n8PRTPfPvC79VVAMzq9YQc60jssVlpoWljbQQIm7AYDnpShdOfOOAeR3wmSiCXTk_VkV5swLXnBICJa54A2ZMnTWyHrPyxVwD5hHwo9AQx0YGwRVodtqoIdMyF4zRlHlV7XyyO87uEr4t1b5lVRoHi7VWnoMHbNHD25KcCFKQMqkAN4ey9Ih_tlhHncX1jiplCZT7NQNuqxuKyZ4vvdV0keDCQYasLdTICPuRw"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
