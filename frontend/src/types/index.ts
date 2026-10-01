export type Domain = 'ALL' | 'AGENTS' | 'GEN_AI' | 'AUTOMATION' | 'CLOUD' | 'HUMAN_AI';

export interface HostInfo {
  name: string;
  role: string;
  organization: string;
  avatarUrl: string;
  verified: boolean;
}

export interface AgendaItem {
  time: string;
  title: string;
  summary: string;
}

export interface Workshop {
  id: string;
  title: string;
  eyebrow?: string;
  shortDescription: string;
  fullDescription: string;
  host: HostInfo;
  domain: Domain;
  domainLabel: string;
  mode: 'Online — Google Meet';
  meetUrl: string;
  dateTime: string;
  startsAt?: string; // ISO string
  durationMinutes?: number;
  tags: string[];
  prerequisites?: string[];
  agenda?: AgendaItem[];
  attendeesCount?: number;
  maxAttendees?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  featured?: boolean;
  comingSoon?: boolean;
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
