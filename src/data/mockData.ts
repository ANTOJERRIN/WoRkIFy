import type { UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: '',
  name: 'Member',
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
