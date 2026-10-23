import { useWorkify } from '../../context/WorkifyContext';

export function AccountFeedback() {
  const { registrationMutationError, registrationMutationNotice, registrationsError, isLoggedIn, currentPage, reloadRegistrations } = useWorkify();
  const showReadError = isLoggedIn && registrationsError && currentPage !== 'dashboard' && currentPage !== 'profile';
  return <>
    {registrationMutationError && <p role="alert" className="px-6 py-3 text-center text-sm text-red-600 dark:text-red-400">Registration update failed: {registrationMutationError}</p>}
    {registrationMutationNotice && <p role="status" className="px-6 py-3 text-center text-sm text-amber-700 dark:text-amber-400">{registrationMutationNotice}</p>}
    {showReadError && <div role="alert" className="px-6 py-3 text-center text-sm text-red-600 dark:text-red-400">
      <p>Your registrations could not be checked. {registrationsError}</p>
      <button onClick={() => reloadRegistrations()} className="underline mt-2">Retry registrations</button>
    </div>}
  </>;
}
