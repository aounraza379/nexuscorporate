
-- Create employee_benefits table for insurance & benefits tracking
CREATE TABLE public.employee_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insurance_tier TEXT NOT NULL DEFAULT 'basic', -- basic, standard, premium
  total_limit NUMERIC NOT NULL DEFAULT 100000,
  amount_spent NUMERIC NOT NULL DEFAULT 0,
  coverage_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  dependents JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;

-- Employees can view their own benefits
CREATE POLICY "Users can view their own benefits"
ON public.employee_benefits
FOR SELECT
USING (auth.uid() = user_id);

-- HR can view all benefits
CREATE POLICY "HR can view all benefits"
ON public.employee_benefits
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));

-- HR can manage all benefits
CREATE POLICY "HR can manage benefits"
ON public.employee_benefits
FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role));

-- Managers can view their team's benefits
CREATE POLICY "Managers can view benefits"
ON public.employee_benefits
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_employee_benefits_updated_at
BEFORE UPDATE ON public.employee_benefits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
