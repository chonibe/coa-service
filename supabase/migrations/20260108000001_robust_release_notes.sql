-- Robust Release Notes Enhancement
ALTER TABLE public.platform_updates 
ADD COLUMN IF NOT EXISTS stakeholder_summary text,
ADD COLUMN IF NOT EXISTS technical_details text,
ADD COLUMN IF NOT EXISTS impact_level text DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS is_breaking boolean DEFAULT false;

-- Update existing records to have a basic stakeholder summary from their description
UPDATE public.platform_updates 
SET stakeholder_summary = description,
    technical_details = 'Initial migration data.'
WHERE stakeholder_summary IS NULL;

