import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { Workshop, UserProfile, PageRoute } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { listWorkshops, listUserRegistrations, registerForWorkshop as apiRegister, unregister as apiUnregister } from '../api/workshops';
import { getProfile } from '../api/profile';
import { AuthProvider, useAuth } from './AuthContext';
import { useAppRoute } from '../routing/useAppRoute';
import type { User } from '@supabase/supabase-js';

interface WorkifyContextType {
  isLoggedIn: boolean; isAdmin: boolean; authLoading: boolean; authUser: User | null;
  logout: () => Promise<void>;
  currentPage: PageRoute; setCurrentPage: (page: PageRoute) => void;
  selectedWorkshopId: string | null; openWorkshopDetail: (id: string) => void;
  workshops: Workshop[]; workshopsLoading: boolean; workshopsError: string | null;
  reloadWorkshops: () => Promise<void>;
  registeredWorkshopIds: string[]; registeringWorkshopId: string | null;
  registerForWorkshop: (id: string) => Promise<void>; unregisterFromWorkshop: (id: string) => Promise<void>;
  isHostModalOpen: boolean; setIsHostModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean; setIsAuthModalOpen: (open: boolean) => void;
  userProfile: UserProfile; reloadProfile: () => Promise<void>; setUserProfile: Dispatch<SetStateAction<UserProfile>>;
  darkMode: boolean; toggleDarkMode: () => void;
  actionError: string | null; clearActionError: () => void;
}
const WorkifyContext = createContext<WorkifyContextType | undefined>(undefined);

function WorkifyStateProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { page: currentPage, workshopId: selectedWorkshopId, navigate } = useAppRoute();
  const authUser = auth.user;
  const isLoggedIn = auth.status === 'authenticated' && !!authUser;
  const isAdmin = isLoggedIn && auth.permission === 'admin';
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [workshopsError, setWorkshopsError] = useState<string | null>(null);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState<string[]>([]);
  const [registeringWorkshopId, setRegisteringWorkshopId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);
  const [actionError, setActionError] = useState<string | null>(null);
  const catalogRequest = useRef(0);
  const accountRequest = useRef(0);
  const identity = useRef<string | null>(null);
  useEffect(() => { identity.current = authUser?.id ?? null; }, [authUser?.id]);

  const loadWorkshops = useCallback(async () => {
    const request = ++catalogRequest.current;
    setWorkshopsLoading(true); setWorkshopsError(null);
    try {
      const data = await listWorkshops();
      if (request === catalogRequest.current) setWorkshops(data);
    } catch {
      if (request === catalogRequest.current) setWorkshopsError('Workshops could not be loaded. Please try again.');
    } finally { if (request === catalogRequest.current) setWorkshopsLoading(false); }
  }, []);
  useEffect(() => { void loadWorkshops(); return () => { catalogRequest.current++; }; }, [loadWorkshops]);

  const reloadProfile = useCallback(async () => {
    const userId = identity.current;
    if (!userId) return;
    const profile = await getProfile();
    if (identity.current === userId && profile) setUserProfile(profile);
  }, []);

  useEffect(() => {
    const request = ++accountRequest.current;
    setRegisteredWorkshopIds([]); setRegisteringWorkshopId(null); setUserProfile(INITIAL_USER); setActionError(null);
    if (!authUser) { setIsAuthModalOpen(false); return; }
    setIsAuthModalOpen(false);
    setUserProfile({ ...INITIAL_USER, id: authUser.id, name: authUser.user_metadata?.full_name || 'Member', email: authUser.email || '' });
    void Promise.allSettled([getProfile(), listUserRegistrations()]).then(([profile, registrations]) => {
      if (request !== accountRequest.current) return;
      if (profile.status === 'fulfilled' && profile.value) setUserProfile(profile.value);
      if (registrations.status === 'fulfilled') setRegisteredWorkshopIds(registrations.value);
      if (profile.status === 'rejected' || registrations.status === 'rejected') setActionError('Some account details could not be loaded. Please reload to try again.');
    });
    return () => { accountRequest.current++; };
  }, [authUser]);

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => { setIsAuthModalOpen(false); }, [currentPage, selectedWorkshopId]);
  useEffect(() => {
    if (isLoggedIn && currentPage === 'login' && auth.permission !== 'loading' && !auth.recovery) navigate(isAdmin ? 'admin' : 'dashboard', undefined, true);
  }, [isLoggedIn, currentPage, auth.permission, auth.recovery, isAdmin, navigate]);

  const setCurrentPage = useCallback((page: PageRoute) => { setIsAuthModalOpen(false); navigate(page); }, [navigate]);
  const openWorkshopDetail = useCallback((id: string) => { setIsAuthModalOpen(false); navigate('workshop-detail', id); }, [navigate]);
  const setIsHostModalOpen = useCallback((open: boolean) => {
    if (!open) return;
    if (!isLoggedIn) { setIsAuthModalOpen(true); return; }
    if (isAdmin) navigate('admin');
    else setActionError('Only the Workify admin can create and host workshops.');
  }, [isLoggedIn, isAdmin, navigate]);
  const registerForWorkshop = async (id: string) => {
    if (!isLoggedIn) { setIsAuthModalOpen(true); return; }
    if (registeringWorkshopId) return;
    const userId = identity.current;
    setRegisteringWorkshopId(id); setActionError(null);
    try {
      await apiRegister(id);
      if (identity.current === userId) setRegisteredWorkshopIds(ids => ids.includes(id) ? ids : [...ids, id]);
    } catch (error) { if (identity.current === userId) setActionError(error instanceof Error ? error.message : 'Registration failed.'); }
    finally { if (identity.current === userId) setRegisteringWorkshopId(null); }
  };
  const unregisterFromWorkshop = async (id: string) => {
    if (!isLoggedIn) return;
    const userId = identity.current;
    setActionError(null);
    await apiUnregister(id);
    if (identity.current === userId) setRegisteredWorkshopIds(ids => ids.filter(existing => existing !== id));
  };
  const logout = useCallback(async () => { setIsAuthModalOpen(false); await auth.logout(); }, [auth.logout]);

  return <WorkifyContext.Provider value={{
    isLoggedIn, isAdmin, authLoading: auth.status === 'loading', authUser, logout,
    currentPage, setCurrentPage, selectedWorkshopId, openWorkshopDetail,
    workshops, workshopsLoading, workshopsError, reloadWorkshops: loadWorkshops,
    registeredWorkshopIds, registeringWorkshopId, registerForWorkshop, unregisterFromWorkshop,
    isHostModalOpen: false, setIsHostModalOpen, isAuthModalOpen, setIsAuthModalOpen,
    userProfile: userProfile.id === authUser?.id ? userProfile : INITIAL_USER, reloadProfile, setUserProfile, darkMode, toggleDarkMode: () => setDarkMode(value => !value),
    actionError, clearActionError: () => setActionError(null),
  }}>{children}</WorkifyContext.Provider>;
}
export function WorkifyProvider({ children }: { children: ReactNode }) {
  return <AuthProvider><WorkifyStateProvider>{children}</WorkifyStateProvider></AuthProvider>;
}
export function useWorkify() {
  const context = useContext(WorkifyContext);
  if (!context) throw new Error('useWorkify must be used within WorkifyProvider');
  return context;
}
