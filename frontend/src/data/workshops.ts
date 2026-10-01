import type { Workshop } from '../types';

export const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: 'wk-linkedin',
    title: 'LinkedIn Workshop',
    eyebrow: 'CAREER & NETWORK',
    shortDescription: 'Master modern professional presence, builder visibility, and technical networking with the F1 Forge team.',
    fullDescription: 'An interactive, high-impact session on engineering your online presence, positioning your technical builds, and connecting with tech founders, hiring managers, and collaborators.',
    host: {
      name: 'F1 Forge',
      role: 'Engineering Team',
      organization: 'F1 Forge',
      avatarUrl: '/workify-logo.png',
      verified: true
    },
    domain: 'ALL',
    domainLabel: 'All Tracks',
    mode: 'Online — Google Meet',
    meetUrl: 'https://meet.google.com',
    dateTime: 'Date to be announced',
    tags: ['LinkedIn', 'Networking', 'Career Growth', 'Builder Profile'],
    level: 'Beginner',
    featured: true,
    comingSoon: false
  },
  {
    id: 'wk-coming-soon',
    title: 'Other tracks — coming soon',
    eyebrow: 'UPCOMING TRACKS',
    shortDescription: 'New hands-on workshops across AI Agents, Generative AI, Automation, and Cloud are currently in development.',
    fullDescription: 'Additional specialized tracks are currently being prepared with partner engineering teams. Check back soon for announcements.',
    host: {
      name: 'Workify',
      role: 'Platform',
      organization: 'Workify',
      avatarUrl: '/workify-logo.png',
      verified: true
    },
    domain: 'ALL',
    domainLabel: 'All Tracks',
    mode: 'Online — Google Meet',
    meetUrl: '',
    dateTime: 'Coming Soon',
    tags: ['AI Agents', 'Gen AI', 'Automation', 'Cloud'],
    level: 'Beginner',
    comingSoon: true
  }
];
