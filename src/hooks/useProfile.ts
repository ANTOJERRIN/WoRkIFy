import { useCallback } from 'react';
import { getProfile } from '../api/profile';
import type { UserProfile } from '../types';
import { useResource } from './useResource';

export function useProfile(userId?: string) {
  const load = useCallback((signal: AbortSignal) => getProfile(userId, signal), [userId]);
  const resource = useResource<UserProfile | null>(load, null, !!userId);
  const { replace } = resource;
  const acceptProfile = useCallback((profile: UserProfile) => {
    if (profile.id === userId) replace(profile);
  }, [userId, replace]);
  return { userProfile: resource.data, profileLoading: resource.loading,
    profileRefreshing: resource.refreshing, profileError: resource.error,
    reloadProfile: resource.reload, acceptProfile };
}
