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
    spot/[id].tsx      # Spot details (opened from search)
    garage/            # Add car, car details, add modification
    events/            # Event details, create event, apply as organizer
    admin/             # Review organizer applications
  components/          # Reusable UI (Button, TextField, ...)
  constants/theme.ts   # Colors and spacing
  context/             # App-wide state (AuthContext)
  i18n/                # Translations
  data/carMakes.ts     # Car makes and models for the pickers
  lib/supabase.ts      # Supabase client
  services/            # Database + storage logic (spots, garage, photos)
  types/database.ts    # Types matching the database tables
supabase/schema.sql    # Database tables + security rules
supabase/storage.sql   # Photo storage bucket + rules
supabase/spot_photos.sql # Several photos per spot
supabase/garage.sql    # Garage photo storage + rules
supabase/fuel_type.sql # Fuel type column for garage cars
supabase/events.sql    # Event covers + organizer applications
supabase/friends.sql   # One friendship per pair, safer updates
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Open **SQL Editor**, paste the content of `supabase/schema.sql` and run it.
   - Then do the same with `supabase/storage.sql` (photo storage) `supabase/spot_photos.sql` (several photos per spot), `supabase/garage.sql` (garage photos), `supabase/fuel_type.sql` (fuel type for cars) `supabase/events.sql` (events and organizer applications) and `supabase/friends.sql` (friends).
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
  Users apply from the Events tab; admins approve them in the app.
- **admin**: verifies organizations and moderates content.

## Roadmap

- [x] Project setup, navigation, authentication
- [x] Database schema with row level security
- [x] Upload spots (up to 10 photos, camera/gallery, make/model picker, strip GPS data)
- [x] Feed of spots with swipeable photos
- [ ] Likes and comments
- [x] Search by make, model, city and year, with spot detail screen
- [x] Garage: cars, specs, modifications with dates and costs
- [x] Friends and privacy (public / friends only), profiles, Everyone / Friends feed
- [x] Events list, details, "going / interested"
- [x] Organization verification flow (apply in the app, admin approves)
- [ ] Notifications
- [ ] Bulgarian translation
- [ ] Publish to App Store and Google Play

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the development server |
| `npm run typecheck` | Check TypeScript types |
