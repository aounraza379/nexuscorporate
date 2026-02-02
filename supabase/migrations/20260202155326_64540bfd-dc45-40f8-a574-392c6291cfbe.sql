-- Create leave_requests table for leave management
CREATE TABLE public.leave_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Enable realtime for leave_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;

-- Employees can view their own requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests FOR SELECT
USING (auth.uid() = user_id);

-- Managers and HR can view all leave requests
CREATE POLICY "Managers and HR can view all leave requests"
ON public.leave_requests FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Authenticated users can create leave requests
CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update their own pending leave requests"
ON public.leave_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Managers and HR can update any leave request (for approval/rejection)
CREATE POLICY "Managers and HR can update leave requests"
ON public.leave_requests FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending leave requests"
ON public.leave_requests FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Add trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();