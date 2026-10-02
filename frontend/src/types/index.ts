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

export interface AdminReviewItem {
  id: string;
  userId: string;
  workshopId: string;
  linkedinUrl: string;
  overallScore: number;
  band: string;
  strengths: string;
  improvements: string;
  createdAt: string;
  userName?: string;
}

export type PageRoute = 'landing' | 'workshops' | 'workshop-detail' | 'dashboard' | 'profile' | 'admin';
