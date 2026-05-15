'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BLOOD_TYPE_LABELS, type BloodType } from '@/types'

const BLOOD_TYPES: BloodType[] = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']

export default function BecomeDonorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ blood_type: '', location: '', mobile: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [alreadyDonor, setAlreadyDonor] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', data.user.id)
        .single()
      if (donor) setAlreadyDonor(true)
    })
  }, [])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Update mobile in profile
    if (form.mobile) {
      await supabase.from('profiles').update({ mobile: form.mobile }).eq('id', user.id)
    }

    const { error } = await supabase.from('donors').insert({
      user_id: user.id,
      blood_type: form.blood_type,
      location: form.location,
      availability_status: 'AVAILABLE',
      is_approved: false,
    })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard?registered=1')
  }

  if (alreadyDonor) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You are already registered as a donor</h2>
        <p className="text-gray-500 mb-6">Go to your dashboard to manage your donor profile.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <span className="text-3xl">🩸</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Become a Donor</h1>
        <p className="text-gray-500 mt-2">Register to help people in need. Your profile will be reviewed before appearing publicly.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Type</label>
            <select
              value={form.blood_type}
              onChange={set('blood_type')}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map(bt => (
                <option key={bt} value={bt}>{BLOOD_TYPE_LABELS[bt]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              required
              placeholder="e.g. Dhaka, Chittagong"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={set('mobile')}
              placeholder="01XXXXXXXXX"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Your profile will be reviewed by an admin before it becomes visible to others.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Register as Donor'}
          </button>
        </form>
      </div>
    </div>
  )
}
