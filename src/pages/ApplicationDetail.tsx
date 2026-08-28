import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Application } from '../types'
import { ArrowLeft, ExternalLink, User } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  shortlisted: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionStorage.getItem('maine_admin')) { navigate('/admin'); return }
    fetchApplication()
  }, [id])

  const fetchApplication = async () => {
    const { data } = await supabase.from('applications').select('*').eq('id', id).single()
    setApp(data)
    setLoading(false)
    // Mark as reviewed
    if (data?.status === 'new') {
      await supabase.from('applications').update({ status: 'reviewed' }).eq('id', id)
    }
  }

  const updateStatus = async (status: string) => {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApp(a => a ? { ...a, status: status as Application['status'] } : a)
  }

  if (loading) return <div className="min-h-screen bg-[#3a3a3a] flex items-center justify-center text-white/30">Loading...</div>
  if (!app) return <div className="min-h-screen bg-[#3a3a3a] flex items-center justify-center text-white/30">Not found.</div>

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#2e2e2e] border border-white/5 rounded-lg p-6 space-y-4">
      <h3 className="text-maine-gold text-xs tracking-[0.2em] uppercase">{title}</h3>
      {children}
    </div>
  )

  const Row = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
      <div className="flex gap-4">
        <span className="text-white/30 text-sm w-36 flex-shrink-0">{label}</span>
        <span className="text-white text-sm flex-1">{value}</span>
      </div>
    ) : null
  )

  const DocLink = ({ label, url }: { label: string; url?: string }) => (
    url ? (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-maine-gold text-sm hover:text-maine-gold/70 transition-colors">
        <ExternalLink className="w-4 h-4" /> {label}
      </a>
    ) : <span className="text-white/20 text-sm">{label} — not uploaded</span>
  )

  return (
    <div className="min-h-screen bg-[#3a3a3a]">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-maine-gold text-xs tracking-[0.3em] uppercase">Application</p>
          <h1 className="text-white font-display text-xl">{app.first_name} {app.last_name}</h1>
        </div>
        <select
          value={app.status || 'new'}
          onChange={e => updateStatus(e.target.value)}
          className={`text-xs px-4 py-2 rounded-full border bg-transparent cursor-pointer ${STATUS_COLORS[app.status || 'new']}`}
        >
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Profile */}
        <div className="flex items-center gap-6 bg-[#2e2e2e] border border-white/5 rounded-lg p-6">
          {app.profile_photo_url ? (
            <img src={app.profile_photo_url} alt="" className="w-20 h-20 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#333333] border border-white/10 flex items-center justify-center">
              <User className="w-8 h-8 text-white/20" />
            </div>
          )}
          <div>
            <h2 className="text-white text-2xl font-display">{app.first_name} {app.last_name}</h2>
            <p className="text-maine-gold">{app.position_applied}</p>
            <p className="text-white/40 text-sm mt-1">{app.email} · {app.phone}</p>
            <p className="text-white/30 text-xs mt-1">Applied {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Personal">
            <Row label="Date of Birth" value={app.date_of_birth} />
            <Row label="Nationality" value={app.nationality} />
            <Row label="Address" value={app.current_address} />
            <Row label="Instagram" value={app.instagram} />
          </Section>

          <Section title="UAE Status">
            <Row label="Driving License" value={app.uae_driving_license} />
            <Row label="Accommodation" value={app.requires_accommodation} />
            <Row label="UAE Eligibility" value={app.uae_eligibility} />
            <Row label="Joining" value={app.joining_availability} />
          </Section>

          <Section title="Professional">
            <Row label="Current Position" value={app.current_position} />
            <Row label="Experience" value={app.experience_years ? `${app.experience_years} years` : undefined} />
            <Row label="Current Workplace" value={app.current_workplace} />
            <Row label="Salary Expectation" value={app.salary_expectation ? `AED ${app.salary_expectation}/month` : undefined} />
            <Row label="Education" value={app.education} />
          </Section>

          <Section title="Languages">
            <Row label="English (Dialog)" value={app.english_dialog} />
            <Row label="English (Reading)" value={app.english_reading} />
            <Row label="English (Writing)" value={app.english_writing} />
            <Row label="Other Languages" value={app.other_languages} />
          </Section>
        </div>

        {app.previous_workplaces && (
          <Section title="Previous Workplaces">
            <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">{app.previous_workplaces}</pre>
          </Section>
        )}

        {app.skills_expertise && (
          <Section title="Skills & Expertise">
            <p className="text-white/70 text-sm leading-relaxed">{app.skills_expertise}</p>
          </Section>
        )}

        {app.courses_workshops && (
          <Section title="Courses & Workshops">
            <p className="text-white/70 text-sm leading-relaxed">{app.courses_workshops}</p>
          </Section>
        )}

        {app.employment_references && (
          <Section title="Employment References">
            <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">{app.employment_references}</pre>
          </Section>
        )}

        {app.hobbies && (
          <Section title="Hobbies & Interests">
            <p className="text-white/70 text-sm leading-relaxed">{app.hobbies}</p>
          </Section>
        )}

        <Section title="Documents">
          <div className="space-y-3">
            <DocLink label="Profile Photo" url={app.profile_photo_url} />
            <DocLink label="Passport Copy" url={app.passport_url} />
            <DocLink label="Emirates ID" url={app.emirates_id_url} />
            <DocLink label="CV / Resume" url={app.cv_url} />
          </div>
        </Section>

      </div>
    </div>
  )
}
