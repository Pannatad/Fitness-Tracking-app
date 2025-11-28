-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercises Table
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null, -- 'Push', 'Pull', 'Legs', 'Other'
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workouts Table (A session)
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text, -- Optional name for the session e.g. "Morning Push"
  date date not null default CURRENT_DATE,
  start_time time,
  end_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Sets Table (Individual sets)
create table public.workout_sets (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_number integer not null,
  weight numeric(5, 2), -- Up to 999.99 kg
  reps numeric(4, 1), -- Allow half reps? or just integer
  rpe numeric(3, 1), -- Rate of Perceived Exertion (1-10)
  notes text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Users can only see their own data
alter table public.users enable row level security;
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

alter table public.workouts enable row level security;
create policy "Users can view their own workouts" on public.workouts for select using (auth.uid() = user_id);
create policy "Users can insert their own workouts" on public.workouts for insert with check (auth.uid() = user_id);
create policy "Users can update their own workouts" on public.workouts for update using (auth.uid() = user_id);
create policy "Users can delete their own workouts" on public.workouts for delete using (auth.uid() = user_id);

alter table public.workout_sets enable row level security;
create policy "Users can view their own sets" on public.workout_sets for select using (
  exists ( select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid() )
);
create policy "Users can insert their own sets" on public.workout_sets for insert with check (
  exists ( select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid() )
);
create policy "Users can update their own sets" on public.workout_sets for update using (
  exists ( select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid() )
);
create policy "Users can delete their own sets" on public.workout_sets for delete using (
  exists ( select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid() )
);

-- Exercises are public/shared for now, or could be user specific
alter table public.exercises enable row level security;
create policy "Exercises are viewable by everyone" on public.exercises for select using (true);
