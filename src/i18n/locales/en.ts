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
    empty: 'No spots yet. Be the first to upload one!',
    friendsOnly: 'Friends only',
  },
  search: {
    description: 'Search spotted cars by make and model.',
  },
  upload: {
    title: 'New spot',
    takePhoto: 'Take photo',
    chooseFromLibrary: 'Choose from library',
    camera: 'Camera',
    library: 'Library',
    coverHint: 'Tap a photo to make it the cover.',
    maxPhotos: 'You can add up to {{max}} photos.',
    make: 'Make',
    model: 'Model',
    selectMake: 'Select make',
    selectModel: 'Select model',
    selectMakeFirst: 'Select a make first',
    year: 'Year (optional)',
    city: 'City (optional)',
    description: 'Description (optional)',
    visibility: 'Who can see it?',
    public: 'Everyone',
    friends: 'Friends only',
    submit: 'Upload spot',
    success: 'Spot uploaded!',
    needPhoto: 'Please add a photo.',
    needMakeModel: 'Please select the make and model.',
    invalidYear: 'Please enter a valid year.',
    cameraDenied: 'Camera access is needed to take a photo. You can allow it in Settings.',
    libraryDenied: 'Photo access is needed to choose a photo. You can allow it in Settings.',
  },
  picker: {
    search: 'Search...',
    useCustom: 'Use "{{value}}"',
    noResults: 'Nothing found',
    close: 'Close',
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
