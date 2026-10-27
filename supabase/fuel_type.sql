-- =============================================================================
-- Fuel type for garage cars (petrol, diesel, hybrid, electric, ...).
-- Run in Supabase (safe to run again): Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Stored as a short code checked against a fixed list (instead of an enum type),
-- because adding a new option later is then a one-line change to this check.
-- =============================================================================

alter table public.garage_cars
  add column if not exists fuel_type text
  check (fuel_type in (
    'petrol', 'diesel', 'hybrid', 'plugin_hybrid', 'mild_hybrid', 'electric', 'lpg', 'cng', 'hydrogen'
  ));
