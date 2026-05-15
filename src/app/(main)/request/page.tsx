'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BLOOD_TYPE_LABELS, type BloodType } from '@/types'

function RequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const donorId = searchParams.get('donor')
  const supabase = createClient()

  const [donor, setDonor] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
    })
    if (donorId) {
      supabase
        .from('donors')
        .select('*, profile:profiles(full_name)')
        .eq('id', donorId)
        .single()
        .then(({ data }) => setDonor(data))
    }
  }, [donorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (!donorId) { setError('No donor selected.'); setLoading(false); return }

    // Check if already have a pending request to this donor
    const { data: existing } = await supabase
      .from('blood_requests')
      .select('id')
      .eq('requester_id', user.id)
      .eq('donor_id', donorId)
      .eq('status', 'PENDING')
      .single()

    if (existing) {
      setError('You already have a pending request to this donor.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('blood_requests').insert({
      requester_id: user.id,
      donor_id: donorId,
      notes,
      status: 'PENDING',
    })

    if (error) {
      setError('Failed to send request. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
        <p className="text-gray-500 mb-6">The donor will be notified. You can track the status in your dashboard.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Request Blood Donation</h1>
        <p className="text-gray-500 mt-2">Send a donation request to this donor.</p>
      </div>

      {donor && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {BLOOD_TYPE_LABELS[donor.blood_type as BloodType]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{donor.profile?.full_name}</p>
            <p className="text-sm text-gray-500">{donor.location}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          {!donorId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
              No donor selected. Please go back and select a donor.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Any medical urgency or details..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !donorId}
            className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestForm />
    </Suspense>
  )
}
