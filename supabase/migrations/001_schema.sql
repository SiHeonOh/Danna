create extension if not exists "uuid-ossp";

create table tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('task','event','allday')),
  title text not null,
  description text,
  tag_id uuid references tags(id) on delete set null,
  date date,
  start_time time,
  end_time time,
  is_completed boolean not null default false,
  priority text check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recurrence_rules (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items(id) on delete cascade,
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly','custom')),
  interval integer not null default 1,
  days_of_week text[],
  day_of_month integer,
  month_of_year integer,
  ordinal text,
  end_date date,
  created_at timestamptz not null default now()
);

create table instance_overrides (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items(id) on delete cascade,
  original_date date not null,
  override_date date,
  override_start_time time,
  override_end_time time,
  override_title text,
  is_skipped boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(item_id, original_date)
);
