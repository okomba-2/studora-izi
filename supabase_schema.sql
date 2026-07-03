-- SQL Schema for Studora in Supabase
-- Paste this script into your Supabase SQL Editor (SQL Editor > New query)
-- to configure all the necessary tables, triggers, and security policies!

-- --------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    firstname TEXT,
    lastname TEXT,
    email TEXT,
    role TEXT,
    level TEXT,
    school TEXT,
    city TEXT,
    goal TEXT,
    daily_study_time TEXT,
    sound_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to delete profiles" ON public.profiles;

-- Create Security Policies
CREATE POLICY "Allow users to read their own profile" 
ON public.profiles FOR SELECT USING (
    (auth.uid() = id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE USING (
    (auth.uid() = id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);

CREATE POLICY "Allow users to insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (
    (auth.uid() = id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);

CREATE POLICY "Allow admins to delete profiles" 
ON public.profiles FOR DELETE USING (
    lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com')
);


-- --------------------------------------------------
-- 2. DOCUMENTS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'analyzing', -- 'ready' | 'analyzing' | 'analyzed' | 'error'
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

CREATE POLICY "Users can read own documents" ON public.documents FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);


-- --------------------------------------------------
-- 3. QUIZZES TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    score INTEGER,
    max_score INTEGER NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can insert own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.quizzes;

CREATE POLICY "Users can read own quizzes" ON public.quizzes FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can insert own quizzes" ON public.quizzes FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can update own quizzes" ON public.quizzes FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can delete own quizzes" ON public.quizzes FOR DELETE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);


-- --------------------------------------------------
-- 4. FLASHCARDS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;

CREATE POLICY "Users can read own flashcards" ON public.flashcards FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);


-- --------------------------------------------------
-- 5. PROGRESS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Niveau 1',
    streak INTEGER DEFAULT 0,
    hours_studied NUMERIC DEFAULT 0,
    daily_goal_pct INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;

CREATE POLICY "Users can read own progress" ON public.progress FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can insert own progress" ON public.progress FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);
CREATE POLICY "Users can update own progress" ON public.progress FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    (lower(auth.jwt() ->> 'email') IN ('okomba500@gmail.com', 'okombacontact@gmail.com'))
);


-- --------------------------------------------------
-- 6. AUTOMATIC NEW USER TRIGGER PROFILE CREATION
-- --------------------------------------------------
-- Create a trigger function to handle profile creation when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, firstname, lastname, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstname', ''),
    COALESCE(new.raw_user_meta_data->>'lastname', ''),
    new.email
  );
  
  -- Create initial study progress record for the user too
  INSERT INTO public.progress (id, user_id, xp, level, streak, hours_studied, daily_goal_pct)
  VALUES (
    'prog-' || substring(md5(random()::text) from 1 for 10),
    new.id,
    0,
    'Niveau 1',
    0,
    0.0,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
