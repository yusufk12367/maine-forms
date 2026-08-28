import { useState } from 'react'
import { supabase } from './lib/supabase'
import type { Application } from './types'
import { CheckCircle, Upload, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'

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

const VENUE_IMAGES = [
  { src: 'https://themainegroup.com/wp-content/uploads/2023/01/The-Maine-Land-Brasserie-Dubai-1.jpg', label: 'THE MAINE\nLand Brasserie', sub: 'BUSINESS BAY · DUBAI' },
  { src: 'https://themainegroup.com/wp-content/uploads/2022/12/The-Maine-Oyster-Bar-Grill-Dubai.jpg', label: 'THE MAINE\nOyster Bar & Grill', sub: 'JBR · DUBAI' },
  { src: 'https://themainegroup.com/wp-content/uploads/2023/01/The-Maine-Street-Eatery-Dubai.jpg', label: 'THE MAINE\nStreet Eatery', sub: 'STUDIO CITY · DUBAI' },
  { src: 'https://themainegroup.com/wp-content/uploads/2022/12/The-Maine-Mayfair-London.jpg', label: 'THE MAINE\nMayfair', sub: 'MAYFAIR · LONDON' },
  { src: 'https://themainegroup.com/wp-content/uploads/2022/12/The-Maine-Ibiza.jpg', label: 'THE MAINE\nIbiza', sub: 'SALINAS · IBIZA' },
]

type FileField = 'profile_photo' | 'passport' | 'emirates_id' | 'cv'

const emptyForm: Omit<Application, 'id' | 'created_at' | 'status'> = {
  first_name: '', last_name: '', phone: '', email: '', date_of_birth: '',
  nationality: '', current_address: '', instagram: '',
  profile_photo_url: '', passport_url: '', emirates_id_url: '', cv_url: '',
  uae_driving_license: '', requires_accommodation: '', uae_eligibility: '', joining_availability: '',
  english_dialog: '', english_reading: '', english_writing: '', other_languages: '',
  position_applied: '', current_position: '', experience_years: '', current_workplace: '',
  previous_workplaces: '', salary_expectation: '', education: '', courses_workshops: '',
  skills_expertise: '', employment_references: '', hobbies: '',
}

export default function App() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    profile_photo: null, passport: null, emirates_id: null, cv: null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const setFile = (field: FileField, file: File | null) => setFiles(f => ({ ...f, [field]: file }))

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!form.first_name.trim()) e.first_name = 'First name is required'
      if (!form.last_name.trim()) e.last_name = 'Last name is required'
      if (!form.phone.trim()) e.phone = 'Phone number is required'
      else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(form.phone)) e.phone = 'Enter only numbers'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address (eg: yourname@domain.com)'
      if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required'
      if (!form.nationality.trim()) e.nationality = 'Nationality is required'
      if (!form.current_address.trim()) e.current_address = 'Current address is required'
    }
    if (s === 2) {
      if (!form.position_applied) e.position_applied = 'Please select a position'
    }
    if (s === 3) {
      if (!form.uae_driving_license) e.uae_driving_license = 'Please select an option'
      if (!form.requires_accommodation) e.requires_accommodation = 'Please select an option'
      if (!form.uae_eligibility) e.uae_eligibility = 'Please select an option'
      if (!form.joining_availability) e.joining_availability = 'Please select an option'
    }
    if (s === 4) {
      if (!form.english_dialog) e.english_dialog = 'Please rate your dialog level'
      if (!form.english_reading) e.english_reading = 'Please rate your reading level'
      if (!form.english_writing) e.english_writing = 'Please rate your writing level'
    }
    if (s === 5) {
      if (!form.current_position.trim()) e.current_position = 'Current position is required'
      if (!form.experience_years.trim()) e.experience_years = 'Experience years is required'
      else if (!/^\d+$/.test(form.experience_years.trim())) e.experience_years = 'Enter only numbers'
      if (!form.salary_expectation.trim()) e.salary_expectation = 'Salary expectation is required'
      else if (!/^\d+$/.test(form.salary_expectation.trim())) e.salary_expectation = 'Enter only numbers'
    }
    if (s === 6) {
      if (!form.education.trim()) e.education = 'Education level is required'
      if (!form.skills_expertise.trim()) e.skills_expertise = 'Skills & expertise is required'
    }
    if (s === 8) {
      if (!files.profile_photo) e.profile_photo = 'Profile photo is required'
      if (!files.passport) e.passport = 'Passport copy is required'
      if (!files.cv) e.cv = 'CV is required'
    }
    return e
  }

  const next = () => {
    const e = validate(step)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage.from('applications').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('applications').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    const e = validate(8)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setUploading(true)
    setSubmitError('')
    try {
      const ts = Date.now()
      const base = `${ts}_${form.first_name}_${form.last_name}`.replace(/\s/g, '_')
      let profile_photo_url = '', passport_url = '', emirates_id_url = '', cv_url = ''
      if (files.profile_photo) profile_photo_url = await uploadFile(files.profile_photo, `${base}/profile.${files.profile_photo.name.split('.').pop()}`)
      if (files.passport) passport_url = await uploadFile(files.passport, `${base}/passport.${files.passport.name.split('.').pop()}`)
      if (files.emirates_id) emirates_id_url = await uploadFile(files.emirates_id, `${base}/eid.${files.emirates_id.name.split('.').pop()}`)
      if (files.cv) cv_url = await uploadFile(files.cv, `${base}/cv.${files.cv.name.split('.').pop()}`)
      const { error } = await supabase.from('applications').insert([{ ...form, profile_photo_url, passport_url, emirates_id_url, cv_url, status: 'new' }])
      if (error) throw error
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError('Something went wrong. Please try again.')
      console.error(err)
    }
    setUploading(false)
  }

  const TOTAL_STEPS = 9
  const progress = Math.round((step / TOTAL_STEPS) * 100)

  if (submitted) return <SuccessScreen name={form.first_name} />

  return (
    <div className="min-h-screen bg-[#3a3a3a] text-white">

      {/* Step 0 — Landing */}
      {step === 0 && (
        <div className="min-h-screen flex flex-col">
          {/* Photo Grid */}
          <div className="w-full">
            <div className="flex h-48 sm:h-64 md:h-72 overflow-hidden">
              {VENUE_IMAGES.map((img, i) => (
                <div key={i} className="relative flex-1 overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.background = '#2a2a2a' }}
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute bottom-3 left-0 right-0 text-center px-1">
                    {img.label.split('\n').map((line, li) => (
                      <p key={li} className={`text-white ${li === 0 ? 'text-[8px] sm:text-[10px] tracking-widest font-light' : 'text-[7px] sm:text-[9px] tracking-wider italic'}`}>{line}</p>
                    ))}
                    <p className="text-white/60 text-[6px] sm:text-[8px] tracking-widest mt-0.5">{img.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-between py-12 px-4">
            <div className="text-center max-w-2xl space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-light tracking-wide">The MAINE Group Careers</h1>
                <h2 className="text-xl sm:text-2xl font-light tracking-widest uppercase mt-1">JOB APPLICATION FORM</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base text-white/80 leading-relaxed font-light">
                <p>The heart and soul of our company are our people, and as our company expands, so do the opportunities. Do you have a passion for people? Do you know what it means to serve with soul? Can you handle working in a high octane environment?</p>
                <p>Start your Application here, if you want to become part of The Maine Group,<br className="hidden sm:block" /> One of the best restaurant groups based in DUBAI.</p>
                <p>We are currently hiring for multiple positions,<br className="hidden sm:block" /> please follow the instructions to submit your application.</p>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-10 border border-white/60 text-white px-12 py-4 text-sm tracking-[0.3em] uppercase hover:bg-white hover:text-[#3a3a3a] transition-all duration-300 flex items-center gap-3"
            >
              APPLY HERE <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Steps 1–9 */}
      {step > 0 && (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs tracking-[0.3em] uppercase">The MAINE Group</p>
              <p className="text-white text-sm tracking-wider font-light mt-0.5">Job Application</p>
            </div>
            <p className="text-white/30 text-xs">{step} / {TOTAL_STEPS}</p>
          </header>

          {/* Progress */}
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-white/60 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <main className="flex-1 flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-lg">

              {step === 1 && (
                <Step title="Personal Information" subtitle="Let's start with the basics.">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name *" value={form.first_name} onChange={v => set('first_name', v)} placeholder="John" error={errors.first_name} />
                    <Field label="Last Name *" value={form.last_name} onChange={v => set('last_name', v)} placeholder="Smith" error={errors.last_name} />
                  </div>
                  <Field label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} placeholder="+971 50 000 0000" type="tel" error={errors.phone} />
                  <Field label="Email Address *" value={form.email} onChange={v => set('email', v)} placeholder="yourname@domain.com" type="email" error={errors.email} />
                  <Field label="Date of Birth *" value={form.date_of_birth} onChange={v => set('date_of_birth', v)} type="date" error={errors.date_of_birth} />
                  <Field label="Nationality *" value={form.nationality} onChange={v => set('nationality', v)} placeholder="e.g. British, Indian, Filipino" error={errors.nationality} />
                  <Field label="Current Address *" value={form.current_address} onChange={v => set('current_address', v)} placeholder="City, Country" error={errors.current_address} />
                  <Field label="Instagram Handle" value={form.instagram} onChange={v => set('instagram', v)} placeholder="@yourhandle (optional)" />
                </Step>
              )}

              {step === 2 && (
                <Step title="Position Applied For" subtitle="Which role are you applying for?">
                  {errors.position_applied && <p className="text-red-400 text-sm">{errors.position_applied}</p>}
                  <div className="grid grid-cols-1 gap-2">
                    {POSITIONS.map(pos => (
                      <button key={pos} onClick={() => set('position_applied', pos)}
                        className={`text-left px-5 py-3.5 border text-sm transition-all font-light tracking-wide ${form.position_applied === pos ? 'border-white bg-white/10 text-white' : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'}`}>
                        {pos}
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step title="UAE Information" subtitle="Tell us about your UAE status.">
                  <Select label="UAE Driving License? *" value={form.uae_driving_license} onChange={v => set('uae_driving_license', v)} options={['Yes', 'No']} error={errors.uae_driving_license} />
                  <Select label="Do you require company accommodation? *" value={form.requires_accommodation} onChange={v => set('requires_accommodation', v)} options={['Yes', 'No']} error={errors.requires_accommodation} />
                  <Select label="UAE Work Eligibility *" value={form.uae_eligibility} onChange={v => set('uae_eligibility', v)} error={errors.uae_eligibility}
                    options={['Yes – Current company sponsors my visa', 'Yes – I have my own visa', 'No – I am on Tourist visa', 'No – I have never worked in UAE before', 'Other']} />
                  <Select label="Joining Availability *" value={form.joining_availability} onChange={v => set('joining_availability', v)} options={['Immediately', '30 Days Notice Period', 'Other']} error={errors.joining_availability} />
                </Step>
              )}

              {step === 4 && (
                <Step title="Languages" subtitle="Rate your English proficiency.">
                  {(['Dialog', 'Reading', 'Writing'] as const).map(skill => {
                    const field = `english_${skill.toLowerCase()}`
                    return (
                      <div key={skill}>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">English — {skill}</p>
                        <div className="grid grid-cols-5 gap-1.5 mb-1">
                          {ENGLISH_LEVELS.map(level => (
                            <button key={level} onClick={() => set(field, level)}
                              className={`py-2 rounded text-xs text-center border transition-all font-light ${(form as any)[field] === level ? 'border-white bg-white/10 text-white' : 'border-white/15 text-white/40 hover:border-white/40'}`}>
                              {level}
                            </button>
                          ))}
                        </div>
                        {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}
                      </div>
                    )
                  })}
                  <Field label="Other Languages" value={form.other_languages} onChange={v => set('other_languages', v)} placeholder="e.g. Arabic, French, Spanish" />
                </Step>
              )}

              {step === 5 && (
                <Step title="Professional Background" subtitle="Tell us about your experience.">
                  <Field label="Current / Last Position *" value={form.current_position} onChange={v => set('current_position', v)} placeholder="e.g. Demi Chef" error={errors.current_position} />
                  <Field label="Years of Experience *" value={form.experience_years} onChange={v => set('experience_years', v)} placeholder="e.g. 5" type="number" error={errors.experience_years} />
                  <Field label="Current / Last Workplace" value={form.current_workplace} onChange={v => set('current_workplace', v)} placeholder="Restaurant name & city" />
                  <TextArea label="Previous Workplaces" value={form.previous_workplaces} onChange={v => set('previous_workplaces', v)}
                    placeholder={"List up to 3 previous workplaces:\nName | Position | Location | Duration"} rows={5} />
                  <Field label="Salary Expectation (AED/month) *" value={form.salary_expectation} onChange={v => set('salary_expectation', v)} placeholder="e.g. 4500" type="number" error={errors.salary_expectation} />
                </Step>
              )}

              {step === 6 && (
                <Step title="Education & Skills" subtitle="Your qualifications and expertise.">
                  <Field label="Highest Education Level *" value={form.education} onChange={v => set('education', v)} placeholder="e.g. Culinary Diploma, Bachelor's in Hospitality" error={errors.education} />
                  <TextArea label="Courses & Workshops" value={form.courses_workshops} onChange={v => set('courses_workshops', v)} placeholder="Any relevant training (optional)" rows={3} />
                  <TextArea label="Skills & Expertise *" value={form.skills_expertise} onChange={v => set('skills_expertise', v)}
                    placeholder="Describe your skills, specialties, and what makes you stand out..." rows={5} error={errors.skills_expertise} />
                </Step>
              )}

              {step === 7 && (
                <Step title="References & Interests" subtitle="Two professional references and a bit about you.">
                  <TextArea label="Employment References" value={form.employment_references} onChange={v => set('employment_references', v)}
                    placeholder={"Reference 1:\nName:\nPosition:\nVenue:\nEmail:\nPhone:\n\nReference 2:\nName:\nPosition:\nVenue:\nEmail:\nPhone:"} rows={12} />
                  <TextArea label="Hobbies & Personal Interests" value={form.hobbies} onChange={v => set('hobbies', v)} placeholder="What do you like to do outside of work?" rows={3} />
                </Step>
              )}

              {step === 8 && (
                <Step title="Documents" subtitle="Upload your documents. All files are securely stored.">
                  <FileUpload label="Profile Photo *" field="profile_photo" file={files.profile_photo} onFile={setFile} accept="image/*" error={errors.profile_photo} />
                  <FileUpload label="Passport Copy *" field="passport" file={files.passport} onFile={setFile} accept="image/*,.pdf" error={errors.passport} />
                  <FileUpload label="Emirates ID" field="emirates_id" file={files.emirates_id} onFile={setFile} accept="image/*,.pdf" note="Only if you have a UAE visa" />
                  <FileUpload label="CV / Resume *" field="cv" file={files.cv} onFile={setFile} accept=".pdf,.doc,.docx" error={errors.cv} />
                </Step>
              )}

              {step === 9 && (
                <Step title="Review & Submit" subtitle="Please review before submitting.">
                  <div className="space-y-0 border border-white/10 rounded">
                    {[
                      ['Name', `${form.first_name} ${form.last_name}`],
                      ['Email', form.email],
                      ['Phone', form.phone],
                      ['Nationality', form.nationality],
                      ['Position', form.position_applied],
                      ['Experience', `${form.experience_years} years`],
                      ['Salary', form.salary_expectation ? `AED ${form.salary_expectation}/month` : '—'],
                      ['Joining', form.joining_availability],
                      ['UAE Status', form.uae_eligibility],
                      ['Profile Photo', files.profile_photo ? '✓ Uploaded' : '✗ Missing'],
                      ['Passport', files.passport ? '✓ Uploaded' : '✗ Missing'],
                      ['CV', files.cv ? '✓ Uploaded' : '✗ Missing'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between px-4 py-3 border-b border-white/5 last:border-0">
                        <span className="text-white/40 text-sm">{label}</span>
                        <span className={`text-sm font-light ${String(value).startsWith('✗') ? 'text-red-400' : 'text-white'}`}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  {submitError && <p className="text-red-400 text-sm mt-4">{submitError}</p>}
                </Step>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-3 border border-white/20 text-white/50 text-sm hover:border-white/50 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                {step < 9 ? (
                  <button onClick={next}
                    className="flex-1 border border-white/60 text-white py-3 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-[#3a3a3a] transition-all duration-300 flex items-center justify-center gap-2 font-light">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={uploading}
                    className="flex-1 border border-white/60 text-white py-3 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-[#3a3a3a] transition-all duration-300 disabled:opacity-40 font-light">
                    {uploading ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>

            </div>
          </main>
        </div>
      )}
    </div>
  )
}

// ─── Components ────────────────────────────────────────────────────────────────

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="pb-2 border-b border-white/10">
        <h2 className="text-xl font-light tracking-wide">{title}</h2>
        <p className="text-white/40 text-sm mt-1 font-light">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-transparent border rounded-none px-4 py-3 text-white placeholder-white/20 text-sm font-light transition-colors focus:border-white/60 ${error ? 'border-red-400/60' : 'border-white/20'}`} />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options, error }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full bg-[#3a3a3a] border px-4 py-3 text-white text-sm font-light appearance-none transition-colors focus:border-white/60 ${error ? 'border-red-400/60' : 'border-white/20'}`}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 4, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={`w-full bg-transparent border px-4 py-3 text-white placeholder-white/20 text-sm font-light resize-none transition-colors focus:border-white/60 ${error ? 'border-red-400/60' : 'border-white/20'}`} />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function FileUpload({ label, field, file, onFile, accept, note, error }: {
  label: string; field: FileField; file: File | null;
  onFile: (f: FileField, file: File | null) => void; accept: string; note?: string; error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">{label}</label>
      {note && <p className="text-white/30 text-xs mb-2">{note}</p>}
      <label className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-all ${file ? 'border-white/60 bg-white/5' : error ? 'border-red-400/60' : 'border-white/20 hover:border-white/40'}`}>
        <Upload className={`w-4 h-4 flex-shrink-0 ${file ? 'text-white' : 'text-white/30'}`} />
        <span className={`text-sm font-light truncate ${file ? 'text-white' : 'text-white/30'}`}>{file ? file.name : 'Choose file...'}</span>
        <input type="file" accept={accept} className="hidden" onChange={e => onFile(field, e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-[#3a3a3a] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="w-12 h-12 text-white/60 mx-auto" />
        <div>
          <p className="text-white/40 tracking-[0.4em] uppercase text-xs mb-4">Application Received</p>
          <h1 className="text-3xl font-light tracking-wide">Thank you, {name}.</h1>
          <p className="text-white/50 mt-4 leading-relaxed font-light text-sm">
            We've received your application and will be in touch if your profile matches our current openings.
          </p>
        </div>
        <p className="text-white/20 text-xs tracking-widest uppercase">The Maine Group · Dubai</p>
      </div>
    </div>
  )
}
