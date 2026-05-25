import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    if (window.innerWidth >= 1024) {
      const saved = localStorage.getItem('sidebarOpen');
      setSidebarOpen(saved !== null ? JSON.parse(saved) : true);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const [currentUser, setCurrentUser] = useState(null);

  const fetchProfile = async (user) => {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const response = await Promise.race([profilePromise, timeoutPromise]);
      if (response.error) throw response.error;
      const profile = response.data;
      
      setCurrentUser({ ...user, ...profile });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setCurrentUser(null);
    }
  };

  // Initialize Supabase Auth
  useEffect(() => {
    let active = true;

    const handleSession = async (session) => {
      if (!session) {
        if (active) {
          setCurrentUser(null);
          setLoading(false);
        }
        return;
      }
      
      // Avoid duplicate parallel fetches for the same user ID
      if (isFetchingRef.current === session.user.id) {
        return;
      }
      isFetchingRef.current = session.user.id;
      
      try {
        if (active) setLoading(true);
        
        // Race the database query against a 5-second timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        );

        const response = await Promise.race([profilePromise, timeoutPromise]);
        
        if (response.error) throw response.error;
        const profile = response.data;
        
        if (active) {
          setCurrentUser({ ...session.user, ...profile });
        }
      } catch (error) {
        console.error("Error fetching profile in handleSession:", error);
        if (active) setCurrentUser(null);
      } finally {
        if (active) setLoading(false);
        isFetchingRef.current = null;
      }
    };

    const initializeAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        await handleSession(session);
      } catch (error) {
        console.error("Auth init error:", error);
        if (active) setLoading(false);
      } finally {
        authInitialized.current = true;
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!authInitialized.current) {
        return; // Ignore premature events during initial load
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        if (active) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleDarkMode = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <AppContext.Provider value={{
      sidebarOpen,
      toggleSidebar,
      darkMode: theme === 'dark',
      toggleDarkMode,
      currentUser,
      login,
      logout,
      loading
    }}>
      {loading ? (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight animate-pulse">EduCore Pro</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-widest animate-pulse">Verifying Session...</p>
        </div>
      ) : children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
