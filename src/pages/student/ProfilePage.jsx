import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useData } from '../../contexts/DataContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';

const ProfilePage = () => {
  const { classes } = useData();
  const { currentUser } = useAppContext();
  const { t } = useSettings();

  if (!currentUser) return null;

  const studentClass = classes.find(c => c.id === currentUser.classId);

  return (
    <PageLayout role="student" title={t('myProfile')}>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-display text-primary border-2 border-white dark:border-slate-800 shadow-xl">
              {currentUser.name?.charAt(0)}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-display text-slate-900 dark:text-white mb-2">{currentUser.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-xl text-label uppercase tracking-wider">{t('student')}</span>
                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500/80 rounded-xl text-label uppercase tracking-wider">ID: {currentUser.systemId || currentUser.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileCard title={t('personalInformation')} icon="person">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoItem label={t('fullName')} value={currentUser.name} />
                <InfoItem label={t('gender')} value={currentUser.gender} />
                <InfoItem label={t('birthDate')} value={currentUser.birthDate} />
                <InfoItem label={t('birthPlace')} value={currentUser.birthPlace} />
                <InfoItem label={t('phoneNumber')} value={currentUser.phone} />
                <InfoItem label={t('motherFullName')} value={currentUser.motherName} />
              </div>
            </ProfileCard>

            <ProfileCard title={t('residentialAddress')} icon="location_on">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoItem label={t('country')} value={currentUser.address?.country} />
                <InfoItem label={t('state')} value={currentUser.address?.state} />
                <InfoItem label={t('cityVillage')} value={currentUser.address?.city} />
                <InfoItem label={t('neighborhood')} value={currentUser.address?.neighborhood} />
                <div className="md:col-span-2">
                  <InfoItem label={t('fullAddressDetails')} value={currentUser.address?.fullAddress} />
                </div>
              </div>
            </ProfileCard>

            <ProfileCard title={t('academicRegistration')} icon="history_edu">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoItem label={t('currentClass')} value={studentClass?.name || t('unassigned')} />
                <InfoItem label={t('registrationDate')} value={currentUser.registrationDate} />
                <InfoItem label={t('registrationType')} value={currentUser.registrationType} />
                <InfoItem label={t('parentStatus')} value={currentUser.parentStatus} />
              </div>
            </ProfileCard>
          </div>

          {/* Right Column - Responsible Person */}
          <div className="space-y-8">
            <ProfileCard title={t('responsiblePerson')} icon="contact_emergency">
              <div className="space-y-6">
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <InfoItem label={t('guardianName')} value={currentUser.responsiblePerson?.name} />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-primary">phone</span>
                    <InfoItem label={t('primaryPhone')} value={currentUser.responsiblePerson?.phone1} />
                  </div>
                  {currentUser.responsiblePerson?.phone2 && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-slate-400">phone_iphone</span>
                      <InfoItem label={t('secondaryPhone')} value={currentUser.responsiblePerson?.phone2} />
                    </div>
                  )}
                </div>
              </div>
            </ProfileCard>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <span className="material-symbols-outlined">info</span>
                <span className="text-label font-bold uppercase">{t('viewOnly')}</span>
              </div>
              <p className="text-label text-amber-800/70 dark:text-amber-200/70 leading-relaxed">
                {t('profileDisabledDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

const ProfileCard = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-section text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoItem = ({ label, value }) => {
  const { t } = useSettings();
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
      <p className="text-label text-on-surface truncate font-semibold">{value || t('none')}</p>
    </div>
  );
};

export default ProfilePage;
