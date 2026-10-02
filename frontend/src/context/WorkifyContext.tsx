import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Workshop, UserProfile, PageRoute } from '../types';
import { INITIAL_WORKSHOPS, INITIAL_USER } from '../data/mockData';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface WorkifyContextType {
  isLoggedIn: boolean;
  authLoading: boolean;
  authUser: User | null;
  login: () => void;
  logout: () => void;
  currentPage: PageRoute;
  setCurrentPage: (page: PageRoute) => void;
  selectedWorkshopId: string | null;
  openWorkshopDetail: (workshopId: string) => void;
  workshops: Workshop[];
  registeredWorkshopIds: string[];
  hostedWorkshopIds: string[];
  registerForWorkshop: (id: string) => void;
  unregisterFromWorkshop: (id: string) => void;
  hostNewWorkshop: (workshop: Omit<Workshop, 'id' | 'attendeesCount'>) => void;
  cancelHostedWorkshop: (id: string) => void;
  isHostModalOpen: boolean;
  setIsHostModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  userProfile: UserProfile;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const WorkifyContext = createContext<WorkifyContextType | undefined>(undefined);

export const WorkifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>('wk-linkedin');
  const [workshops, setWorkshops] = useState<Workshop[]>(INITIAL_WORKSHOPS);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>([]);
  const [hostedWorkshopIds, setHostedWorkshopIds] = useState<string[]>([]);
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const isLoggedIn = !!authUser;

  // Build a userProfile from the auth user's metadata, falling back to INITIAL_USER shape
  const userProfile: UserProfile = authUser
    ? {
        id: authUser.id,
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? 'User',
        handle: '@' + (authUser.user_metadata?.preferred_username ?? authUser.email?.split('@')[0] ?? 'user'),
        headline: 'Builder',
        avatarUrl: authUser.user_metadata?.avatar_url ?? '/workify-logo.png',
        bio: '',
        location: '',
        companyOrSchool: '',
        skills: [],
        links: { linkedin: '', portfolio: '' },
      }
    : INITIAL_USER;

  // Listen for auth state changes (session restore on reload + OAuth callback)
  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setAuthLoading(false);
    });

    // Subscribe to future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSession = (session: Session | null) => {
    if (session?.user) {
      setAuthUser(session.user);
    } else {
      setAuthUser(null);
    }
  };

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
    // The page will redirect to Google — on return, onAuthStateChange picks up the session.
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setCurrentPage('landing');
  }, []);

  const openWorkshopDetail = (workshopId: string) => {
    setSelectedWorkshopId(workshopId);
    setCurrentPage('workshop-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const registerForWorkshop = (id: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setRegisteredWorkshopIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setWorkshops(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, attendeesCount: (w.attendeesCount ?? 0) + 1 };
      }
      return w;
    }));
  };

  const unregisterFromWorkshop = (id: string) => {
    setRegisteredWorkshopIds(prev => prev.filter(wId => wId !== id));
    setWorkshops(prev => prev.map(w => {
      const current = w.attendeesCount ?? 0;
      if (w.id === id && current > 0) {
        return { ...w, attendeesCount: current - 1 };
      }
      return w;
    }));
  };

  const hostNewWorkshop = (data: Omit<Workshop, 'id' | 'attendeesCount'>) => {
    const newId = 'wk-' + Date.now();
    const newWorkshop: Workshop = {
      ...data,
      id: newId,
      attendeesCount: 1,
      host: {
        name: userProfile.name,
        role: 'Host & Instructor',
        organization: userProfile.companyOrSchool,
        avatarUrl: userProfile.avatarUrl,
        verified: true
      }
    };
    setWorkshops(prev => [newWorkshop, ...prev]);
    setHostedWorkshopIds(prev => [newId, ...prev]);
    setIsHostModalOpen(false);
    setCurrentPage('dashboard');
  };

  const cancelHostedWorkshop = (id: string) => {
    setHostedWorkshopIds(prev => prev.filter(wId => wId !== id));
    setWorkshops(prev => prev.filter(w => w.id !== id));
  };

  // Guard protected pages: signed-out users go to landing + auth modal
  const guardedSetCurrentPage = useCallback((page: PageRoute) => {
    const protectedPages: PageRoute[] = ['workshops', 'workshop-detail', 'dashboard', 'profile'];
    if (protectedPages.includes(page) && !authUser) {
      setCurrentPage('landing');
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentPage(page);
  }, [authUser]);

  return (
    <WorkifyContext.Provider
      value={{
        isLoggedIn,
        authLoading,
        authUser,
        login,
        logout,
        currentPage,
        setCurrentPage: guardedSetCurrentPage,
        selectedWorkshopId,
        openWorkshopDetail,
        workshops,
        registeredWorkshopIds,
        hostedWorkshopIds,
        registerForWorkshop,
        unregisterFromWorkshop,
        hostNewWorkshop,
        cancelHostedWorkshop,
        isHostModalOpen,
        setIsHostModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        userProfile,
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
