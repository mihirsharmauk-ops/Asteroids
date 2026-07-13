-- Asteroids Leaderboard Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. Scores table
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null check (level between 1 and 100),
  time float not null check (time > 0),
  created_at timestamptz default now(),
  unique (user_id, level)
);

-- 3. RLS policies
alter table profiles enable row level security;
alter table scores enable row level security;

-- Anyone can read profiles (for leaderboard display)
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Anyone can read scores (for leaderboard display)
create policy "Scores are viewable by everyone"
  on scores for select
  using (true);

-- Users can insert their own scores
create policy "Users can insert own scores"
  on scores for insert
  with check (auth.uid() = user_id);

-- Users can update their own scores (for new best times)
create policy "Users can update own scores"
  on scores for update
  using (auth.uid() = user_id);

-- 4. Leaderboard view: top 10 per level
create or replace view leaderboard as
select
  s.level,
  s.time,
  p.username,
  s.created_at,
  rank() over (partition by s.level order by s.time asc) as rank
from scores s
join profiles p on s.user_id = p.id
where s.level between 1 and 100;

-- 5. Index for fast leaderboard queries
create index if not exists idx_scores_level_time on scores (level, time asc);
create index if not exists idx_scores_user_id on scores (user_id);
