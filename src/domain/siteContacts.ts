import { safeContactUrl } from './profileValidation.ts';

export function readSiteContacts(env: { VITE_HOST_CONTACT_NUMBER?: string; VITE_F1FORGE_URL?: string }) {
  // Preserve the existing locally reviewed host-dialog number as the default.
  const configured = env.VITE_HOST_CONTACT_NUMBER ?? '9566298639';
  const phone = configured.trim().replace(/[ ()-]/g, '');
  return { phone: /^\+?[0-9]{7,15}$/.test(phone) ? phone : '', f1ForgeUrl: safeContactUrl(env.VITE_F1FORGE_URL) };
}
