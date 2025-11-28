-- 1. Add Exercise Name (Already supported by 'exercises' table, but ensuring RLS allows inserts)
-- Allow authenticated users to insert their own exercises (if you want them to be private)
-- OR allow them to insert into the public pool (less secure for public app, fine for personal).
-- Let's assume personal custom exercises are linked to the user.

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);

-- Update RLS for exercises to allow users to see their own + public ones
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;
DROP POLICY IF EXISTS "Exercises are viewable by everyone or owner" ON public.exercises;

CREATE POLICY "Exercises are viewable by everyone or owner" ON public.exercises
FOR SELECT USING (
  user_id IS NULL OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can insert their own exercises" ON public.exercises;
CREATE POLICY "Users can insert their own exercises" ON public.exercises
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 2. Auto-Rest Timer (Optional: Save preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  auto_rest_timer_duration integer DEFAULT 90, -- seconds
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Analytics Views (Optional, can be done in frontend, but views are faster for large data)

-- View for Volume Progression (Date, Exercise, Total Volume)
CREATE OR REPLACE VIEW public.view_volume_progression AS
SELECT
    w.date,
    e.name as exercise_name,
    e.id as exercise_id,
    w.user_id,
    SUM(ws.weight * ws.reps) as total_volume
FROM
    public.workout_sets ws
JOIN
    public.workouts w ON ws.workout_id = w.id
JOIN
    public.exercises e ON ws.exercise_id = e.id
GROUP BY
    w.date, e.name, e.id, w.user_id;

-- View for Consistency (Date, Total Workouts, Total Volume)
CREATE OR REPLACE VIEW public.view_consistency_calendar AS
SELECT
    w.date,
    w.user_id,
    COUNT(DISTINCT w.id) as workout_count,
    SUM(ws.weight * ws.reps) as daily_volume
FROM
    public.workouts w
LEFT JOIN
    public.workout_sets ws ON w.id = ws.workout_id
GROUP BY
    w.date, w.user_id;
