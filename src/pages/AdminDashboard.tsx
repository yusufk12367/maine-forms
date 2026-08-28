import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Application } from '../types'
import { LogOut, RefreshCw, User, ChevronRight, Search } from 'lucide-react'

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

                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
