-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gjofhlimgbtsnwoyjmus/sql

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected')),

  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth TEXT,
  nationality TEXT,
  current_address TEXT,
  instagram TEXT,

  -- Document URLs
  profile_photo_url TEXT,
  passport_url TEXT,
  emirates_id_url TEXT,
  cv_url TEXT,

  -- UAE
  uae_driving_license TEXT,
  requires_accommodation TEXT,
  uae_eligibility TEXT,
  joining_availability TEXT,

  -- Languages
  english_dialog TEXT,
  english_reading TEXT,
  english_writing TEXT,
  other_languages TEXT,

  -- Professional
  position_applied TEXT,
  current_position TEXT,
  experience_years TEXT,
  current_workplace TEXT,
  previous_workplaces TEXT,
  salary_expectation TEXT,
  education TEXT,
  courses_workshops TEXT,
  skills_expertise TEXT,

  -- References & Extra
  employment_references TEXT,
  hobbies TEXT,

  -- Chef Questions
  challenge_story TEXT,
  team_inspiration TEXT,
  essential_technique TEXT,
  previous_roles_style TEXT,
  chef_meaning TEXT
);

-- If the table already exists (created before Chef Questions were added),
-- run this to add the missing columns:
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS challenge_story      TEXT,
  ADD COLUMN IF NOT EXISTS team_inspiration     TEXT,
  ADD COLUMN IF NOT EXISTS essential_technique  TEXT,
  ADD COLUMN IF NOT EXISTS previous_roles_style TEXT,
  ADD COLUMN IF NOT EXISTS chef_meaning         TEXT;

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public form submissions)
CREATE POLICY "Allow public insert" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow service role to SELECT/UPDATE (admin dashboard)
CREATE POLICY "Allow service role all" ON applications
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon to SELECT (for admin dashboard using anon key)
CREATE POLICY "Allow anon select" ON applications
  FOR SELECT USING (true);

-- Allow anon to UPDATE status
CREATE POLICY "Allow anon update" ON applications
  FOR UPDATE USING (true);

-- Storage bucket policy (already created via API)
-- Make sure 'applications' bucket is set to Public in Supabase dashboard

-- ALSO RUN THIS to allow file uploads from the public form:
CREATE POLICY "Allow public uploads to applications"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'applications');

CREATE POLICY "Allow public read from applications"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'applications');
