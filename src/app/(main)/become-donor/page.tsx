'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BLOOD_TYPES,
  BLOOD_TYPE_LABELS,
  isBloodType,
  type BloodType,
} from '@/types'
import { isValidBangladeshMobile, normalizeMobile } from '@/lib/validation'

export default function BecomeDonorPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [form, setForm] = useState({ blood_type: '', location: '', mobile: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'loading' | 'new' | 'already'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      if (!data.user) {
        router.push('/login')
        return
      }
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()
      if (cancelled) return
      setStatus(donor ? 'already' : 'new')
    })()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isBloodType(form.blood_type)) {
      setError('Please select a valid blood type.')
      return
    }
    const location = form.location.trim()
    if (!location) {
      setError('Location is required.')
      return
    }
    const mobile = form.mobile ? normalizeMobile(form.mobile) : ''
    if (mobile && !isValidBangladeshMobile(mobile)) {
      setError('Mobile must be 11 digits starting with 01 (e.g. 01712345678).')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Pull existing profile so we don't clobber a name the user already set
    // (e.g. via /profile), and so the upsert satisfies `full_name NOT NULL`.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('full_name, mobile, location')
      .eq('id', user.id)
      .maybeSingle()

    const meta = user.user_metadata ?? {}
    const fullNameFromMeta =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      ''

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name:
          existingProfile?.full_name && existingProfile.full_name.trim() !== ''
            ? existingProfile.full_name
            : fullNameFromMeta,
        // Sync donor location + mobile into the profile so /profile shows them.
        mobile: mobile || existingProfile?.mobile || null,
        location: location || existingProfile?.location || null,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error('[become-donor] profile sync failed:', profileError.message)
      setError('Could not save your profile. Please try again.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('donors').insert({
      user_id: user.id,
      blood_type: form.blood_type satisfies BloodType,
      location,
      availability_status: 'AVAILABLE',
      is_approved: false,
    })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard?flash=donor-pending')
    router.refresh()
  }

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-400">
        Loading…
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          You are already registered as a donor
        </h2>
        <p className="text-gray-500 mb-6">
          Go to your dashboard to manage your donor profile.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4"
          aria-hidden="true"
        >
          <span className="text-3xl">🩸</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Become a Donor</h1>
        <p className="text-gray-500 mt-2">
          Register to help people in need. Your profile will be reviewed before
          appearing publicly.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
            >
              {error}
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Blood Type
            </span>
            <select
              value={form.blood_type}
              onChange={set('blood_type')}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {BLOOD_TYPE_LABELS[bt]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </span>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              required
              placeholder="e.g. Dhaka, Chittagong"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={form.mobile}
              onChange={set('mobile')}
              placeholder="01XXXXXXXXX"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <span className="block text-xs text-gray-400 mt-1">
              Optional. 11 digits starting with 01.
            </span>
          </label>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Your profile will be reviewed by an admin before it becomes visible to others.
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Register as Donor'}
          </button>
        </form>
      </div>
    </div>
  )
}
