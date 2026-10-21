import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Workshop, UserProfile, PageRoute } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { supabase } from '../lib/supabase';
import {
  listWorkshops,
  listUserRegistrations,
  registerForWorkshop as apiRegister,
  unregister as apiUnregister,
} from '../api/workshops';
import { getProfile } from '../api/profile';
import { checkIsAdmin } from '../api/admin';
import type { User, Session } from '@supabase/supabase-js';
import { useUrlRoute } from '../routing/useUrlRoute';
import { pagePath, workshopPath } from '../routing/routes';

interface WorkifyContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  adminLoading: boolean;
  authUser: User | null;
  logout: () => void;
  currentPage: PageRoute;
  setCurrentPage: (page: PageRoute) => void;
  selectedWorkshopId: string | null;
  openWorkshopDetail: (workshopId: string) => void;
  workshops: Workshop[];
  workshopsLoading: boolean;
  workshopsError: string | null;
  reloadWorkshops: () => Promise<void>;
  registeredWorkshopIds: string[];
  registeringWorkshopId: string | null;
  registerForWorkshop: (id: string) => Promise<void>;
  unregisterFromWorkshop: (id: string) => Promise<void>;
  isHostModalOpen: boolean;
  setIsHostModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  userProfile: UserProfile;
  reloadProfile: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const WorkifyContext = createContext<WorkifyContextType | undefined>(undefined);

