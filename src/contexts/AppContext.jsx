import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [grades, setGrades] = useState(() => {
    const saved = localStorage.getItem('grades');
    return saved !== null ? JSON.parse(saved) : [
      { id: 1, subject: 'Mathematics', type: 'Midterm', grade: 'A', status: 'approved', releaseDate: new Date().toISOString() },
      { id: 2, subject: 'Physics', type: 'Quiz 1', grade: 'B+', status: 'approved', releaseDate: new Date().toISOString() },
      { id: 3, subject: 'Chemistry', type: 'Final', grade: 'A-', status: 'pending', releaseDate: null },
    ];
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('grades', JSON.stringify(grades));
  }, [grades]);

  const login = (user) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const submitGrade = (newGrade) => {
    setGrades(prev => [...prev, { ...newGrade, id: Date.now(), status: 'pending', releaseDate: null }]);
  };

  const approveGrade = (id, releaseDate) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, status: 'approved', releaseDate } : g));
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleDarkMode = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <AppContext.Provider value={{
      sidebarOpen,
      toggleSidebar,
      darkMode: theme === 'dark',
      toggleDarkMode,
      currentUser,
      login,
      logout,
      grades,
      submitGrade,
      approveGrade
    }}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContext = () => useContext(AppContext);
