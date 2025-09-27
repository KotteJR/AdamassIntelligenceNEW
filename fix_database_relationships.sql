-- Fix the foreign key relationship between user_analyses and user_profiles
-- First, let's check if the foreign key exists and drop it if it does
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_analyses_user_id_fkey' 
        AND table_name = 'user_analyses'
    ) THEN
        ALTER TABLE user_analyses DROP CONSTRAINT user_analyses_user_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key relationship
ALTER TABLE user_analyses 
ADD CONSTRAINT user_analyses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also ensure user_profiles has the correct relationship
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_id_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key relationship for user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
