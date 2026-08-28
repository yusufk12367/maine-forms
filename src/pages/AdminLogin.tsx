import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem('maine_admin', 'true')
      navigate('/admin/dashboard')
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-maine-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-maine-gold tracking-[0.4em] uppercase text-xs mb-3">The Maine</p>
          <h1 className="font-display text-3xl text-white">Admin Access</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-maine-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-maine-gold transition-colors text-sm"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-maine-gold text-maine-black font-semibold py-3 rounded-lg hover:bg-maine-gold/90 transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
