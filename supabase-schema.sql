-- RTO Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Attendance Records
create table if not exists attendance_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('office', 'wfh', 'pto', 'sick', 'holiday', 'none')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Holidays
create table if not exists holidays (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- User Settings
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  required_days_per_week integer default 3 check (required_days_per_week between 0 and 7),
  required_days_per_month integer check (required_days_per_month between 0 and 31),
  compliance_mode text default 'weekly' check (compliance_mode in ('weekly', 'monthly')),
  reminder_enabled boolean default true,
  reminder_time text default '09:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table attendance_records enable row level security;
alter table holidays enable row level security;
alter table user_settings enable row level security;

-- RLS Policies
create policy "Users can only access their own records"
  on attendance_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can only access their own holidays"
  on holidays for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can only access their own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger attendance_records_updated_at
  before update on attendance_records
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

-- Indexes for performance
create index if not exists idx_attendance_user_date on attendance_records(user_id, date);
create index if not exists idx_attendance_user_month on attendance_records(user_id, date_trunc('month', date));
create index if not exists idx_holidays_user_date on holidays(user_id, date);
