import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Upload } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FileField = 'passport_image' | 'eid_front' | 'eid_back'

interface StaffInfoData {
  full_name: string
  date_of_birth: string
  phone_number: string
  whatsapp_number: string
  joining_date: string
  nationality: string
  passport_number: string
  passport_expiry: string
  emirates_id_number: string
  eid_expiry: string
}

const emptyForm: StaffInfoData = {
  full_name: '',
  date_of_birth: '',
  phone_number: '',
  whatsapp_number: '',
  joining_date: '',
  nationality: '',
  passport_number: '',
  passport_expiry: '',
  emirates_id_number: '',
  eid_expiry: '',
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function StaffInfoForm() {
  const [form, setForm] = useState<StaffInfoData>(emptyForm)
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    passport_image: null,
    eid_front: null,
    eid_back: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(false)

  const set = (field: keyof StaffInfoData, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const setFile = (field: FileField, file: File | null) => {
    setFiles(f => ({ ...f, [field]: file }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const handleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked)
    if (checked) {
      set('whatsapp_number', form.phone_number)
    } else {
      set('whatsapp_number', '')
    }
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required'
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required'
    else if (!/^[\d\s+\-()]{7,20}$/.test(form.phone_number)) e.phone_number = 'Enter a valid phone number'
    if (!form.whatsapp_number.trim()) e.whatsapp_number = 'WhatsApp number is required'
    else if (!/^[\d\s+\-()]{7,20}$/.test(form.whatsapp_number)) e.whatsapp_number = 'Enter a valid WhatsApp number'
    if (!form.joining_date) e.joining_date = 'Joining date is required'
    if (!form.nationality.trim()) e.nationality = 'Nationality is required'
    if (!form.passport_number.trim()) e.passport_number = 'Passport number is required'
    if (!form.passport_expiry) e.passport_expiry = 'Passport expiry date is required'
    if (!files.passport_image) e.passport_image = 'Passport image is required'
    if (!form.emirates_id_number.trim()) e.emirates_id_number = 'Emirates ID number is required'
    if (!form.eid_expiry) e.eid_expiry = 'Emirates ID expiry date is required'
    if (!files.eid_front) e.eid_front = 'Emirates ID front image is required'
    if (!files.eid_back) e.eid_back = 'Emirates ID back image is required'
    return e
  }

  // Convert image files (incl. iPhone HEIC) to web-safe JPEG
  const toUploadable = async (file: File): Promise<{ blob: Blob; ext: string }> => {
    const isImage = file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|bmp)$/i.test(file.name)
    if (!isImage) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      return { blob: file, ext }
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = () => reject(new Error('read failed'))
        fr.readAsDataURL(file)
      })
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image()
        im.onload = () => resolve(im)
        im.onerror = () => reject(new Error('decode failed'))
        im.src = dataUrl
      })
      const MAX = 1600
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85))
      if (blob) return { blob, ext: 'jpg' }
    } catch {
      // fall back to original
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    return { blob: file, ext }
  }

  const uploadFile = async (file: File, pathBase: string): Promise<string> => {
    const { blob, ext } = await toUploadable(file)
    const path = `${pathBase}.${ext}`
    const contentType = ext === 'jpg' ? 'image/jpeg' : (file.type || undefined)
    const { error } = await supabase.storage
      .from('staff-info')
      .upload(path, blob, { upsert: true, contentType })
    if (error) throw error
    const { data } = supabase.storage.from('staff-info').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setUploading(true)
    setSubmitError('')
    try {
      const ts = Date.now()
      const base = `${ts}_${form.full_name.replace(/\s/g, '_')}`

      const passport_image_url = await uploadFile(files.passport_image!, `${base}/passport`)
      const eid_front_url = await uploadFile(files.eid_front!, `${base}/eid_front`)
      const eid_back_url = await uploadFile(files.eid_back!, `${base}/eid_back`)

      const { error } = await supabase.from('staff_info').insert([{
        ...form,
        passport_image_url,
        eid_front_url,
        eid_back_url,
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (err: unknown) {
      const reason =
        err instanceof Error
          ? err.message
          : (err as { error_description?: string })?.error_description ?? 'Unknown error'
      setSubmitError(`Submission failed: ${reason}. Please try again.`)
      console.error('Staff info submit failed:', err)
    }
    setUploading(false)
  }

  if (submitted) return <SuccessScreen name={form.full_name} />

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-5 py-5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs tracking-[0.35em] uppercase font-light">Orilla Restaurant</p>
          <p className="text-white text-sm tracking-wider font-light mt-0.5">Staff Information Form</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-white/40 text-xs">O</span>
        </div>
      </header>

      <main className="px-4 py-8 max-w-lg mx-auto">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">Employee Information</h1>
          <p className="text-white/40 text-sm font-light leading-relaxed">
            Please complete this form to submit your essential contact and identity verification
            details for internal records. All fields are required.
          </p>
          <p className="text-white/25 text-xs font-light mt-3 leading-relaxed">
            The name and details you provide will be securely stored for HR purposes only.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Section: Personal Details ── */}
          <SectionHeading title="Personal Details" />

          <Field
            label="Full Name"
            value={form.full_name}
            onChange={v => set('full_name', v)}
            placeholder="As it appears on your passport"
            error={errors.full_name}
          />

          <Field
            label="Date of Birth"
            value={form.date_of_birth}
            onChange={v => set('date_of_birth', v)}
            type="date"
            error={errors.date_of_birth}
          />

          <Field
            label="Nationality"
            value={form.nationality}
            onChange={v => set('nationality', v)}
            placeholder="e.g. Indian, Filipino, British"
            error={errors.nationality}
          />

          <Field
            label="Joining Date"
            value={form.joining_date}
            onChange={v => set('joining_date', v)}
            type="date"
            error={errors.joining_date}
          />

          {/* ── Section: Contact ── */}
          <SectionHeading title="Contact Numbers" />

          <Field
            label="Phone Number"
            value={form.phone_number}
            onChange={v => {
              set('phone_number', v)
              if (sameAsPhone) set('whatsapp_number', v)
            }}
            placeholder="+971 50 000 0000"
            type="tel"
            error={errors.phone_number}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/50 text-xs uppercase tracking-wider font-light">
                WhatsApp Number
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={e => handleSameAsPhone(e.target.checked)}
                  className="accent-white w-3.5 h-3.5"
                />
                <span className="text-white/30 text-xs font-light">Same as phone</span>
              </label>
            </div>
            <input
              type="tel"
              value={form.whatsapp_number}
              onChange={e => {
                setSameAsPhone(false)
                set('whatsapp_number', e.target.value)
              }}
              placeholder="+971 50 000 0000"
              disabled={sameAsPhone}
              className={`w-full bg-transparent border rounded-none px-4 py-3 text-white placeholder-white/20 text-sm font-light transition-colors focus:border-white/60 focus:outline-none disabled:opacity-40 ${errors.whatsapp_number ? 'border-red-400/60' : 'border-white/20'}`}
            />
            {errors.whatsapp_number && (
              <p className="text-red-400 text-xs mt-1.5">{errors.whatsapp_number}</p>
            )}
          </div>

          {/* ── Section: Passport ── */}
          <SectionHeading title="Passport" />

          <Field
            label="Passport Number"
            value={form.passport_number}
            onChange={v => set('passport_number', v)}
            placeholder="e.g. A1234567"
            error={errors.passport_number}
          />

          <Field
            label="Passport Expiry Date"
            value={form.passport_expiry}
            onChange={v => set('passport_expiry', v)}
            type="date"
            error={errors.passport_expiry}
          />

          <FileUpload
            label="Passport Image"
            field="passport_image"
            file={files.passport_image}
            onFile={setFile}
            accept="image/*,.heic,.heif,.pdf"
            note="Photo/scan of the data page"
            error={errors.passport_image}
          />

          {/* ── Section: Emirates ID ── */}
          <SectionHeading title="Emirates ID" />

          <Field
            label="Emirates ID Number"
            value={form.emirates_id_number}
            onChange={v => set('emirates_id_number', v)}
            placeholder="784-XXXX-XXXXXXX-X"
            error={errors.emirates_id_number}
          />

          <Field
            label="Emirates ID Expiry Date"
            value={form.eid_expiry}
            onChange={v => set('eid_expiry', v)}
            type="date"
            error={errors.eid_expiry}
          />

          <FileUpload
            label="Emirates ID — Front"
            field="eid_front"
            file={files.eid_front}
            onFile={setFile}
            accept="image/*,.heic,.heif"
            error={errors.eid_front}
          />

          <FileUpload
            label="Emirates ID — Back"
            field="eid_back"
            file={files.eid_back}
            onFile={setFile}
            accept="image/*,.heic,.heif"
            error={errors.eid_back}
          />

          {/* Submit Error */}
          {submitError && (
            <div className="border border-red-400/30 bg-red-400/5 px-4 py-3">
              <p className="text-red-400 text-sm font-light">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full border border-white/50 text-white py-4 text-sm tracking-[0.25em] uppercase hover:bg-white hover:text-[#1a1a1a] transition-all duration-300 disabled:opacity-40 font-light mt-4"
          >
            {uploading ? 'Uploading & Submitting...' : 'Submit Details'}
          </button>

          <p className="text-white/20 text-xs text-center font-light pb-8">
            Orilla Restaurant FZE · Hotel Local, JVT, Dubai
          </p>

        </div>
      </main>
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="pt-2 border-t border-white/8">
      <p className="text-white/60 text-xs tracking-[0.3em] uppercase font-light">{title}</p>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent border rounded-none px-4 py-3 text-white placeholder-white/20 text-sm font-light transition-colors focus:border-white/60 focus:outline-none ${error ? 'border-red-400/60' : 'border-white/20'}`}
      />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function FileUpload({
  label, field, file, onFile, accept, note, error,
}: {
  label: string
  field: FileField
  file: File | null
  onFile: (f: FileField, file: File | null) => void
  accept: string
  note?: string
  error?: string
}) {
  return (
    <div>
      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5 font-light">
        {label}
      </label>
      {note && <p className="text-white/30 text-xs mb-2">{note}</p>}
      <label
        className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-all ${
          file
            ? 'border-white/60 bg-white/5'
            : error
            ? 'border-red-400/60'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        <Upload className={`w-4 h-4 flex-shrink-0 ${file ? 'text-white' : 'text-white/30'}`} />
        <span className={`text-sm font-light truncate ${file ? 'text-white' : 'text-white/30'}`}>
          {file ? file.name : 'Choose file...'}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => onFile(field, e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <CheckCircle className="w-12 h-12 text-white/50 mx-auto" />
        <div>
          <p className="text-white/30 tracking-[0.4em] uppercase text-xs mb-4">Submitted</p>
          <h1 className="text-2xl font-light tracking-wide">Thank you, {name.split(' ')[0]}.</h1>
          <p className="text-white/40 mt-4 leading-relaxed font-light text-sm">
            Your information has been received and securely stored in our HR records.
          </p>
        </div>
        <p className="text-white/20 text-xs tracking-widest uppercase">Orilla Restaurant · Dubai</p>
      </div>
    </div>
  )
}
