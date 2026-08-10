-- Create default admin user (password will be set via auth signup)
-- Note: Admin needs to be created through the signup flow, then role updated

-- Insert admin role for a specific user (will be linked after signup)
-- For now, we'll create a function to promote users to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;