export const WorkifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [adminResult, setAdminResult] = useState<{ userId: string; allowed: boolean } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const { currentPage, selectedWorkshopId, navigate } = useUrlRoute();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState<boolean>(true);
  const [workshopsError, setWorkshopsError] = useState<string | null>(null);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>([]);
  const [registeringWorkshopId, setRegisteringWorkshopId] = useState<string | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);

  const isLoggedIn = !!authUser;
  const adminLoading = !!authUser && adminResult?.userId !== authUser.id;
  const isAdmin = !!authUser && adminResult?.userId === authUser.id && adminResult.allowed;
  const catalogRequest = useRef(0);

  // Load profile from Supabase profiles table
  const reloadProfile = useCallback(async () => {
    if (!authUser) {
      setUserProfile(INITIAL_USER);
      return;
    }
    try {
      const dbProfile = await getProfile();
      if (dbProfile) {
        setUserProfile(dbProfile);
      } else {
        // Fallback to auth metadata if DB row trigger hasn't finished yet
        setUserProfile({
          id: authUser.id,
          name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? 'User',
          email: authUser.email || '',
          handle: (authUser.user_metadata?.preferred_username ?? authUser.email?.split('@')[0] ?? 'user').toLowerCase(),
          avatarUrl: authUser.user_metadata?.avatar_url ?? '/workify-logo.png',
          bio: '',
          location: '',
          college: '',
          skills: [],
          links: { linkedin: '', x: '', website: '' },
        });
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }, [authUser]);

  // Resolve role separately from the session and ignore stale account results.
  useEffect(() => {
    if (!authUser) { setAdminResult(null); return; }
    let active = true;
    checkIsAdmin().then(allowed => {
      if (active) setAdminResult({ userId: authUser.id, allowed });
    }).catch(() => {
      if (active) setAdminResult({ userId: authUser.id, allowed: false });
    });
    return () => { active = false; };
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      reloadProfile();
    } else {
      setUserProfile(INITIAL_USER);
    }
  }, [authUser, reloadProfile]);

  // Fetch workshops from Supabase
  const loadWorkshops = useCallback(async () => {
    const request = ++catalogRequest.current;
    setWorkshopsLoading(true);
    setWorkshopsError(null);
    try {
      const data = await listWorkshops();
      if (request !== catalogRequest.current) return;
      setWorkshops(data);
    } catch (err: unknown) {
      if (request !== catalogRequest.current) return;
      console.error('Failed to load public workshops:', err);
      setWorkshopsError('Workshops could not be loaded. Please try again.');
    } finally {
      if (request === catalogRequest.current) setWorkshopsLoading(false);
    }
  }, []);

  // Fetch user registrations
  const loadRegistrations = useCallback(async () => {
    if (!authUser) {
      setRegisteredWorkshopIds([]);
      return;
    }
    try {
      const regIds = await listUserRegistrations();
      setRegisteredWorkshopIds(regIds);
    } catch (err) {
      console.error('Failed to load user registrations:', err);
    }
  }, [authUser]);

  const handleSession = (session: Session | null) => {
    if (session?.user) {
      setAuthUser(session.user);
    } else {
      setAuthUser(null);
      setAdminResult(null);
      setIsHostModalOpen(false);
      setIsAuthModalOpen(false);
      setRegisteredWorkshopIds([]);
      setUserProfile(INITIAL_USER);
    }
  };

  // Initial load of workshops
  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  // Listen for auth state changes
  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active || authEventReceived) return;
      if (error) console.error('Session restoration failed:', error);
      handleSession(error ? null : session);
    }).catch(error => {
      if (!active || authEventReceived) return;
      console.error('Session restoration failed:', error);
      handleSession(null);
    }).finally(() => {
      if (active) setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      handleSession(session);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Reload registrations whenever auth user changes
  useEffect(() => {
    if (authUser) {
      loadRegistrations();
    } else {
      setRegisteredWorkshopIds([]);
    }
  }, [authUser, loadRegistrations]);

  // Any route change, including browser Back/Forward, dismisses stale overlays.
  useEffect(() => {
    setIsAuthModalOpen(false);
    setIsHostModalOpen(false);
  }, [currentPage, selectedWorkshopId]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const logout = useCallback(async () => {
    setIsAuthModalOpen(false);
    setIsHostModalOpen(false);
    await supabase.auth.signOut();
    setAuthUser(null);
    setAdminResult(null);
    setRegisteredWorkshopIds([]);
    setUserProfile(INITIAL_USER);
    navigate('/');
  }, [navigate]);

  const openWorkshopDetail = (workshopId: string) => {
    setIsAuthModalOpen(false);
    setIsHostModalOpen(false);
    navigate(workshopPath(workshopId));
  };

  const registerForWorkshop = async (id: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setRegisteringWorkshopId(id);
    try {
      await apiRegister(id);
      setRegisteredWorkshopIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      console.error('Registration failed:', msg);
      alert(msg);
    } finally {
      setRegisteringWorkshopId(null);
    }
  };

  const unregisterFromWorkshop = async (id: string) => {
    if (!isLoggedIn) return;
    try {
      await apiUnregister(id);
      setRegisteredWorkshopIds(prev => prev.filter(wId => wId !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unregistration failed';
      console.error('Unregistration failed:', msg);
      alert(msg);
    }
  };

  const guardedSetIsHostModalOpen = useCallback((open: boolean) => {
    if (open && !authUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsHostModalOpen(open);
  }, [authUser]);

  // URL selection is independent of authentication. The page shell guards content.
  const guardedSetCurrentPage = useCallback((page: PageRoute) => {
    setIsAuthModalOpen(false);
    setIsHostModalOpen(false);
    navigate(pagePath(page));
  }, [navigate]);

  return (
    <WorkifyContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        authLoading,
        adminLoading,
        authUser,
        logout,
        currentPage,
        setCurrentPage: guardedSetCurrentPage,
        selectedWorkshopId,
        openWorkshopDetail,
        workshops,
        workshopsLoading,
        workshopsError,
        reloadWorkshops: loadWorkshops,
        registeredWorkshopIds,
        registeringWorkshopId,
        registerForWorkshop,
        unregisterFromWorkshop,
        isHostModalOpen,
        setIsHostModalOpen: guardedSetIsHostModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        userProfile,
        reloadProfile,
        setUserProfile,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </WorkifyContext.Provider>
  );
};

export const useWorkify = () => {
  const context = useContext(WorkifyContext);
  if (!context) {
    throw new Error('useWorkify must be used within a WorkifyProvider');
  }
  return context;
};
