import { useState } from 'react'
import { supabase } from './lib/supabase'
import type { Application } from './types'
import { CheckCircle, Upload, ChevronRight, ChevronLeft } from 'lucide-react'

const POSITIONS = [
  'Butcher',
  'Commis 1',
  'Commis 2',
  'Commis 2 – Sushi / Raw',
  'Demi Chef',
  'CDP – Pastry',
  'CDP – Pan',
  'CDP – Turkey / Arabic',
  'Commis 2 / 3',
  'Junior Sous Chef',
  'Head Chef',
  'Pastry Chef',
]

const ENGLISH_LEVELS = ['Fluent', 'Very Good', 'Good', 'Need Improvement', 'Mediocre']

const emptyForm: Omit<Application, 'id' | 'created_at' | 'status'> = {
  first_name: '', last_name: '', phone: '', email: '', date_of_birth: '',
  nationality: '', current_address: '', instagram: '',
  profile_photo_url: '', passport_url: '', emirates_id_url: '', cv_url: '',
  uae_driving_license: '', requires_accommodation: '', uae_eligibility: '', joining_availability: '',
  english_dialog: '', english_reading: '', english_writing: '', other_languages: '',
  position_applied: '', current_position: '', experience_years: '', current_workplace: '',
  previous_workplaces: '', salary_expectation: '', education: '', courses_workshops: '',
  skills_expertise: '', references: '', hobbies: '',
}

type FileField = 'profile_photo' | 'passport' | 'emirates_id' | 'cv'

