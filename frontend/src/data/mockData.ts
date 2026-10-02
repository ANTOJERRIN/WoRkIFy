import type { UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr-101',
  name: 'Your Name',
  email: '',
  handle: 'builder',
  avatarUrl: '/workify-logo.png',
  bio: 'Exploring practical technology experiences, AI-native developer tooling, and hands-on engineering workshops.',
  location: 'Community Member',
  college: 'Independent Builder',
  skills: [
    'AI Workflows',
    'TypeScript & React',
    'Python',
    'API Integrations',
    'Full-Stack Development'
  ],
  links: {
    linkedin: '',
    x: '',
    website: ''
  }
};
