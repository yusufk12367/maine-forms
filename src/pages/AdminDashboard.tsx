import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Application } from '../types'
import { flagFor, normalizeNationality } from '../lib/countries'
import {
  LogOut, RefreshCw, User, ChevronRight, Search, Trash2, X, ChevronDown,
  LayoutGrid, List as ListIcon, BarChart3,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  shortlisted: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const STATUS_CHIP: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  reviewed: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25',
  shortlisted: 'bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25',
}

const SESSION_KEY = 'maine_dashboard_state'
type ViewMode = 'grid' | 'list'

interface DashboardState {
  search: string
  filterStatus: string
  filterPosition: string
  filterNationality: string
  view: ViewMode
  scrollY: number
}

function saveDashboardState(state: DashboardState) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
}

function loadDashboardState(): DashboardState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showPositionDropdown, setShowPositionDropdown] = useState(false)
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false)
  const [nationalitySearch, setNationalitySearch] = useState('')
  const positionDropdownRef = useRef<HTMLDivElement>(null)
  const nationalityDropdownRef = useRef<HTMLDivElement>(null)
  const didRestoreRef = useRef(false)

  // ── State that gets saved to sessionStorage ──────────────────
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterNationality, setFilterNationality] = useState('all')
  const [view, setView] = useState<ViewMode>('grid')

  // ── Bootstrap ────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'The MAINE Careers - Admin'
    if (!sessionStorage.getItem('maine_admin')) {
      navigate('/admin')
      return
    }
    fetchApplications()
  }, [])

  // Restore state + scroll after data loads (only once per "back" navigation)
  useEffect(() => {
    if (!loading && !didRestoreRef.current) {
      const saved = loadDashboardState()
      if (saved) {
        setSearch(saved.search)
        setFilterStatus(saved.filterStatus)
        setFilterPosition(saved.filterPosition)
        setFilterNationality(saved.filterNationality ?? 'all')
        if (saved.view) setView(saved.view)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: saved.scrollY, behavior: 'instant' })
          })
        })
      }
      didRestoreRef.current = true
    }
  }, [loading])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(e.target as Node)) {
        setShowPositionDropdown(false)
      }
      if (nationalityDropdownRef.current && !nationalityDropdownRef.current.contains(e.target as Node)) {
        setShowNationalityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: status as Application['status'] } : a)
    )
  }

  const confirmDelete = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(app)
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('applications').delete().eq('id', deleteTarget.id)
      if (error) {
        alert(`Delete failed: ${error.message}`)
        setDeleting(false)
        return
      }
      setApplications(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
    }
    setDeleting(false)
  }

  // Navigate to a profile, saving current state first
  const goToProfile = (id: string) => {
    saveDashboardState({
      search, filterStatus, filterPosition, filterNationality, view,
      scrollY: window.scrollY,
    })
    navigate(`/admin/application/${id}`)
  }

  // ── Derived data ─────────────────────────────────────────────
  const allPositions = Array.from(
    new Set(applications.map(a => a.position_applied).filter(Boolean))
  ).sort() as string[]

  // Nationality counts (across ALL applications, respecting the OTHER filters
  // so the graph reflects the current status/position/search slice but not
  // the nationality filter itself — classic faceted-filter behaviour).
  const nationalityBase = applications.filter(a => {
    const matchSearch =
      search === '' ||
      `${a.first_name} ${a.last_name} ${a.email} ${a.position_applied} ${a.nationality}`
        .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchPosition = filterPosition === 'all' || a.position_applied === filterPosition
    return matchSearch && matchStatus && matchPosition
  })

  const nationalityCounts = (() => {
    const map = new Map<string, number>()
    for (const a of nationalityBase) {
      const n = normalizeNationality(a.nationality)
      map.set(n, (map.get(n) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  })()

  const maxNatCount = nationalityCounts.length ? nationalityCounts[0].count : 1

  // Full nationality option list for the dropdown (normalized, sorted, searchable)
  const allNationalities = Array.from(
    new Set(applications.map(a => normalizeNationality(a.nationality)).filter(n => n && n !== 'Unknown'))
  ).sort() as string[]

  const nationalityOptions = allNationalities.filter(n =>
    nationalitySearch === '' || n.toLowerCase().includes(nationalitySearch.toLowerCase())
  )

  const filtered = applications.filter(a => {
    const matchSearch =
      search === '' ||
      `${a.first_name} ${a.last_name} ${a.email} ${a.position_applied} ${a.nationality}`
        .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchPosition = filterPosition === 'all' || a.position_applied === filterPosition
    const matchNationality =
      filterNationality === 'all' || normalizeNationality(a.nationality) === filterNationality
    return matchSearch && matchStatus && matchPosition && matchNationality
  })

  const counts = {
    all: applications.length,
    new: applications.filter(a => a.status === 'new').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const activeFilterCount = [
    filterStatus !== 'all',
    filterPosition !== 'all',
    filterNationality !== 'all',
    search !== '',
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setSearch('')
    setFilterStatus('all')
    setFilterPosition('all')
    setFilterNationality('all')
  }

  const toggleNationality = (name: string) => {
    setFilterNationality(prev => (prev === name ? 'all' : name))
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
              className={`rounded-lg p-4 border text-center transition-all ${
                filterStatus === s
                  ? 'border-maine-gold bg-maine-gold/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <p className="text-2xl font-bold text-white">{counts[s]}</p>
              <p className="text-white/40 text-xs capitalize mt-1">{s}</p>
            </button>
          ))}
        </div>

        {/* ── Nationality graph ── */}
        {nationalityCounts.length > 0 && (
          <div className="bg-[#2e2e2e] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-maine-gold" />
                <h2 className="text-white text-sm font-medium">Applicants by Nationality</h2>
                <span className="text-white/30 text-xs">({nationalityCounts.length})</span>
              </div>
              {filterNationality !== 'all' && (
                <button
                  onClick={() => setFilterNationality('all')}
                  className="text-maine-gold text-xs hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {filterNationality}
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {nationalityCounts.map(({ name, count }) => {
                const active = filterNationality === name
                const pct = Math.round((count / maxNatCount) * 100)
                return (
                  <button
                    key={name}
                    onClick={() => toggleNationality(name)}
                    className="w-full group flex items-center gap-3 text-left"
                    title={`${count} applicant${count !== 1 ? 's' : ''} from ${name} — click to filter`}
                  >
                    <span className="w-6 text-base flex-shrink-0 text-center">{flagFor(name)}</span>
                    <span className={`w-36 flex-shrink-0 text-xs truncate transition-colors ${
                      active ? 'text-maine-gold font-medium' : 'text-white/60 group-hover:text-white'
                    }`}>
                      {name}
                    </span>
                    <span className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                      <span
                        className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ease-out ${
                          active ? 'bg-maine-gold' : 'bg-maine-gold/40 group-hover:bg-maine-gold/70'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className={`w-8 flex-shrink-0 text-right text-xs tabular-nums transition-colors ${
                      active ? 'text-maine-gold font-semibold' : 'text-white/50 group-hover:text-white'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Search + Filter row ── */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, position..."
                className="w-full bg-[#2e2e2e] border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder-white/20 focus:border-maine-gold transition-colors text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View toggle (grid / list) */}
            <div className="flex items-center bg-[#2e2e2e] border border-white/10 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-md transition-all ${
                  view === 'grid' ? 'bg-maine-gold/15 text-maine-gold' : 'text-white/40 hover:text-white'
                }`}
                title="Card grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition-all ${
                  view === 'list' ? 'bg-maine-gold/15 text-maine-gold' : 'text-white/40 hover:text-white'
                }`}
                title="List"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Status filter chip */}
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all flex-shrink-0 ${STATUS_CHIP[filterStatus]}`}
              >
                <span className="capitalize">{filterStatus}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Nationality filter dropdown (searchable) */}
            <div className="relative flex-shrink-0" ref={nationalityDropdownRef}>
              <button
                onClick={() => { setShowNationalityDropdown(v => !v); setNationalitySearch('') }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all h-full ${
                  filterNationality !== 'all'
                    ? 'border-maine-gold/50 bg-maine-gold/10 text-maine-gold'
                    : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                }`}
              >
                {filterNationality !== 'all' && <span>{flagFor(filterNationality)}</span>}
                <span className="max-w-[120px] truncate">
                  {filterNationality === 'all' ? 'Nationality' : filterNationality}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showNationalityDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showNationalityDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-[#2e2e2e] border border-white/10 rounded-lg shadow-2xl z-20 min-w-[240px] overflow-hidden">
                  <div className="p-2 border-b border-white/10">
                    <input
                      autoFocus
                      value={nationalitySearch}
                      onChange={e => setNationalitySearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full bg-[#3a3a3a] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/30 focus:border-maine-gold transition-colors"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setFilterNationality('all'); setShowNationalityDropdown(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filterNationality === 'all'
                          ? 'text-maine-gold bg-maine-gold/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      All Nationalities
                    </button>
                    {nationalityOptions.map(n => (
                      <button
                        key={n}
                        onClick={() => { setFilterNationality(n); setShowNationalityDropdown(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                          filterNationality === n
                            ? 'text-maine-gold bg-maine-gold/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{flagFor(n)}</span>
                        <span className="truncate">{n}</span>
                      </button>
                    ))}
                    {nationalityOptions.length === 0 && (
                      <p className="px-4 py-3 text-white/30 text-xs">No match</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Position filter dropdown */}
            <div className="relative flex-shrink-0" ref={positionDropdownRef}>
              <button
                onClick={() => setShowPositionDropdown(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all h-full ${
                  filterPosition !== 'all'
                    ? 'border-maine-gold/50 bg-maine-gold/10 text-maine-gold'
                    : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="max-w-[120px] truncate">
                  {filterPosition === 'all' ? 'Position' : filterPosition}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showPositionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPositionDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-[#2e2e2e] border border-white/10 rounded-lg shadow-2xl z-20 min-w-[200px] max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setFilterPosition('all'); setShowPositionDropdown(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filterPosition === 'all'
                        ? 'text-maine-gold bg-maine-gold/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Positions
                  </button>
                  {allPositions.map(pos => (
                    <button
                      key={pos}
                      onClick={() => { setFilterPosition(pos); setShowPositionDropdown(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filterPosition === pos
                          ? 'text-maine-gold bg-maine-gold/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear all button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/40 text-xs hover:border-white/30 hover:text-white transition-all flex-shrink-0"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Result count */}
          {activeFilterCount > 0 && (
            <p className="text-white/30 text-xs px-1">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {filterNationality !== 'all' && <span> · {filterNationality}</span>}
              {filterPosition !== 'all' && <span> · {filterPosition}</span>}
              {filterStatus !== 'all' && <span> · {filterStatus}</span>}
              {search && <span> · "{search}"</span>}
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">No applications found.</div>
        ) : view === 'grid' ? (
          /* ── CARD GRID ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(app => (
              <div
                key={app.id}
                onClick={() => goToProfile(app.id!)}
                className="relative bg-[#2e2e2e] border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-maine-gold/40 hover:-translate-y-1 transition-all duration-200 group"
              >
                {/* Delete (hover) */}
                <button
                  onClick={e => confirmDelete(app, e)}
                  className="absolute top-2 right-2 z-10 p-1.5 text-white/60 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:!text-red-400 hover:bg-red-500/30 rounded-md transition-all"
                  title="Delete application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Photo — large square headshot */}
                <div className="relative aspect-square w-full bg-[#333333] overflow-hidden">
                  {app.profile_photo_url ? (
                    <img
                      src={app.profile_photo_url}
                      alt={`${app.first_name} ${app.last_name}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-white/20" />
                    </div>
                  )}

                  {/* Status badge over the photo */}
                  <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border capitalize backdrop-blur-sm ${STATUS_COLORS[app.status || 'new']}`}>
                    {app.status || 'new'}
                  </span>

                  {/* Name gradient overlay at the bottom of the photo */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-8 pb-2">
                    <p className="text-white font-medium text-sm truncate drop-shadow">
                      {app.first_name} {app.last_name}
                    </p>
                  </div>
                </div>

                {/* Info below photo */}
                <div className="px-3 py-2.5 space-y-0.5">
                  <p className="text-white/70 text-xs truncate">{app.position_applied || '—'}</p>
                  <p className="text-white/50 text-xs flex items-center gap-1">
                    <span>{flagFor(app.nationality)}</span>
                    <span className="truncate">{app.nationality || 'Unknown'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST ── */
          <div className="space-y-2">
            {filtered.map(app => (
              <div
                key={app.id}
                onClick={() => goToProfile(app.id!)}
                className="flex items-center gap-4 bg-[#2e2e2e] border border-white/5 rounded-lg px-5 py-4 cursor-pointer hover:border-white/20 transition-all group"
              >
                {/* Avatar */}
                {app.profile_photo_url ? (
                  <img
                    src={app.profile_photo_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#333333] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white/30" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{app.first_name} {app.last_name}</p>
                  <p className="text-white/40 text-xs truncate flex items-center gap-1">
                    <span>{flagFor(app.nationality)}</span>
                    {app.position_applied} · {app.nationality} · {app.email}
                  </p>
                </div>

                {/* Experience */}
                <div className="hidden md:block text-right flex-shrink-0">
                  <p className="text-white/60 text-sm">{app.experience_years} yrs exp</p>
                  <p className="text-white/30 text-xs">AED {app.salary_expectation || '—'}</p>
                </div>

                {/* Date */}
                <div className="hidden md:block text-white/30 text-xs flex-shrink-0 w-20 text-right">
                  {app.created_at
                    ? new Date(app.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '—'}
                </div>

                {/* Status dropdown */}
                <select
                  value={app.status || 'new'}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(app.id!, e.target.value, e as unknown as React.MouseEvent)}
                  className={`text-xs px-3 py-1.5 rounded-full border flex-shrink-0 bg-transparent cursor-pointer ${STATUS_COLORS[app.status || 'new']}`}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Delete */}
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
              <p className="text-white text-sm font-medium">
                {deleteTarget.first_name} {deleteTarget.last_name}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {deleteTarget.position_applied} · {deleteTarget.email}
              </p>
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
