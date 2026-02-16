
-- Add mandatory and read tracking to announcements
ALTER TABLE public.announcements 
ADD COLUMN is_mandatory boolean NOT NULL DEFAULT false,
ADD COLUMN read_by uuid[] NOT NULL DEFAULT '{}';

-- Create a function to mark announcement as read
CREATE OR REPLACE FUNCTION public.mark_announcement_read(_announcement_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.announcements
  SET read_by = array_append(read_by, _user_id)
  WHERE id = _announcement_id
    AND NOT (_user_id = ANY(read_by));
END;
$$;
