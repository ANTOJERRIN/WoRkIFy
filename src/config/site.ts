import { readSiteContacts } from '../domain/siteContacts';

const contacts = readSiteContacts(import.meta.env);
export const HOST_CONTACT_NUMBER = contacts.phone;
export const F1FORGE_URL = contacts.f1ForgeUrl;
