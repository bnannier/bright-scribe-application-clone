-- Create profile for the user who's getting the error
INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
SELECT 
  'aff46a1c-358a-4a26-9dd3-f124b5da02d2',
  'Bobby Nannier',
  'bobby@nannier.com',
  'https://lh3.googleusercontent.com/a/ACg8ocJNPX6fpNN9aRtrIukdSWSHbz8zAytAoHul4mLZD1oaNwEUhAk=s96-c'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = 'aff46a1c-358a-4a26-9dd3-f124b5da02d2'
);