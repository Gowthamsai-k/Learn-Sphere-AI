-- Setup SQL for Authentication in LearnSphere AI
-- Run these queries in your Supabase SQL Editor (https://supabase.com/dashboard/project/thomklnaljqgwdwjchtw/sql/new)

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert the default user to satisfy foreign key constraints for seeded progress data
INSERT INTO public.users (id, name, email, password_hash)
VALUES (
    'd3b07384-d113-4ec5-a5ae-be8e5d0d7e63',
    'Alex Rivera',
    'alex@domain.com',
    '$2a$10$tQ1XQ.D3J.oF17T8n8pI6O5wE99R9sM1rW/t7q63eN.reA0R6y1415' -- Bcrypt hash of 'password123'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Link user_id in user_progress to public.users
ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Link user_id in user_reading_progress to public.users
ALTER TABLE public.user_reading_progress 
ADD CONSTRAINT user_reading_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Link user_id in quiz_attempts to public.users
ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT quiz_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
