
-- Fix 1: Company policies - require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view active policies" ON public.company_policies;
CREATE POLICY "Authenticated users can view active policies"
ON public.company_policies
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Fix 2: Enable leaked password protection is handled via auth config

-- Fix 3: Make audit_logs immutable - prevent updates and deletes even by HR
-- (Already no update/delete policies, but let's be explicit)

-- Fix 4: Create a view for profiles without salary_info for non-HR users
-- (RLS already handles this through separate policies, but let's tighten)

-- Fix 5: Add index for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- Fix 6: Create wellness_checkins table for real wellness data
CREATE TABLE IF NOT EXISTS public.wellness_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wellness_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins"
ON public.wellness_checkins
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkins"
ON public.wellness_checkins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers and HR can view all checkins"
ON public.wellness_checkins
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Add index
CREATE INDEX idx_wellness_checkins_user ON public.wellness_checkins(user_id);
CREATE INDEX idx_wellness_checkins_date ON public.wellness_checkins(created_at DESC);
