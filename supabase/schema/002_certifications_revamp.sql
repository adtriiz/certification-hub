-- Add Certifications Feature Revamp Migration
-- Run this in Supabase SQL Editor

-- 1. Add new columns to user_certifications
ALTER TABLE public.user_certifications 
ADD COLUMN completed_at date,
ADD COLUMN credential_url text,
ADD COLUMN expires_at date;

-- 2. Create external_certifications table
CREATE TABLE public.external_certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  certification_name text NOT NULL,
  provider text NOT NULL,
  completed_at date NOT NULL,
  credential_url text,
  expires_at date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.external_certifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view own external certifications" 
  ON public.external_certifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all external certifications" 
  ON public.external_certifications FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can insert own external certifications" 
  ON public.external_certifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external certifications" 
  ON public.external_certifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own external certifications" 
  ON public.external_certifications FOR DELETE 
  USING (auth.uid() = user_id);
