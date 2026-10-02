-- Add Advanced Profile Fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Create a view for public profile if needed
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT 
    id, 
    full_name, 
    profile_pic, 
    bio, 
    instagram_url, 
    twitter_url, 
    linkedin_url, 
    skills,
    package_id,
    created_at
FROM 
    public.profiles;

-- Grant access to the view
GRANT SELECT ON public.user_public_profiles TO anon, authenticated;
