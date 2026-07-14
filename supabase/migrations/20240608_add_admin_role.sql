-- Add email column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add is_admin column to profiles table (boolean)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Update RLS to allow admin access
-- Note: You'll need to set is_admin = true for admin users in the profiles table
