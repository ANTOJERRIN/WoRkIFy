import type { UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: '',
  name: 'User',
  email: '',
  handle: '',
  avatarUrl: '/workify-logo.png',
  bio: '',
  location: '',
  college: '',
  skills: [],
  links: {
    linkedin: '',
    x: '',
    website: ''
  }
};
