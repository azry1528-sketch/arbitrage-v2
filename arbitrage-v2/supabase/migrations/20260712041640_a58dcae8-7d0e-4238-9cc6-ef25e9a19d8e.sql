
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email IN ('admin@arbitragex.com', 'tchapmoguy@gmail.com')
         THEN 'admin'::app_role ELSE 'user'::app_role END
  );
  RETURN NEW;
END;
$function$;

-- Promote if the user already exists
SELECT public.promote_to_admin('tchapmoguy@gmail.com');
