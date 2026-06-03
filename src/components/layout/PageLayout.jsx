import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppContext } from '../../contexts/AppContext';

const PageLayout = ({ role, title, primaryActionText, onPrimaryAction, children }) => {
  const { sidebarOpen, currentUser, loading } = useAppContext();

  // If auth session is still loading, show a clean loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight animate-pulse">EduCore Pro</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-widest animate-pulse">Loading Layout...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page (admins to /admin/login, others to /login)
  if (!currentUser) {
    const loginPath = role === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  // If logged in but role does not match the page's required role, redirect to the correct home
  if (role && currentUser.role !== role) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative selection:bg-primary/20 transition-colors duration-200 screen-layout">
      <Sidebar role={role} />
      <Header />
      <main 
        className={`pt-20 lg:pt-24 px-4 pb-8 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[312px]' : 'lg:ml-[120px]'}`}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default PageLayout;
