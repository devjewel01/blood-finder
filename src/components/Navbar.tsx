'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => setIsAdmin(profile?.is_admin ?? false))
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setIsAdmin(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-red-600">
          <span className="text-2xl">🩸</span>
          Blood Finder
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
            Find Donors
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Find Donors</Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Dashboard</Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Admin</Link>
              )}
              <button onClick={handleLogout} className="text-sm text-red-600 text-left py-1">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Login</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
