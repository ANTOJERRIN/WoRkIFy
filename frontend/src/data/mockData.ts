import type { UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr-101',
  name: 'Your Name',
  handle: '@builder',
  headline: 'Software Engineer & Builder',
  avatarUrl: '/workify-logo.png',
  bio: 'Exploring practical technology experiences, AI-native developer tooling, and hands-on engineering workshops.',
  location: 'Community Member',
  companyOrSchool: 'Independent Builder',
  skills: [
    'AI Workflows',
    'TypeScript & React',
    'Python',
    'API Integrations',
    'Full-Stack Development'
  ],
  links: {
    linkedin: '',
    portfolio: ''
  }
};
