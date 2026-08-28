import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Application } from '../types'
import { LogOut, RefreshCw, User, ChevronRight, Search, Trash2, X } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  shortlisted: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('maine_admin')) {
      navigate('/admin')
      return
    }
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: status as Application['status'] } : a))
  }

  const confirmDelete = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(app)
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      // Delete the DB row
      await supabase.from('applications').delete().eq('id', deleteTarget.id)
      setApplications(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
    }
    setDeleting(false)
  }

  const filtered = applications.filter(a => {
    const matchSearch = search === '' ||
      `${a.first_name} ${a.last_name} ${a.email} ${a.position_applied} ${a.nationality}`
        .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: applications.length,
    new: applications.filter(a => a.status === 'new').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-[#3a3a3a]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-maine-gold text-xs tracking-[0.3em] uppercase">The Maine</p>
          <h1 className="text-white font-display text-xl mt-0.5">Applications</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchApplications} className="p-2 text-white/40 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('maine_admin'); navigate('/admin') }}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {(['all', 'new', 'reviewed', 'shortlisted', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg p-4 border text-center transition-all ${filterStatus === s ? 'border-maine-gold bg-maine-gold/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <p className="text-2xl font-bold text-white">{counts[s]}</p>
              <p className="text-white/40 text-xs capitalize mt-1">{s}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, position..."
            className="w-full bg-[#2e2e2e] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 focus:border-maine-gold transition-colors text-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">No applications found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => (
              <div
                key={app.id}
                onClick={() => navigate(`/admin/application/${app.id}`)}
                className="flex items-center gap-4 bg-[#2e2e2e] border border-white/5 rounded-lg px-5 py-4 cursor-pointer hover:border-white/20 transition-all group"
              >
                {/* Avatar */}
                {app.profile_photo_url ? (
                  <img src={app.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#333333] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white/30" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{app.first_name} {app.last_name}</p>
                  <p className="text-white/40 text-xs truncate">{app.position_applied} · {app.nationality} · {app.email}</p>
                </div>

                {/* Experience */}
                <div className="hidden md:block text-right flex-shrink-0">
                  <p className="text-white/60 text-sm">{app.experience_years} yrs exp</p>
                  <p className="text-white/30 text-xs">AED {app.salary_expectation || '—'}</p>
                </div>

                {/* Date */}
                <div className="hidden md:block text-white/30 text-xs flex-shrink-0 w-20 text-right">
                  {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                </div>

                {/* Status dropdown */}
                <select
                  value={app.status || 'new'}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(app.id!, e.target.value, e as any)}
                  className={`text-xs px-3 py-1.5 rounded-full border flex-shrink-0 bg-transparent cursor-pointer ${STATUS_COLORS[app.status || 'new']}`}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Delete Button */}
                <button
                  onClick={e => confirmDelete(app, e)}
                  className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded transition-all flex-shrink-0"
                  title="Delete application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#2e2e2e] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-medium text-lg">Delete Application</h2>
                <p className="text-white/40 text-sm mt-1">This action cannot be undone.</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#3a3a3a] rounded-lg px-4 py-3 border border-white/5">
              <p className="text-white text-sm font-medium">{deleteTarget.first_name} {deleteTarget.last_name}</p>
              <p className="text-white/40 text-xs mt-0.5">{deleteTarget.position_applied} · {deleteTarget.email}</p>
            </div>

            <p className="text-white/50 text-sm">
              Are you sure you want to permanently delete this application and all associated documents?
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-white/15 text-white/60 py-2.5 text-sm rounded-lg hover:border-white/30 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/20 border border-red-500/40 text-red-300 py-2.5 text-sm rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? 'Deleting...' : (<><Trash2 className="w-4 h-4" /> Delete</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
