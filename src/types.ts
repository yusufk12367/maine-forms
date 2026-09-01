export interface Application {
  id?: string
  created_at?: string
  status?: 'new' | 'reviewed' | 'shortlisted' | 'rejected'

  // Personal
  first_name: string
  last_name: string
  phone: string
  email: string
  date_of_birth: string
  nationality: string
  current_address: string
  instagram: string

  // Documents (Supabase Storage URLs)
  profile_photo_url?: string
  passport_url?: string
  emirates_id_url?: string
  cv_url?: string

  // UAE
  uae_driving_license: string
  requires_accommodation: string
  uae_eligibility: string
  joining_availability: string

  // Languages
  english_dialog: string
  english_reading: string
  english_writing: string
  other_languages: string

  // Professional
  position_applied: string
  current_position: string
  experience_years: string
  current_workplace: string
  previous_workplaces: string
  salary_expectation: string
  education: string
  courses_workshops: string
  skills_expertise: string

  // References
  employment_references: string

  // Extra
  hobbies: string

  // Chef Questions
  challenge_story: string
  team_inspiration: string
  essential_technique: string
  previous_roles_style: string
  chef_meaning: string
}
