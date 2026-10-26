# CarApp

> Working title: the final name is not chosen yet.

A mobile app for car enthusiasts (iOS and Android):

- **Spots**: photograph cars you see, share them with friends or publicly, and search the gallery by make and model.
- **Garage**: show off your own cars with specs and a history of modifications.
- **Events**: car shows, brand meets and track days, with location, price and ticket links. Events are posted by verified organizations.

## Tech stack

| Part | Technology |
|---|---|
| App | [Expo](https://expo.dev) (React Native) + TypeScript |
| Navigation | Expo Router (file-based, `src/app/`) |
| Backend | [Supabase](https://supabase.com): Postgres, Auth, Storage |
| Translations | i18next (English now, Bulgarian planned) |

## Project structure

```
src/
  app/                 # Screens (every file = a route)
    _layout.tsx        # Root: auth check, decides auth vs. tabs
    (auth)/            # Sign in / sign up
    (tabs)/            # Feed, Search, Upload, Garage, Events
  components/          # Reusable UI (Button, TextField, ...)
  constants/theme.ts   # Colors and spacing
  context/             # App-wide state (AuthContext)
  i18n/                # Translations
  lib/supabase.ts      # Supabase client
  types/database.ts    # Types matching the database tables
supabase/schema.sql    # Database tables + security rules
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Open **SQL Editor**, paste the content of `supabase/schema.sql` and run it.
   - Copy `.env.example` to `.env.local` and fill in the URL and the publishable key from **Project Settings → API Keys**.
3. **Run the app**
   ```bash
   npx expo start
   ```
   Scan the QR code with the **Expo Go** app on your phone (iOS camera or Android Expo Go).
4. **Make yourself admin** (after signing up in the app), in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
   ```

## Roles

- **user**: posts spots, manages a garage, adds friends.
- **organization**: like a user, plus can create events once verified by an admin.
- **admin**: verifies organizations and moderates content.

## Roadmap

- [x] Project setup, navigation, authentication
- [x] Database schema with row level security
- [ ] Upload spots (camera/gallery, make/model picker, strip GPS data)
- [ ] Feed with likes and comments
- [ ] Search by make/model
- [ ] Garage: cars, specs, modifications
- [ ] Friends and privacy (public / friends only)
- [ ] Events list, details, "going / interested"
- [ ] Organization verification flow
- [ ] Notifications
- [ ] Bulgarian translation
- [ ] Publish to App Store and Google Play

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the development server |
| `npm run typecheck` | Check TypeScript types |
