import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Workshop, UserProfile, PageRoute } from '../types';
import { INITIAL_WORKSHOPS, INITIAL_USER } from '../data/mockData';

interface WorkifyContextType {
  isLoggedIn: boolean;
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>('wk-1');
  const [workshops, setWorkshops] = useState<Workshop[]>(INITIAL_WORKSHOPS);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>(['wk-1', 'wk-3']);
  const [hostedWorkshopIds, setHostedWorkshopIds] = useState<string[]>(['wk-1']);
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userProfile] = useState<UserProfile>(INITIAL_USER);
  const [darkMode, setDarkMode] = useState<boolean>(false);

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

  const login = () => {
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    if (currentPage === 'landing') {
      setCurrentPage('workshops');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

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
        return { ...w, attendeesCount: w.attendeesCount + 1 };
      }
      return w;
    }));
  };

  const unregisterFromWorkshop = (id: string) => {
    setRegisteredWorkshopIds(prev => prev.filter(wId => wId !== id));
    setWorkshops(prev => prev.map(w => {
      if (w.id === id && w.attendeesCount > 0) {
        return { ...w, attendeesCount: w.attendeesCount - 1 };
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

  return (
    <WorkifyContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        currentPage,
        setCurrentPage,
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