export default function App() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    profile_photo: null, passport: null, emirates_id: null, cv: null
  })
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const setFile = (field: FileField, file: File | null) => setFiles(f => ({ ...f, [field]: file }))

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage.from('applications').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('applications').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    setUploading(true)
    setError('')
    try {
      const timestamp = Date.now()
      const base = `${timestamp}_${form.first_name}_${form.last_name}`.replace(/\s/g, '_')

      let profile_photo_url = '', passport_url = '', emirates_id_url = '', cv_url = ''

      if (files.profile_photo) profile_photo_url = await uploadFile(files.profile_photo, `${base}/profile.${files.profile_photo.name.split('.').pop()}`)
      if (files.passport) passport_url = await uploadFile(files.passport, `${base}/passport.${files.passport.name.split('.').pop()}`)
      if (files.emirates_id) emirates_id_url = await uploadFile(files.emirates_id, `${base}/eid.${files.emirates_id.name.split('.').pop()}`)
      if (files.cv) cv_url = await uploadFile(files.cv, `${base}/cv.${files.cv.name.split('.').pop()}`)

      const { error } = await supabase.from('applications').insert([{
        ...form,
        profile_photo_url, passport_url, emirates_id_url, cv_url,
        status: 'new'
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (e: any) {
      setError('Something went wrong. Please try again or contact us.')
      console.error(e)
    }
    setUploading(false)
  }

  const TOTAL_STEPS = 10

  const progress = Math.round((step / TOTAL_STEPS) * 100)

  if (submitted) return <SuccessScreen name={form.first_name} />

  return (
    <div className="min-h-screen bg-maine-black flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-maine-gold text-xs tracking-[0.3em] uppercase">The Maine</p>
          <p className="text-white/50 text-xs mt-0.5">Career Application</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs">{step > 0 ? `Step ${step} of ${TOTAL_STEPS}` : ''}</p>
        </div>
      </header>

      {/* Progress bar */}
      {step > 0 && (
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-maine-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-8">
              <div>
                <p className="text-maine-gold tracking-[0.4em] uppercase text-sm mb-4">The Maine</p>
                <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">Join Our Team</h1>
                <p className="text-white/50 mt-4 text-lg leading-relaxed max-w-md mx-auto">
                  We're looking for passionate hospitality professionals to be part of something exceptional.
                </p>
              </div>
              <div className="border border-white/10 rounded-lg p-6 text-left space-y-3">
                <p className="text-white/70 text-sm">Before you begin, have these ready:</p>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-maine-gold flex-shrink-0" />Profile photo</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-maine-gold flex-shrink-0" />Passport copy</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-maine-gold flex-shrink-0" />Emirates ID (if applicable)</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-maine-gold flex-shrink-0" />CV / Resume (PDF preferred)</li>
                </ul>
              </div>
              <button onClick={() => setStep(1)} className="w-full bg-maine-gold text-maine-black font-semibold py-4 rounded-lg hover:bg-maine-gold/90 transition-colors flex items-center justify-center gap-2">
                Start Application <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 1 — Name + Contact */}
          {step === 1 && (
            <StepWrapper title="Personal Information" subtitle="Let's start with the basics.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" value={form.first_name} onChange={v => set('first_name', v)} placeholder="John" />
                <Field label="Last Name *" value={form.last_name} onChange={v => set('last_name', v)} placeholder="Smith" />
              </div>
              <Field label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} placeholder="+971 50 000 0000" type="tel" />
              <Field label="Email Address *" value={form.email} onChange={v => set('email', v)} placeholder="john@email.com" type="email" />
              <Field label="Date of Birth *" value={form.date_of_birth} onChange={v => set('date_of_birth', v)} type="date" />
              <Field label="Nationality *" value={form.nationality} onChange={v => set('nationality', v)} placeholder="e.g. British, Indian, Filipino" />
              <Field label="Current Address *" value={form.current_address} onChange={v => set('current_address', v)} placeholder="City, Country" />
              <Field label="Instagram Handle" value={form.instagram} onChange={v => set('instagram', v)} placeholder="@yourhandle (optional)" />
            </StepWrapper>
          )}

          {/* Step 2 — Position */}
          {step === 2 && (
            <StepWrapper title="Position" subtitle="Which role are you applying for?">
              <div className="grid grid-cols-1 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => set('position_applied', pos)}
                    className={`text-left px-5 py-4 rounded-lg border transition-all ${form.position_applied === pos
                      ? 'border-maine-gold bg-maine-gold/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </StepWrapper>
          )}

          {/* Step 3 — UAE Info */}
          {step === 3 && (
            <StepWrapper title="UAE Information" subtitle="Tell us about your UAE status.">
              <SelectField
                label="UAE Driving License? *"
                value={form.uae_driving_license}
                onChange={v => set('uae_driving_license', v)}
                options={['Yes', 'No']}
              />
              <SelectField
                label="Do you require company accommodation? *"
                value={form.requires_accommodation}
                onChange={v => set('requires_accommodation', v)}
                options={['Yes', 'No']}
              />
              <SelectField
                label="UAE Work Eligibility *"
                value={form.uae_eligibility}
                onChange={v => set('uae_eligibility', v)}
                options={[
                  'Yes – Current company sponsors my visa',
                  'Yes – I have my own visa',
                  'No – I am on Tourist visa',
                  'No – I have never worked in UAE before',
                  'Other',
                ]}
              />
              <SelectField
                label="Joining Availability *"
                value={form.joining_availability}
                onChange={v => set('joining_availability', v)}
                options={['Immediately', '30 Days Notice Period', 'Other']}
              />
            </StepWrapper>
          )}

          {/* Step 4 — Languages */}
          {step === 4 && (
            <StepWrapper title="Languages" subtitle="Rate your English proficiency.">
              <div className="space-y-4">
                {(['Dialog', 'Reading', 'Writing'] as const).map(skill => (
                  <div key={skill}>
                    <p className="text-white/70 text-sm mb-2">English — {skill}</p>
                    <div className="grid grid-cols-5 gap-1">
                      {ENGLISH_LEVELS.map(level => {
                        const field = `english_${skill.toLowerCase()}` as keyof typeof form
                        return (
                          <button
                            key={level}
                            onClick={() => set(field, level)}
                            className={`py-2 px-1 rounded text-xs text-center border transition-all ${form[field] === level
                              ? 'border-maine-gold bg-maine-gold/10 text-white'
                              : 'border-white/10 text-white/40 hover:border-white/30'}`}
                          >
                            {level}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <Field label="Other Languages" value={form.other_languages} onChange={v => set('other_languages', v)} placeholder="e.g. Arabic, French, Spanish" />
              </div>
            </StepWrapper>
          )}

          {/* Step 5 — Professional */}
          {step === 5 && (
            <StepWrapper title="Professional Background" subtitle="Tell us about your experience.">
              <Field label="Current / Last Position *" value={form.current_position} onChange={v => set('current_position', v)} placeholder="e.g. Demi Chef" />
              <Field label="Years of Experience *" value={form.experience_years} onChange={v => set('experience_years', v)} placeholder="e.g. 5" type="number" />
              <Field label="Current / Last Workplace" value={form.current_workplace} onChange={v => set('current_workplace', v)} placeholder="Restaurant name & city" />
              <TextArea
                label="Previous Workplaces"
                value={form.previous_workplaces}
                onChange={v => set('previous_workplaces', v)}
                placeholder="List up to 3 previous workplaces — name, position, location, duration"
                rows={5}
              />
              <Field label="Salary Expectation (AED/month) *" value={form.salary_expectation} onChange={v => set('salary_expectation', v)} placeholder="e.g. 4500" type="number" />
            </StepWrapper>
          )}

          {/* Step 6 — Education & Skills */}
          {step === 6 && (
            <StepWrapper title="Education & Skills" subtitle="Your qualifications and expertise.">
              <Field label="Highest Education Level *" value={form.education} onChange={v => set('education', v)} placeholder="e.g. Culinary Diploma, Bachelor's in Hospitality" />
              <TextArea
                label="Courses & Workshops"
                value={form.courses_workshops}
                onChange={v => set('courses_workshops', v)}
                placeholder="Any relevant training courses or workshops (optional)"
                rows={3}
              />
              <TextArea
                label="Skills & Expertise *"
                value={form.skills_expertise}
                onChange={v => set('skills_expertise', v)}
                placeholder="Describe your skills, specialties, and what makes you stand out..."
                rows={5}
              />
            </StepWrapper>
          )}

          {/* Step 7 — References */}
          {step === 7 && (
            <StepWrapper title="Employment References" subtitle="Provide contact details for two professional references.">
              <TextArea
                label="References"
                value={form.references}
                onChange={v => set('references', v)}
                placeholder={`Reference 1:\nName:\nPosition:\nVenue:\nEmail:\nPhone:\n\nReference 2:\nName:\nPosition:\nVenue:\nEmail:\nPhone:`}
                rows={12}
              />
              <TextArea
                label="Hobbies & Personal Interests"
                value={form.hobbies}
                onChange={v => set('hobbies', v)}
                placeholder="What do you like to do outside of work?"
                rows={3}
              />
            </StepWrapper>
          )}

          {/* Step 8 — Documents */}
          {step === 8 && (
            <StepWrapper title="Documents" subtitle="Upload your documents. All files are securely stored.">
              <FileUpload label="Profile Photo *" field="profile_photo" file={files.profile_photo} onFile={setFile} accept="image/*" />
              <FileUpload label="Passport Copy *" field="passport" file={files.passport} onFile={setFile} accept="image/*,.pdf" />
              <FileUpload label="Emirates ID" field="emirates_id" file={files.emirates_id} onFile={setFile} accept="image/*,.pdf" note="Only if you have a UAE visa" />
              <FileUpload label="CV / Resume *" field="cv" file={files.cv} onFile={setFile} accept=".pdf,.doc,.docx" />
            </StepWrapper>
          )}

          {/* Step 9 — Review */}
          {step === 9 && (
            <StepWrapper title="Review & Submit" subtitle="Please review your application before submitting.">
              <div className="space-y-3">
                {[
                  { label: 'Name', value: `${form.first_name} ${form.last_name}` },
                  { label: 'Email', value: form.email },
                  { label: 'Phone', value: form.phone },
                  { label: 'Nationality', value: form.nationality },
                  { label: 'Position', value: form.position_applied },
                  { label: 'Experience', value: `${form.experience_years} years` },
                  { label: 'Current Role', value: form.current_position },
                  { label: 'Salary Expectation', value: form.salary_expectation ? `AED ${form.salary_expectation}` : '—' },
                  { label: 'Joining', value: form.joining_availability },
                  { label: 'UAE Eligibility', value: form.uae_eligibility },
                  { label: 'Profile Photo', value: files.profile_photo ? '✓ Uploaded' : '✗ Missing' },
                  { label: 'Passport', value: files.passport ? '✓ Uploaded' : '✗ Missing' },
                  { label: 'CV', value: files.cv ? '✓ Uploaded' : '✗ Missing' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40 text-sm">{label}</span>
                    <span className={`text-sm ${value?.startsWith('✗') ? 'text-red-400' : 'text-white'}`}>{value || '—'}</span>
                  </div>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </StepWrapper>
          )}

          {/* Navigation */}
          {step > 0 && (
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white/60 rounded-lg hover:border-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {step < 9 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 bg-maine-gold text-maine-black font-semibold py-3 rounded-lg hover:bg-maine-gold/90 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 bg-maine-gold text-maine-black font-semibold py-3 rounded-lg hover:bg-maine-gold/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ─── Reusable Components ───────────────────────────────────────────────────────

function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-white">{title}</h2>
        <p className="text-white/40 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-maine-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-maine-gold transition-colors text-sm"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-maine-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:border-maine-gold transition-colors text-sm appearance-none"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-maine-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-maine-gold transition-colors text-sm resize-none"
      />
    </div>
  )
}

function FileUpload({ label, field, file, onFile, accept, note }: {
  label: string; field: FileField; file: File | null;
  onFile: (field: FileField, file: File | null) => void; accept: string; note?: string
}) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      {note && <p className="text-white/30 text-xs mb-2">{note}</p>}
      <label className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all ${file ? 'border-maine-gold bg-maine-gold/5' : 'border-white/10 hover:border-white/30'}`}>
        <Upload className={`w-4 h-4 flex-shrink-0 ${file ? 'text-maine-gold' : 'text-white/30'}`} />
        <span className={`text-sm truncate ${file ? 'text-white' : 'text-white/30'}`}>
          {file ? file.name : `Choose file...`}
        </span>
        <input type="file" accept={accept} className="hidden" onChange={e => onFile(field, e.target.files?.[0] ?? null)} />
      </label>
    </div>
  )
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-maine-black flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-maine-gold/10 border border-maine-gold flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-maine-gold" />
        </div>
        <div>
          <p className="text-maine-gold tracking-[0.3em] uppercase text-xs mb-3">Application Received</p>
          <h1 className="font-display text-3xl text-white">Thank you, {name}.</h1>
          <p className="text-white/50 mt-4 leading-relaxed">
            We've received your application and will be in touch if your profile matches our current openings.
          </p>
        </div>
        <p className="text-white/30 text-sm">The Maine Hospitality Group</p>
      </div>
    </div>
  )
}
