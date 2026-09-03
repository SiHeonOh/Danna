-- Free-text location for items ("BHEE 129", "Starbucks on State St").
-- Rendered as an "open in Google Maps" link — no Maps API involved.
alter table items add column if not exists location text;
