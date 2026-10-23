// Durable publication state. Scheduled/ongoing/completed are derived from time.
export type WorkshopPublicationStatus = 'open' | 'coming_soon' | 'cancelled' | 'archived';
export type WorkshopStatus = WorkshopPublicationStatus;

export interface Workshop {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  mode: 'Online — Google Meet';
  startsAt: string | null; // ISO string
  endsAt: string | null;   // ISO string
  timezone: string;
  status: WorkshopStatus;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
}

export interface RegistrationWithWorkshop {
  id: string;
  userId: string;
  workshopId: string;
  createdAt: string;
  workshop: Workshop;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  college: string;
  location: string;
  skills: string[];
  links: {
    linkedin?: string;
    x?: string;
    website?: string;
  };
}

export interface AdminRegistrationItem {
  id: string;
  userId: string;
  workshopId: string;
  createdAt: string;
  profile: {
    name: string;
    email: string;
    handle: string;
    linkedinUrl: string;
  } | null;
}

export type PageRoute = 'landing' | 'workshops' | 'workshop-detail' | 'dashboard' | 'profile' | 'admin' | 'not-found';
