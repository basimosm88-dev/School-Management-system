import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState(''); // Email or Student ID
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAppContext();
  const { students, teachers } = useData();
  const { schoolSettings } = useSettings();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Check for Admin
    if (selectedRole === 'admin') {
      if ((identifier === 'admin' || identifier === 'admin@school.com') && password === 'admin123') {
        const user = { id: 'admin', name: 'System Admin', role: 'admin' };
        login(user);
        navigate('/admin');
        return;
      } else {
        setError('Invalid admin credentials.');
      }
    }

    // 2. Check for Teacher
    if (selectedRole === 'teacher') {
      const teacher = teachers.find(t => t.email === identifier);
      if (teacher) {
        if (teacher.password === password) {
          login({ ...teacher, role: 'teacher' });
          navigate('/teacher');
          return;
        } else {
          setError('Invalid teacher password.');
        }
      } else {
        setError('Teacher account not found.');
      }
    }

    // 3. Check for Student
    if (selectedRole === 'student') {
      const student = students.find(s => s.id.toString() === identifier);
      if (student) {
        if (student.password === password) {
          login({ ...student, role: 'student', isDefaultPassword: student.isDefaultPassword });
          navigate('/student');
          return;
        } else {
          setError('Invalid student password. (Default is last 6 digits of ID)');
        }
      } else {
        setError('Student account not found.');
      }
    }

    setLoading(false);
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
            {schoolSettings.logo ? (
              <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-[32px] animate-pulse">school</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{schoolSettings.name || 'EduCore Pro'}</h1>
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
              {selectedRole === 'student' ? 'Student ID' : 'Email Address'}
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
                placeholder={selectedRole === 'student' ? 'Enter Student ID' : 'Enter Email'}
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
        
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold text-slate-400   mb-2">Demo Credentials</h4>
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {selectedRole === 'admin' && <p><span className="font-bold text-slate-900 dark:text-slate-200">Admin:</span> admin / admin123</p>}
              {selectedRole === 'teacher' && <p><span className="font-bold text-slate-900 dark:text-slate-200">Teacher:</span> (Add via Admin Panel)</p>}
              {selectedRole === 'student' && (
                <>
                  <p><span className="font-bold text-slate-900 dark:text-slate-200">Student 1:</span> 1 / password: 1</p>
                  <p><span className="font-bold text-slate-900 dark:text-slate-200">Student 2:</span> 2 / password: 2</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
