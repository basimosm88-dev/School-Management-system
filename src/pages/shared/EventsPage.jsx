import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';
import EmptyState from '../../components/ui/EmptyState';

const EventsPage = ({ role }) => {
  const { events, addEvent, deleteEvent, classes } = useData();
  const { currentUser } = useAppContext();
  const { t, permissions, language } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

 // Dynamic Calendar Logic
 const today = new Date();
 const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = today.toLocaleString(language, { month: 'long' });

  const filteredEvents = events.filter(event => {
    if (role === 'admin') return true;
    if (event.audience === 'all') return true;
    if (role === 'teacher' && event.audience === 'teachers') return true;
    if (role === 'student' && event.audience === 'students') return true;
    if (event.audience === `class_${currentUser?.classId}`) return true;
    return event.createdBy === `${role}_${currentUser?.id}`;
  });

  const eventFields = [
    { name: 'title', label: t('eventTitle'), placeholder: t('annualSportsDay') },
    { name: 'date', label: t('date'), type: 'date' },
    { name: 'start_time', label: t('startTime'), type: 'time' },
    { name: 'end_time', label: t('endTime'), type: 'time' },
    { name: 'location', label: t('location'), placeholder: t('mainHall') },
    { name: 'audience', label: t('audience'), type: 'select', options: [
      { value: 'all', label: t('all') },
      { value: 'teachers', label: t('teachersOnly') },
      { value: 'students', label: t('studentsOnly') },
      ...classes.map(c => ({ value: `class_${c.id}`, label: `${t('class')}: ${c.name}` }))
    ]},
    { name: 'description', label: t('description'), type: 'textarea', placeholder: t('details') }
  ];

  const handleSave = () => {
    if (formData.title && formData.date) {
      addEvent({
        ...formData,
        createdBy: `${role}_${currentUser.id}`
      });
      setModalOpen(false);
      setFormData({});
    }
  };

  return (
    <PageLayout role={role} title={t('events')}>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-heading text-slate-900 dark:text-white">{t('events')}</h2>
          <p className="text-label text-slate-500/80 mt-1">{t('eventsSubtitle')}</p>
        </div>
        {(role === 'admin' || (role === 'teacher' && permissions.teachers.createEvents)) && (
          <button 
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <span className="btn-icon">add</span>
            {t('createEvent')}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {/* Calendar Sidebar - Top on Mobile */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm lg:sticky lg:top-24 transition-all">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-headline text-slate-900 dark:text-white">{t('calendar')}</h2>
              <div className="bg-primary/5 dark:bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-label font-bold border border-primary/10">
                {monthName} {currentYear}
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-4 shrink-0">
              {['S','M','T','W','T','F','S'].map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square flex items-center justify-center"></div>
              ))}
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = (events || []).some(e => e.date === dateStr);
                const isToday = day === today.getDate();
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-all relative
                      ${isToday 
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 z-10' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {day}
                    {hasEvent && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`}></span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('legend')}</h4>
              <div className="flex items-center gap-3 text-label text-slate-600 dark:text-slate-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>{t('generalEvent')}</span>
              </div>
              <div className="flex items-center gap-3 text-label text-slate-600 dark:text-slate-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{t('teacherMeeting')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event List - Below Calendar on Mobile */}
        <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-100 dark:border-slate-800">
              <EmptyState icon="event_busy" message={t('noEvents')} description={t('noEventsDescription')} />
            </div>
          ) : (
            filteredEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).map(event => (
              <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group-hover:bg-primary group-hover:border-primary transition-all">
                    <span className="text-label text-slate-400/80 dark:text-slate-500/80 group-hover:text-white/70">
                      {event.date ? new Date(event.date).toLocaleString(language, { month: 'short' }) : t('none')}
                    </span>
                    <span className="text-display text-slate-900 dark:text-white group-hover:text-white">
                      {event.date ? new Date(event.date).getDate() : '-'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-section text-slate-900 dark:text-white mb-1">{event.title}</h3>
                        <div className="flex items-center gap-4 text-label text-slate-500/80 dark:text-slate-400/80">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-section">schedule</span>
                            {event.start_time} - {event.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-section">location_on</span>
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-label  ${
                          event.audience === 'all' ? 'bg-blue-50 text-primary border border-blue-100' :
                          event.audience === 'teachers' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {event.audience === 'all' || !event.audience ? t('all') : event.audience === 'teachers' ? t('teachers') : event.audience === 'students' ? t('students') : event.audience.replace('class_', `${t('class')} `)}
                        </span>
                        {role === 'admin' && (
                          <button onClick={() => deleteEvent(event.id)} className="p-2 text-slate-400/80 hover:text-rose-500 transition-colors">
                            <span className="material-symbols-outlined text-section">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-label text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setFormData({}); }} title={t('createNewEvent')} onSave={handleSave}>
  <DynamicForm fields={eventFields} onChange={setFormData} initialData={formData} />
  </Modal>
 </PageLayout>
 );
};

export default EventsPage;

