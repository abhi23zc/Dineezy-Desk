-- Create trigger to auto-insert profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users who are missing one
INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, provider)
SELECT
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.email,
  u.phone,
  u.raw_user_meta_data->>'avatar_url',
  coalesce(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
