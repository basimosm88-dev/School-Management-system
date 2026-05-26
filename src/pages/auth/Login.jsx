import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState(''); // Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, currentSchool, schoolLoading } = useAppContext();
  const { schoolSettings } = useSettings();

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight animate-pulse">Loading Portal...</h2>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // All roles log in via Supabase using email and password
      const emailToUse = identifier.includes('@') ? identifier : `${identifier}@educore.local`.toLowerCase();
      
      const { user } = await login(emailToUse, password);

      // Verify their actual role and school in the database before proceeding
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, school_id')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Unable to retrieve user profile.');
      }

      // Enforce school isolation for subdomain
      if (currentSchool && profile.school_id !== currentSchool.id) {
        await supabase.auth.signOut();
        setError(`Access denied. Your account is not registered under ${currentSchool.name}.`);
        setLoading(false);
        return;
      }

      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();
        setError(`Access denied. Your account is not registered as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`);
        return;
      }

      // Let's route based on their confirmed role
      if (selectedRole === 'admin') navigate('/admin');
      else if (selectedRole === 'teacher') navigate('/teacher');
      else navigate('/student');
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = {
    admin: { icon: 'admin_panel_settings', label: 'Admin', welcome: 'Welcome back, Administrator' },
    teacher: { icon: 'school', label: 'Teacher', welcome: 'Welcome back, Educator' },
    student: { icon: 'person', label: 'Student', welcome: 'Welcome back, Scholar' }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4 transition-transform hover:scale-105 duration-300 overflow-hidden">
            {currentSchool?.logo_url ? (
              <img src={currentSchool.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : schoolSettings.logo ? (
              <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-[32px] animate-pulse">school</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentSchool?.name || schoolSettings.name || 'EduCore Pro'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{roleConfigs[selectedRole].welcome}</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
          {Object.entries(roleConfigs).map(([role, config]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-300 ${
                selectedRole === role 
                ? 'bg-white dark:bg-slate-700 shadow-md text-primary ring-1 ring-slate-200 dark:ring-slate-600' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] mb-1">{config.icon}</span>
              <span className="text-[10px] font-black  tracking-tighter">{config.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-100 dark:border-rose-800 flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              {selectedRole === 'student' ? 'Email or Student ID' : 'Email Address'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                {selectedRole === 'student' ? 'id_card' : 'mail'}
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'student' ? 'Enter Email or ID' : 'Enter Email'}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : `Sign In as ${roleConfigs[selectedRole].label}`}
            {!loading && <span className="material-symbols-outlined text-[20px]">login</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
