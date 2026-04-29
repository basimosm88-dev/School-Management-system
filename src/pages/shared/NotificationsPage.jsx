import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';

const NotificationsPage = ({ role }) => {
 const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
 const { currentUser } = useAppContext();
 const [filter, setFilter] = useState('all');

 const filteredNotifications = notifications.filter(n => {
 // Basic recipient filtering
 const isRecipient = n.recipientId === 'all' || n.recipientId === currentUser?.id || n.recipientId === role;
 if (!isRecipient) return false;

 if (filter === 'unread') return !n.read;
 if (filter === 'academic') return n.type === 'success' || n.type === 'warning';
 return true;
 }).reverse();

 const getTypeStyles = (type) => {
 switch (type) {
 case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
 case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
 case 'error': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
 default: return 'bg-blue-50 text-primary border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
 }
 };

 const getIcon = (type) => {
 switch (type) {
 case 'success': return 'check_circle';
 case 'warning': return 'warning';
 case 'error': return 'error';
 default: return 'info';
 }
 };

 return (
 <PageLayout role={role} title="Notifications Center">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h2 className="text-headline-sm text-slate-900 dark:text-white">Activity Notifications</h2>
 <p className="text-slate-500 dark:text-slate-400 text-body-sm">Stay updated with important school activities and personal alerts.</p>
 </div>
 <button 
 onClick={() => markAllNotificationsRead(currentUser?.id)}
 className="text-primary text-body-sm hover:underline flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-headline-sm">done_all</span>
 Mark all as read
 </button>
 </div>

 <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
 {['all', 'unread', 'academic', 'events'].map(f => (
 <button 
 key={f}
 onClick={() => setFilter(f)}
 className={`px-4 py-1.5 rounded-full text-body-sm  capitalize transition-all whitespace-nowrap border ${
 filter === f 
 ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
 : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/30'
 }`}
 >
 {f}
 </button>
 ))}
 </div>

 <div className="space-y-3">
 {filteredNotifications.length === 0 ? (
 <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800">
 <span className="material-symbols-outlined text-display-bold text-slate-200 mb-4">notifications_off</span>
 <p className="text-slate-500 italic">No notifications found in this category.</p>
 </div>
 ) : (
 filteredNotifications.map(n => (
 <div 
 key={n.id} 
 onClick={() => markNotificationRead(n.id)}
 className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${
 n.read 
 ? 'border-slate-100 dark:border-slate-800 opacity-60' 
 : 'border-blue-100 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-900/5 shadow-sm'
 } hover:border-primary/30 group`}
 >
 <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getTypeStyles(n.type)}`}>
 <span className="material-symbols-outlined text-stat-value">{getIcon(n.type)}</span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <h3 className={`text-body-sm  ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
 {n.title}
 </h3>
 <span className="text-body-sm text-slate-400">{new Date(n.timestamp).toLocaleString()}</span>
 </div>
 <p className="text-body-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
 {n.message}
 </p>
 {n.actionLink && (
 <button className="mt-3 text-body-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
 View Details
 <span className="material-symbols-outlined text-body-md">arrow_forward</span>
 </button>
 )}
 </div>
 {!n.read && (
 <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
 )}
 </div>
 ))
 )}
 </div>
 </PageLayout>
 );
};

export default NotificationsPage;
