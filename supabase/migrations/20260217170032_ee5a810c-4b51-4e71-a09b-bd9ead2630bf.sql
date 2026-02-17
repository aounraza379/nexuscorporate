
-- =============================================
-- Add last_seen column to profiles for online status tracking
-- Managers/HR can see when employees were last active
-- =============================================

ALTER TABLE public.profiles
ADD COLUMN last_seen timestamp with time zone DEFAULT now();

-- Add is_online computed-friendly column (updated by app on login/activity)
ALTER TABLE public.profiles
ADD COLUMN is_online boolean NOT NULL DEFAULT false;
