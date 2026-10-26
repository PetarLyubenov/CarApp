/**
 * English texts. Every text the user sees should live here, never hard-coded in a screen.
 * To add Bulgarian later: copy this file to `bg.ts`, translate the values,
 * and register it in `src/i18n/index.ts`.
 */
const en = {
  common: {
    loading: 'Loading...',
    comingSoon: 'Coming soon',
    signOut: 'Sign out',
    error: 'Something went wrong',
  },
  auth: {
    signInTitle: 'Welcome back',
    signUpTitle: 'Create account',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    signIn: 'Sign in',
    signUp: 'Sign up',
    noAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Sign in',
    fillAllFields: 'Please fill in all fields.',
    passwordTooShort: 'Password must be at least 6 characters.',
    usernameInvalid: 'Username must be 3-30 characters: letters, numbers or _.',
    checkEmail: 'Check your email to confirm your account, then sign in.',
  },
  tabs: {
    feed: 'Feed',
    search: 'Search',
    upload: 'Upload',
    garage: 'Garage',
    events: 'Events',
  },
  feed: {
    description: 'Photos of cars spotted by you and your friends will appear here.',
  },
  search: {
    description: 'Search spotted cars by make and model.',
  },
  upload: {
    description: 'Upload a photo of a car you spotted.',
  },
  garage: {
    description: 'Your cars, their specs and modifications.',
  },
  events: {
    description: 'Upcoming car shows, meets and track days.',
  },
};

export default en;
// The shape of the English file is the "contract" every other language must follow.
export type Translations = typeof en;
