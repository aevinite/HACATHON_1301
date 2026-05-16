
ALTER TABLE public.hackathons 
ADD COLUMN IF NOT EXISTS results_visible_to_judges BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.hackathons 
ADD COLUMN IF NOT EXISTS results_visible_to_participants BOOLEAN NOT NULL DEFAULT FALSE;
