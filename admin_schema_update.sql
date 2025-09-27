-- Add admin flag to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create an index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Grant admin access to a specific user (replace with your email)
-- UPDATE user_profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';

-- Example: Grant admin access to your email
-- UPDATE user_profiles SET is_admin = TRUE WHERE email = 'aleksandarkotevski@gmail.com';
