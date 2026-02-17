
-- Claims history table for tracking insurance claim details
CREATE TABLE public.claims_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- e.g. 'hospitalization', 'dental', 'pharmacy', 'consultation', 'lab_test'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  provider TEXT, -- hospital/clinic name
  claim_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claims_history ENABLE ROW LEVEL SECURITY;

-- Employees can view their own claims
CREATE POLICY "Users can view their own claims"
ON public.claims_history FOR SELECT
USING (auth.uid() = user_id);

-- HR can view and manage all claims
CREATE POLICY "HR can manage all claims"
ON public.claims_history FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role));

-- HR can view all claims
CREATE POLICY "HR can view all claims"
ON public.claims_history FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));

-- Managers can view their team's claims
CREATE POLICY "Managers can view claims"
ON public.claims_history FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Users can insert their own claims
CREATE POLICY "Users can insert own claims"
ON public.claims_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_claims_history_updated_at
BEFORE UPDATE ON public.claims_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
