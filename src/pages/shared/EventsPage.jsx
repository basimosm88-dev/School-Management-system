import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';

const EventsPage = ({ role }) => {
  const { events, addEvent, deleteEvent, classes } = useData();
  const { currentUser } = useAppContext();
  const { permissions } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const filteredEvents = events.filter(event => {
    if (role === 'admin') return true;
    if (event.audience === 'all') return true;
    if (role === 'teacher' && event.audience === 'teachers') return true;
    if (role === 'student' && event.audience === 'students') return true;
    if (event.audience === `class_${currentUser?.classId}`) return true;
    return event.createdBy === `${role}_${currentUser?.id}`;
  });

  const eventFields = [
    { name: 'title', label: 'Event Title', placeholder: 'Annual Sports Day' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'start_time', label: 'Start Time', type: 'time' },
    { name: 'end_time', label: 'End Time', type: 'time' },
    { name: 'location', label: 'Location', placeholder: 'Main Hall' },
    { name: 'audience', label: 'Audience', type: 'select', options: [
      { value: 'all', label: 'All' },
      { value: 'teachers', label: 'Teachers Only' },
      { value: 'students', label: 'Students Only' },
      ...classes.map(c => ({ value: `class_${c.id}`, label: `Class: ${c.name}` }))
    ]},
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details...' }
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
    <PageLayout role={role} title="Events & Calendar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">School Events</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Stay updated with school activities and schedules.</p>
        </div>
        {(role === 'admin' || (role === 'teacher' && permissions.teachers.createEvents)) && (
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Event List */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">event_busy</span>
              <p className="text-slate-500">No events found for your account.</p>
            </div>
          ) : (
            filteredEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).map(event => (
              <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group-hover:bg-primary group-hover:border-primary transition-all">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-white/70 uppercase">
                      {event.date ? new Date(event.date).toLocaleString('default', { month: 'short' }) : 'N/A'}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-white">
                      {event.date ? new Date(event.date).getDate() : '-'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{event.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {event.start_time} - {event.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                           event.audience === 'all' ? 'bg-blue-50 text-primary border border-blue-100' :
                           event.audience === 'teachers' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                           'bg-emerald-50 text-emerald-600 border border-emerald-100'
                         }`}>
                           {(event.audience || 'all').replace('_', ' ')}
                         </span>
                         {role === 'admin' && (
                           <button onClick={() => deleteEvent(event.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                         )}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calendar Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Monthly Overview
            </h3>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['S','M','T','W','T','F','S'].map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 31}).map((_, i) => {
                const day = i + 1;
                const hasEvent = (events || []).some(e => e.date && new Date(e.date).getDate() === day);
                return (
                  <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium cursor-pointer transition-all
                    ${day === new Date().getDate() ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    ${hasEvent ? 'ring-2 ring-primary/20 ring-offset-1 dark:ring-offset-slate-900' : ''}
                  `}>
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 space-y-4">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legend</h4>
               <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                 <span className="w-2 h-2 rounded-full bg-primary"></span>
                 <span>General Event</span>
               </div>
               <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                 <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                 <span>Teacher Meeting</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Event" onSave={handleSave}>
        <DynamicForm fields={eventFields} onChange={setFormData} />
      </Modal>
    </PageLayout>
  );
};

export default EventsPage;
