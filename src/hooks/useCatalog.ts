import { useCallback } from 'react';
import { listWorkshops } from '../api/workshops';
import type { Workshop } from '../types';
import { useResource } from './useResource';

const emptyCatalog: Workshop[] = [];

export function useCatalog() {
  const load = useCallback((signal: AbortSignal) => listWorkshops(signal), []);
  const resource = useResource(load, emptyCatalog);
  return { workshops: resource.data, workshopsLoading: resource.loading,
    workshopsRefreshing: resource.refreshing, workshopsError: resource.error,
    reloadWorkshops: resource.reload };
}
