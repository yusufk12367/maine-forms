-- ─────────────────────────────────────────────────────────────────────────────
-- staff_info table — Orilla Restaurant
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gjofhlimgbtsnwoyjmus/sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_info (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ DEFAULT now(),

  -- Personal
  full_name           TEXT        NOT NULL,
  date_of_birth       TEXT        NOT NULL,
  nationality         TEXT        NOT NULL,
  joining_date        TEXT        NOT NULL,

  -- Contact
  phone_number        TEXT        NOT NULL,
  whatsapp_number     TEXT        NOT NULL,

  -- Passport
  passport_number     TEXT        NOT NULL,
  passport_expiry     TEXT        NOT NULL,
  passport_image_url  TEXT,

  -- Emirates ID
  emirates_id_number  TEXT        NOT NULL,
  eid_expiry          TEXT        NOT NULL,
  eid_front_url       TEXT,
  eid_back_url        TEXT
);

-- Enable Row Level Security
ALTER TABLE staff_info ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public form submissions from staff)
CREATE POLICY "Allow public insert on staff_info" ON staff_info
  FOR INSERT WITH CHECK (true);

-- Allow anon to SELECT (for admin dashboard)
CREATE POLICY "Allow anon select on staff_info" ON staff_info
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all on staff_info" ON staff_info
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket: staff-info
-- Create this in Supabase Dashboard > Storage > New Bucket
--   Name: staff-info
--   Public: YES (so uploaded images are accessible)
-- Then run the policies below:
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Allow public uploads to staff-info"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'staff-info');

CREATE POLICY "Allow public read from staff-info"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'staff-info');
