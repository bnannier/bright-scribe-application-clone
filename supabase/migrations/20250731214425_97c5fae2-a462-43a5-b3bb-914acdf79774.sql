-- Create profile for existing user if it doesn't exist
INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
SELECT 
  id,
  raw_user_meta_data ->> 'full_name',
  email,
  raw_user_meta_data ->> 'avatar_url'
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles);