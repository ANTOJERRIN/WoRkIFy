export type WorkshopStatus = 'open' | 'coming_soon' | 'cancelled';

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
  handle: string;
  headline: string;
  avatarUrl: string;
  bio: string;
  location: string;
  companyOrSchool: string;
  skills: string[];
  links: {
    linkedin?: string;
    portfolio?: string;
  };
}

export type PageRoute = 'landing' | 'workshops' | 'workshop-detail' | 'dashboard' | 'profile';
