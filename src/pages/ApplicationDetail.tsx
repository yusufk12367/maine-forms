import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Application } from '../types'
import { ArrowLeft, Download, Eye, FileText, User, X, ZoomIn, ZoomOut, CheckSquare, Square, AlertCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  shortlisted: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

// Detect file type from URL extension
function getFileType(url?: string): 'image' | 'pdf' | 'word' | 'unknown' {
  if (!url) return 'unknown'
  const ext = url.split('?')[0].toLowerCase().split('.').pop() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  return 'unknown'
}

// Fetch a remote image and convert to base64 data URL
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [includeDocs, setIncludeDocs] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLabel, setPreviewLabel] = useState('')
  const [imgZoom, setImgZoom] = useState(1)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionStorage.getItem('maine_admin')) { navigate('/admin'); return }
    fetchApplication()
  }, [id])

  const fetchApplication = async () => {
    const { data } = await supabase.from('applications').select('*').eq('id', id).single()
    setApp(data)
    setLoading(false)
    if (data?.status === 'new') {
      await supabase.from('applications').update({ status: 'reviewed' }).eq('id', id)
    }
  }

  const updateStatus = async (status: string) => {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApp(a => a ? { ...a, status: status as Application['status'] } : a)
  }

  const openPreview = (url: string, label: string) => {
    setPreviewUrl(url)
    setPreviewLabel(label)
    setImgZoom(1)
  }

  const closePreview = () => {
    setPreviewUrl(null)
    setPreviewLabel('')
  }

  const handleExportPDF = async () => {
    if (!printRef.current || !app) return
    setExporting(true)
    setShowExportModal(false)

    try {
      // 1. Capture the profile page
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#2e2e2e',
        logging: false,
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // Add profile pages (may span multiple A4 pages)
      const profileImgData = canvas.toDataURL('image/png')
      const profileImgH = (canvas.height * pageW) / canvas.width
      let yOffset = 0
      let remaining = profileImgH

      while (remaining > 0) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(profileImgData, 'PNG', 0, -yOffset, pageW, profileImgH)
        yOffset += pageH
        remaining -= pageH
      }

      // 2. If includeDocs, append each image document as its own page
      if (includeDocs) {
        const docs: { label: string; url: string }[] = [
          { label: 'Profile Photo', url: app.profile_photo_url ?? '' },
          { label: 'Passport Copy', url: app.passport_url ?? '' },
          { label: 'Emirates ID', url: app.emirates_id_url ?? '' },
          { label: 'CV / Resume', url: app.cv_url ?? '' },
        ].filter(d => d.url && getFileType(d.url) === 'image')

        for (const doc of docs) {
          try {
            const dataUrl = await urlToDataUrl(doc.url)

            // Create a temp Image to get natural dimensions
            const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              img.onload = () => resolve(img)
              img.onerror = reject
              img.src = dataUrl
            })

            pdf.addPage()

            // Label at top
            pdf.setFontSize(10)
            pdf.setTextColor(180, 150, 80) // gold-ish
            pdf.text(doc.label, 10, 10)

            // Fit image within page (leaving 15mm top for label, 10mm margins)
            const maxW = pageW - 20
            const maxH = pageH - 25
            const ratio = Math.min(maxW / imgEl.naturalWidth, maxH / imgEl.naturalHeight)
            const imgW = imgEl.naturalWidth * ratio
            const imgH = imgEl.naturalHeight * ratio
            const x = (pageW - imgW) / 2
            const y = 15

            pdf.addImage(dataUrl, 'JPEG', x, y, imgW, imgH)
          } catch {
            // If fetching this doc fails, just skip it
          }
        }

        // Note any non-image docs (PDFs, Word) that couldn't be embedded
        const nonImageDocs = [
          { label: 'Profile Photo', url: app.profile_photo_url ?? '' },
          { label: 'Passport Copy', url: app.passport_url ?? '' },
          { label: 'Emirates ID', url: app.emirates_id_url ?? '' },
          { label: 'CV / Resume', url: app.cv_url ?? '' },
        ].filter(d => d.url && getFileType(d.url) !== 'image' && getFileType(d.url) !== 'unknown')

        if (nonImageDocs.length > 0) {
          pdf.addPage()
          pdf.setFontSize(12)
          pdf.setTextColor(180, 150, 80)
          pdf.text('Additional Documents (download separately)', 10, 20)
          pdf.setFontSize(9)
          pdf.setTextColor(180, 180, 180)
          pdf.text('The following documents are in PDF or Word format and cannot be embedded:', 10, 30)
          nonImageDocs.forEach((d, i) => {
            pdf.setTextColor(220, 220, 220)
            pdf.text(`• ${d.label}: ${d.url}`, 10, 42 + i * 10)
          })
        }
      }

      const filename = `${app.first_name}_${app.last_name}_Application${includeDocs ? '_with_docs' : ''}.pdf`
        .replace(/\s+/g, '_')
      pdf.save(filename)
    } catch (err) {
      console.error('PDF export failed:', err)
    }

    setExporting(false)
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

  const DocItem = ({ label, url }: { label: string; url?: string }) => {
    if (!url) {
      return <div className="flex items-center gap-2 text-white/20 text-sm"><FileText className="w-4 h-4 flex-shrink-0" /> {label} — not uploaded</div>
    }

    const type = getFileType(url)

    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className="text-white/60 text-sm truncate">{label}</span>
          <span className="text-white/20 text-xs uppercase tracking-wide flex-shrink-0">
            {url.split('?')[0].split('.').pop()}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openPreview(url, label)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 border border-white/15 rounded-lg hover:border-white/40 hover:text-white transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-maine-gold border border-maine-gold/30 rounded-lg hover:bg-maine-gold/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
        {type === 'word' && (
          <p className="w-full text-xs text-amber-400/70 flex items-center gap-1.5 pl-6">
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> Word documents can't be previewed — use Download to open
          </p>
        )}
      </div>
    )
  }

  // Determine what to show inside the preview modal
  const previewFileType = previewUrl ? getFileType(previewUrl) : 'unknown'

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

        {/* Export PDF Button → opens modal */}
        <button
          onClick={() => setShowExportModal(true)}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 border border-maine-gold/40 text-maine-gold text-sm rounded-lg hover:bg-maine-gold/10 transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>

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

      {/* ─── Printable profile content ─────────────────────────── */}
      <div ref={printRef} className="max-w-4xl mx-auto px-4 py-8 space-y-4">

        {/* Profile Header */}
        <div className="flex items-center gap-6 bg-[#2e2e2e] border border-white/5 rounded-lg p-6">
          {app.profile_photo_url ? (
            <img src={app.profile_photo_url} alt="" className="w-20 h-20 rounded-full object-cover border border-white/10" crossOrigin="anonymous" />
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
          <div className="space-y-4">
            <DocItem label="Profile Photo" url={app.profile_photo_url} />
            <DocItem label="Passport Copy" url={app.passport_url} />
            <DocItem label="Emirates ID" url={app.emirates_id_url} />
            <DocItem label="CV / Resume" url={app.cv_url} />
          </div>
        </Section>
      </div>

      {/* ─── Export Modal ───────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-[#2e2e2e] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-medium text-lg">Export Profile as PDF</h2>
                <p className="text-white/40 text-sm mt-1">{app.first_name} {app.last_name}</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkbox option */}
            <button
              onClick={() => setIncludeDocs(v => !v)}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-white/10 hover:border-white/25 transition-all text-left"
            >
              {includeDocs
                ? <CheckSquare className="w-5 h-5 text-maine-gold flex-shrink-0 mt-0.5" />
                : <Square className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className="text-white text-sm font-medium">Include documents</p>
                <p className="text-white/40 text-xs mt-0.5">Appends passport, photo, Emirates ID and CV (images only — Word/PDF docs are download-only) as extra pages</p>
              </div>
            </button>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 border border-white/15 text-white/60 py-2.5 text-sm rounded-lg hover:border-white/30 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 bg-maine-gold/20 border border-maine-gold/40 text-maine-gold py-2.5 text-sm rounded-lg hover:bg-maine-gold/30 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Preview Modal ─────────────────────────────── */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col" onClick={closePreview}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2e2e2e] flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-maine-gold" />
              <span className="text-white font-medium">{previewLabel}</span>
              <span className="text-white/30 text-xs uppercase tracking-wide">
                {previewUrl.split('?')[0].split('.').pop()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Zoom — only for images */}
              {previewFileType === 'image' && (
                <div className="flex items-center gap-1 border border-white/15 rounded-lg overflow-hidden">
                  <button onClick={e => { e.stopPropagation(); setImgZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2))) }}
                    className="px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white/40 text-xs px-2 min-w-[42px] text-center">{Math.round(imgZoom * 100)}%</span>
                  <button onClick={e => { e.stopPropagation(); setImgZoom(z => Math.min(3, +(z + 0.25).toFixed(2))) }}
                    className="px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}
              <a href={previewUrl} download target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-maine-gold border border-maine-gold/30 rounded-lg hover:bg-maine-gold/10 transition-all">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <button onClick={closePreview} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-6" onClick={e => e.stopPropagation()}>

            {previewFileType === 'image' && (
              <div className="overflow-auto max-w-full">
                <img
                  src={previewUrl}
                  alt={previewLabel}
                  crossOrigin="anonymous"
                  className="rounded-lg shadow-2xl border border-white/10 transition-transform duration-150"
                  style={{
                    transform: `scale(${imgZoom})`,
                    transformOrigin: 'top center',
                    maxWidth: imgZoom <= 1 ? '100%' : 'none',
                    display: 'block',
                  }}
                />
              </div>
            )}

            {previewFileType === 'pdf' && (
              <iframe
                src={previewUrl}
                className="w-full max-w-4xl rounded-lg border border-white/10 shadow-2xl"
                style={{ height: 'calc(100vh - 130px)', minHeight: '500px' }}
                title={previewLabel}
              />
            )}

            {(previewFileType === 'word' || previewFileType === 'unknown') && (
              <div className="flex flex-col items-center justify-center gap-5 mt-20 text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-amber-400/60" />
                </div>
                <div>
                  <p className="text-white text-base font-medium">Can't preview this format</p>
                  <p className="text-white/40 text-sm mt-2 leading-relaxed">
                    Word documents (.doc / .docx) can't be previewed in the browser.<br />
                    Download the file to open it.
                  </p>
                </div>
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-maine-gold border border-maine-gold/40 rounded-lg hover:bg-maine-gold/10 transition-all"
                >
                  <Download className="w-4 h-4" /> Download to open
                </a>
              </div>
            )}

          </div>

          <p className="text-center text-white/20 text-xs py-2 flex-shrink-0">Click outside to close</p>
        </div>
      )}
    </div>
  )
}
