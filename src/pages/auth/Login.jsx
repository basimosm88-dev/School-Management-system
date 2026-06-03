import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase } from '../../lib/supabase';
import loginBg from '../../assets/login-bg.png';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState(''); // Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, currentSchool, schoolLoading } = useAppContext();
  const { schoolSettings, t, setLanguage } = useSettings();

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight animate-pulse">{t('loadingPortal')}</h2>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // All roles log in via Supabase using email and password
      const emailToUse = identifier.includes('@') ? identifier : `${identifier}@coresa.local`.toLowerCase();
      
      const { user } = await login(emailToUse, password);

      // Verify their actual role and school in the database before proceeding
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, school_id')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        throw new Error(t('accessDeniedProfile'));
      }

      // Enforce school isolation for subdomain
      if (currentSchool && profile.school_id !== currentSchool.id) {
        await supabase.auth.signOut();
        setError(t('accessDeniedSchool') + ` (${currentSchool.name})`);
        setLoading(false);
        return;
      }

      if (profile.role === 'admin') {
        await supabase.auth.signOut();
        setError(t('accessDeniedAdmin'));
        return;
      }

      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();
        setError(t('accessDeniedRole') + ` (${t(selectedRole)})`);
        return;
      }

      // Let's route based on their confirmed role
      if (selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        // Default student language to Somali upon login
        setLanguage('so');
        navigate('/student/dashboard');
      }
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = {
    teacher: { icon: 'school', label: t('teacher'), welcome: t('welcomeEducator') },
    student: { icon: 'person', label: t('student'), welcome: t('welcomeScholar') }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 transition-colors duration-200"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="bg-white/95 backdrop-blur-md p-10 rounded-[32px] shadow-2xl shadow-slate-900/10 border border-white/60 w-full max-w-md">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-14 h-14 bg-transparent flex items-center justify-center transition-transform hover:scale-105 duration-300 overflow-hidden shrink-0">
            {currentSchool?.logo_url ? (
              <img src={currentSchool.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : schoolSettings.logo ? (
              <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-[38px] animate-pulse">school</span>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {schoolSettings.name || currentSchool?.name || 'Coresa'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">{roleConfigs[selectedRole].welcome}</p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-2 mb-8 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
          {Object.entries(roleConfigs).map(([role, config]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                selectedRole === role 
                ? 'bg-white shadow-md text-primary ring-1 ring-slate-200/50' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] mb-1">{config.icon}</span>
              <span className="text-[10px] font-black tracking-tighter">{config.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              {selectedRole === 'student' ? t('user') : t('emailAddress')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                {selectedRole === 'student' ? 'id_card' : 'mail'}
              </span>
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'student' ? t('enterUsername') : t('enterEmail')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t('password')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? t('authenticating') : (selectedRole === 'student' ? t('signInAsStudent') : t('signInAsTeacher'))}
            {!loading && <span className="material-symbols-outlined text-[20px]">login</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
