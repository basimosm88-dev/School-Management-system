import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppContext } from '../../contexts/AppContext';

const PageLayout = ({ role, title, primaryActionText, onPrimaryAction, children }) => {
 const { sidebarOpen } = useAppContext();

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative selection:bg-primary/20 transition-colors duration-200">
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
