import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import loginBg from '../../assets/login-bg.png';

const AdminResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  
  const navigate = useNavigate();
  const { schoolSettings, t } = useSettings();
  const { currentSchool, schoolLoading } = useAppContext();

  useEffect(() => {
    // Check if there is an active session (which is automatically set by Supabase when recovery link is clicked)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // Verify role is admin
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileErr || !profile || profile.role !== 'admin') {
            await supabase.auth.signOut();
            setError(t('accessDeniedOnlyAdmin') || 'Access denied. Only administrators can use this password reset.');
            setHasSession(false);
          } else {
            setHasSession(true);
          }
        } else {
          setError('Invalid or expired reset link. Please request a new one.');
          setHasSession(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError('Error verifying session.');
        setHasSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [t]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) throw updateErr;

      setSuccess(true);
      // Log out immediately so they can log back in with their new password
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Update password error:", err);
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (schoolLoading || checkingSession) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight animate-pulse">{t('loadingPortal')}</h2>
      </div>
    );
  }

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
            <p className="text-xs text-slate-500 mt-1 font-medium">{t('resetPassword')}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <span className="material-symbols-outlined text-[32px]">check</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('passwordResetSuccess')}</h2>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
            >
              {t('signInAsAdmin')}
              <span className="material-symbols-outlined text-[20px]">login</span>
            </button>
          </div>
        ) : hasSession ? (
          <form onSubmit={handleReset} className="space-y-6">
            <p className="text-xs text-slate-500 ml-1 leading-relaxed">
              {t('renewPasswordDescription')}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                {t('newPassword')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                {t('confirmNewPassword')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? t('updatingPassword') : t('saveNewPassword')}
              {!loading && <span className="material-symbols-outlined text-[20px]">save</span>}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <p className="text-sm text-slate-600">
              Please request a password reset from the login page.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              {t('backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResetPassword;
