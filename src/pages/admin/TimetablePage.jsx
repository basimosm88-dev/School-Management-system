import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const AdminTimetablePage = () => {
 const { classes, subjects, teachers, timetables, addTimetableSlot, deleteTimetableSlot, confirmDelete } = useData();
 const { t } = useSettings();

 const [selectedClassId, setSelectedClassId] = useState(classes.length > 0 ? classes[0].id.toString() : '');
 const [activePeriod, setActivePeriod] = useState('morning');
 const [showModal, setShowModal] = useState(false);
 const [error, setError] = useState('');

 // Set default class on load if not already set
 useEffect(() => {
 if (classes.length > 0 && !selectedClassId) {
 setSelectedClassId(classes[0].id.toString());
 }
 }, [classes, selectedClassId]);

 // Form State
 const [formData, setFormData] = useState({
 day: 'Sunday',
 startTime: '08:00',
 endTime: '08:40',
 isBreak: false,
 subjectName: '',
 teacherId: ''
 });

 const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
 const morningHours = [7, 8, 9, 10, 11, 12];
 const afternoonHours = [13, 14, 15, 16, 17];

 // 1. Get filtered class timetable
  const classTimetable = useMemo(() => {
    if (!selectedClassId) return [];
    return timetables.filter(t => String(t.classId) === String(selectedClassId))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetables, selectedClassId]);

  // 2. Get subjects and teachers for the selected class
  const classObj = classes.find(c => String(c.id) === String(selectedClassId));
  const classSubjects = classObj?.subjects || [];

 const handleStartTimeChange = (val) => {
 const [h, m] = val.split(':');
 const date = new Date();
 date.setHours(parseInt(h));
 date.setMinutes(parseInt(m) + 40);
 const endH = date.getHours().toString().padStart(2, '0');
 const endM = date.getMinutes().toString().padStart(2, '0');
 setFormData({ ...formData, startTime: val, endTime: `${endH}:${endM}` });
 };

  const handleAddSlot = () => {
    try {
      setError('');
      if (!selectedClassId) throw new Error(t('selectClassFirst'));
 
      const slotData = {
        ...formData,
        classId: selectedClassId,
        teacherId: formData.isBreak ? null : formData.teacherId
      };

 addTimetableSlot(slotData);
 setShowModal(false);
 // Reset form
 setFormData({
 day: 'Saturday',
 startTime: '08:00',
 endTime: '08:40',
 isBreak: false,
 subjectName: '',
 teacherId: ''
 });
 } catch (err) {
 setError(err.message);
 }
 };

 const handleTypeChange = (isBreak) => {
 setFormData({ ...formData, isBreak, subjectName: '', teacherId: '' });
 };

  const handleSubjectChange = (name) => {
    const classSub = classSubjects.find(s => s.name === name);
    if (classSub) {
      setFormData({ ...formData, subjectName: name, teacherId: classSub.teacherId.toString() });
    } else {
      setFormData({ ...formData, subjectName: name, teacherId: '' });
    }
  };

 const renderGridBlock = (title, hoursRange) => (
 <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
 <div className="flex items-center gap-4 mb-4">
 <h3 className="text-label text-slate-800 dark:text-slate-200">{title}</h3>
 <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
 </div>
 
 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden overflow-x-auto transition-colors">
 <div className="min-w-[900px]">
 {/* Header Row */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20">
          <div className="p-4"></div>
          {days.map(day => (
            <div key={day} className="p-4 text-center text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800 text-label">
              {t(day.toLowerCase())}
            </div>
          ))}
        </div>
 
 {/* Time Rows */}
 {hoursRange.map(hour => {
 const ampm = hour >= 12 ? 'PM' : 'AM';
 const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
 const timeLabel = `${displayHour}:00 ${ampm}`;
 
 return (
 <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 dark:border-slate-800 min-h-[130px]">
 {/* Time Label */}
 <div className="p-4 text-label text-slate-400/80 text-center pt-8">
 {timeLabel}
 </div>
 
 {/* Day Cells */}
 {days.map(day => {
 const sessions = classTimetable.filter(t => {
 const [h] = t.startTime.split(':');
 return parseInt(h) === hour && t.day === day;
 });
 
 return (
 <div key={`${day}-${hour}`} className="border-l border-slate-100 dark:border-slate-800 p-2 relative flex flex-col gap-2">
 {sessions.map(slot => {
 const colors = [
 'bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100 border-sky-100 dark:border-sky-800/50',
 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 border-amber-100 dark:border-amber-800/50',
 'bg-purple-50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100 border-purple-100 dark:border-purple-800/50',
 'bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:text-fuchsia-100 border-fuchsia-100 dark:border-fuchsia-800/50',
 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border-emerald-100 dark:border-emerald-800/50'
 ];
 let hash = 0;
 const str = slot.subjectName || 'Break';
 for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
 const colorClass = slot.isBreak 
 ? 'bg-slate-100 text-slate-500/80 dark:bg-slate-800/50 dark:text-slate-400/80 border-slate-100 dark:border-slate-700/50' 
 : colors[Math.abs(hash) % colors.length];
 
 const formatSlotTime = (time24) => {
 const [h, m] = time24.split(':');
 const hNum = parseInt(h);
 const suffix = hNum >= 12 ? 'PM' : 'AM';
 const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
 return `${h12}:${m} ${suffix}`;
 };
 
 const classNameDisplay = classObj?.name.split('-')[1]?.trim() || classObj?.name;
 
 return (
 <div key={slot.id} className={`w-full rounded-xl p-4 relative group transition-all border shadow-sm ${colorClass}`}>
 <button 
 onClick={async () => {
    const confirmed = await confirmDelete('deleteTimetableSlotConfirm');
    if (confirmed) {
      deleteTimetableSlot(slot.id);
    }
  }}
 className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg z-10"
 >
 <span className="material-symbols-outlined text-body">close</span>
 </button>
 
 <div className="text-label opacity-40 mb-2">
 {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
 </div>
 
                  {slot.isBreak ? (
                    <p className="text-label opacity-70">{t('breakSession')}</p>
                  ) : (
 <div className="text-label leading-relaxed">
 {classNameDisplay} - {slot.subjectName}
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
 })}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );

 return (
 <PageLayout role="admin" title={t('timetable')}>
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Page Header */}
 <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
 <h2 className="text-heading text-slate-900 dark:text-white">{t('timetable')}</h2>
 <p className="text-label text-slate-500/80 mt-1">{t('timetableSubtitle')}</p>
 </div>

  {/* CLASS SELECTION BUTTONS */}
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm transition-colors">
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-label text-slate-400/80 block">{t('chooseClassToManage')}</label>
        <button 
          disabled={!selectedClassId}
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <span className="btn-icon">add_circle</span>
          {t('addSession')}
        </button>
      </div>
 
 <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 custom-scrollbar">
 {classes.map(c => (
 <button
 key={c.id}
 onClick={() => setSelectedClassId(c.id.toString())}
 className={`px-6 py-3 rounded-xl text-label  transition-all border whitespace-nowrap ${
 selectedClassId === c.id.toString()
 ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
 : 'bg-white dark:bg-slate-800 text-slate-400/80 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
 }`}
 >
 {c.name}
 </button>
 ))}
 </div>
 </div>
 </div>

  {/* PERIOD TOGGLE */}
  {selectedClassId && (
    <div className="flex justify-center">
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-2 w-full max-w-md">
        <button
          onClick={() => setActivePeriod('morning')}
          className={`flex-1 py-3 rounded-lg text-label  transition-all flex items-center justify-center gap-2 ${
            activePeriod === 'morning' 
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
              : 'text-slate-400/80'
          }`}
        >
          <span className="material-symbols-outlined text-section">wb_sunny</span>
          {t('morningPeriod')}
        </button>
        <button
          onClick={() => setActivePeriod('afternoon')}
          className={`flex-1 py-3 rounded-lg text-label  transition-all flex items-center justify-center gap-2 ${
            activePeriod === 'afternoon' 
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
              : 'text-slate-400/80'
          }`}
        >
          <span className="material-symbols-outlined text-section">dark_mode</span>
          {t('afternoonPeriod')}
        </button>
      </div>
    </div>
  )}

  {/* WEEKLY GRID */}
  {!selectedClassId ? (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/50 h-[400px] flex flex-col items-center justify-center text-slate-300 transition-colors">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 opacity-40">
        <span className="material-symbols-outlined text-display">event_note</span>
      </div>
      <p className="text-label opacity-60">{t('chooseClassToManage')}</p>
    </div>
  ) : (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      {activePeriod === 'morning' ? (
        renderGridBlock(t('morningPeriodRange'), morningHours)
      ) : (
        renderGridBlock(t('afternoonPeriodRange'), afternoonHours)
      )}
    </div>
  )}

  {/* ADD MODAL */}
  {showModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-8 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-label text-slate-800 dark:text-slate-200">{t('newSessionSlot')}</h3>
          <button onClick={() => setShowModal(false)} className="text-slate-400/80 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-label rounded-2xl border border-rose-100 flex items-center gap-3 animate-shake">
              <span className="material-symbols-outlined text-section">error</span>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('selectDay')}</label>
              <select 
                value={formData.day}
                onChange={e => setFormData({...formData, day: e.target.value})}
                className="form-input-custom w-full"
              >
                {days.map(d => <option key={d} value={d}>{t(d.toLowerCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('type')}</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => handleTypeChange(false)}
                  className={`flex-1 py-2 rounded-lg text-label  transition-all ${!formData.isBreak ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
                >{t('subject')}</button>
                <button 
                  onClick={() => handleTypeChange(true)}
                  className={`flex-1 py-2 rounded-lg text-label  transition-all ${formData.isBreak ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400/80'}`}
                >{t('break')}</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('startTime')}</label>
              <input 
                type="time" 
                value={formData.startTime}
                onChange={e => handleStartTimeChange(e.target.value)}
                className="form-input-custom w-full"
              />
            </div>
            <div>
              <label className="text-label text-slate-400/80 mb-2 block">{t('endTime')}</label>
              <input 
                type="time" 
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                className="form-input-custom w-full"
              />
              <p className="text-label text-primary mt-1">{t('manualOverrideAllowed')}</p>
            </div>
          </div>

          {!formData.isBreak && (
            <>
              <div>
                <label className="text-label text-slate-400/80 mb-2 block">{t('subject')}</label>
                <select 
                  value={formData.subjectName}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="form-input-custom w-full"
                >
                  <option value="">{t('selectSubjectEllipsis')}</option>
                  {classSubjects.length > 0 && (
                    <optgroup label={t('classSubjects')}>
                      {classSubjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </optgroup>
                  )}
                  <optgroup label={t('otherSubjects')}>
                    {subjects
                      .filter(s => !classSubjects.some(cs => cs.name === s.name))
                      .map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    }
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-label text-slate-400/80 mb-2 block">{t('teacher')}</label>
                {classSubjects.some(s => s.name === formData.subjectName) ? (
                  <div className="form-input-custom w-full bg-slate-100 dark:bg-slate-800/50 flex items-center text-slate-600">
                    {formData.teacherId ? teachers.find(t => String(t.id) === String(formData.teacherId))?.name : t('autoFilledBasedOnSubject')}
                  </div>
                ) : (
                  <select 
                    value={formData.teacherId}
                    onChange={e => setFormData({...formData, teacherId: e.target.value})}
                    className="form-input-custom w-full"
                    required={!formData.isBreak}
                  >
                    <option value="">{t('selectTeacherEllipsis')}</option>
                    {teachers.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
                  </select>
                )}
                {!classSubjects.some(s => s.name === formData.subjectName) && formData.subjectName && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                    {t('subjectNotAssignedWarning')}
                  </p>
                )}
              </div>
            </>
          )}

          <button 
            onClick={handleAddSlot}
            className="w-full py-4 bg-primary text-white text-label rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            {t('createSession')}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
 </PageLayout>
 );
};

export default AdminTimetablePage;
