import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

interface WorkifyContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  authUser: User | null;
  login: () => void;
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
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

  // Check admin role
  const checkAdminStatus = useCallback(async () => {
    if (!authUser) {
      setIsAdmin(false);
      return;
    }
    try {
      const admin = await checkIsAdmin();
      setIsAdmin(admin);
    } catch {
      setIsAdmin(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      reloadProfile();
      checkAdminStatus();
    } else {
      setUserProfile(INITIAL_USER);
      setIsAdmin(false);
    }
  }, [authUser, reloadProfile, checkAdminStatus]);

  // Fetch workshops from Supabase
  const loadWorkshops = useCallback(async () => {
    setWorkshopsLoading(true);
    setWorkshopsError(null);
    try {
      const data = await listWorkshops();
      setWorkshops(data);
      if (data.length > 0 && !selectedWorkshopId) {
        setSelectedWorkshopId(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load workshops';
      setWorkshopsError(msg);
    } finally {
      setWorkshopsLoading(false);
    }
  }, [selectedWorkshopId]);

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
      setIsAdmin(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
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

  // When a session appears while on the landing page, navigate to workshops
  useEffect(() => {
    if (isLoggedIn && currentPage === 'landing') {
      setCurrentPage('workshops');
      setIsAuthModalOpen(false);
    }
  }, [isLoggedIn, currentPage]);

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

  const login = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setIsAdmin(false);
    setRegisteredWorkshopIds([]);
    setUserProfile(INITIAL_USER);
    setCurrentPage('landing');
  }, []);

  const openWorkshopDetail = (workshopId: string) => {
    setSelectedWorkshopId(workshopId);
    setCurrentPage('workshop-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Guard protected pages: signed-out users go to landing + auth modal
  // Non-admins attempting to access 'admin' go to 'workshops'
  const guardedSetCurrentPage = useCallback((page: PageRoute) => {
    const protectedPages: PageRoute[] = ['workshops', 'workshop-detail', 'dashboard', 'profile', 'admin'];
    if (protectedPages.includes(page) && !authUser) {
      setCurrentPage('landing');
      setIsAuthModalOpen(true);
      return;
    }
    if (page === 'admin' && !isAdmin) {
      // Non-admins cannot access admin page
      setCurrentPage('workshops');
      return;
    }
    setCurrentPage(page);
  }, [authUser, isAdmin]);

  return (
    <WorkifyContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        authLoading,
        authUser,
        login,
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
        setIsHostModalOpen,
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
