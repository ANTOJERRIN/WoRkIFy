import type { Workshop } from '../../types';
import { readWorkshopSchedule } from '../../domain/workshopLifecycle';
import { useMeetingAccess } from '../../hooks/useMeetingAccess';
import { useWorkify } from '../../context/WorkifyContext';

/** Shared detail/dashboard presentation of the authoritative server response. */
export function MeetingAccessControl({ workshop, label }: { workshop: Workshop; label: string }) {
  const { authUser, isLoggedIn, registeredWorkshopIds, registrationsLoading, registrationsError } = useWorkify();
  const enabled = isLoggedIn && !registrationsLoading && !registrationsError && registeredWorkshopIds.includes(workshop.id)
    && workshop.status === 'open' && readWorkshopSchedule(workshop).valid;
  const { access, loading, error, retry } = useMeetingAccess(workshop.id, authUser?.id, !!enabled,
    `${workshop.status}:${workshop.startsAt}:${workshop.endsAt}`);
  const textStyle = 'text-xs text-[#636875] dark:text-gray-400';
  if (loading) return <span role="status" className={textStyle}>Checking meeting access...</span>;
  if (error) return <div role="alert" className={textStyle}><p>{error}</p><button onClick={retry} className="underline mt-1">Retry meeting access</button></div>;
  if (access.status === 'joinable') return <a href={access.meetUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
    className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-xs font-semibold">{label}</a>;
  if (access.status === 'upcoming') return <span className={textStyle}>Join opens 15m prior to the workshop start.</span>;
  if (access.status === 'ended') return <span className={textStyle}>Workshop ended · Meeting access closed</span>;
  if (access.status === 'unauthorized') return <span className={textStyle}>Meeting access is not authorized. Refresh registrations and check your sign-in status.</span>;
  return <div className={textStyle}><span>Meeting link unavailable.</span>{enabled && <button onClick={retry} className="underline ml-2">Refresh meeting access</button>}</div>;
}
