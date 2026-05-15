import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BLOOD_TYPE_LABELS, type BloodType, type RequestStatus } from '@/types'

const STATUS_STYLES: Record<RequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-blue-100 text-blue-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: donor }, { data: sentRequests }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('donors').select('*').eq('user_id', user.id).single(),
    supabase
      .from('blood_requests')
      .select('*, donor:donors(blood_type, location, profile:profiles(full_name))')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const { data: receivedRequests } = donor
    ? await supabase
        .from('blood_requests')
        .select('*, requester:profiles(full_name, mobile)')
        .eq('donor_id', donor.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {profile?.full_name}</p>
        </div>
        {!donor && (
          <Link
            href="/become-donor"
            className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Become a Donor
          </Link>
        )}
      </div>

      {/* Donor Status Card */}
      {donor && (
        <div className={`rounded-2xl border p-6 mb-8 ${donor.is_approved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {BLOOD_TYPE_LABELS[donor.blood_type as BloodType]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Your Donor Profile</p>
                <p className="text-sm text-gray-500">{donor.location}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${donor.is_approved ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                {donor.is_approved ? 'Approved' : 'Pending Approval'}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {donor.availability_status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
              </p>
            </div>
          </div>
          {!donor.is_approved && (
            <p className="text-sm text-amber-700 mt-4 bg-amber-100 rounded-xl px-4 py-2.5">
              Your donor profile is under review. It will appear in search results once approved by an admin.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sent Requests */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Requests I Sent</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {!sentRequests?.length ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">No requests sent yet.</p>
            ) : sentRequests.map((req: any) => (
              <div key={req.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{req.donor?.profile?.full_name ?? 'Donor'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.donor?.blood_type ? BLOOD_TYPE_LABELS[req.donor.blood_type as BloodType] : ''} · {req.donor?.location}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[req.status as RequestStatus]}`}>
                    {req.status}
                  </span>
                </div>
                {req.status === 'PENDING' && (
                  <CancelRequestButton requestId={req.id} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Received Requests (donor only) */}
        {donor && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Requests I Received</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {!receivedRequests?.length ? (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No requests received yet.</p>
              ) : receivedRequests.map((req: any) => (
                <div key={req.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{req.requester?.full_name ?? 'User'}</p>
                      {req.requester?.mobile && (
                        <a href={`tel:${req.requester.mobile}`} className="text-xs text-red-600 hover:underline">{req.requester.mobile}</a>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[req.status as RequestStatus]}`}>
                      {req.status}
                    </span>
                  </div>
                  {req.notes && <p className="text-xs text-gray-500 italic mb-2">{req.notes}</p>}
                  {req.status === 'PENDING' && (
                    <RequestActions requestId={req.id} donorId={donor.id} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CancelRequestButton({ requestId }: { requestId: string }) {
  return (
    <form action={async () => {
      'use server'
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.from('blood_requests').update({ status: 'CANCELLED' }).eq('id', requestId)
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/dashboard')
    }}>
      <button type="submit" className="mt-2 text-xs text-gray-400 hover:text-red-600 transition-colors">
        Cancel request
      </button>
    </form>
  )
}

function RequestActions({ requestId, donorId }: { requestId: string; donorId: string }) {
  return (
    <div className="flex gap-2 mt-1">
      <form action={async () => {
        'use server'
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        await supabase.from('blood_requests').update({ status: 'ACCEPTED' }).eq('id', requestId)
        const req = await supabase.from('blood_requests').select('requester_id').eq('id', requestId).single()
        if (req.data) {
          await supabase.from('donation_records').insert({
            donor_id: donorId,
            requester_id: req.data.requester_id,
            request_id: requestId,
            donation_date: new Date().toISOString().split('T')[0],
          })
          await supabase.from('donors').update({ last_donation_date: new Date().toISOString().split('T')[0] }).eq('id', donorId)
        }
        const { revalidatePath } = await import('next/cache')
        revalidatePath('/dashboard')
      }}>
        <button type="submit" className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors font-medium">
          Accept
        </button>
      </form>
      <form action={async () => {
        'use server'
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        await supabase.from('blood_requests').update({ status: 'CANCELLED' }).eq('id', requestId)
        const { revalidatePath } = await import('next/cache')
        revalidatePath('/dashboard')
      }}>
        <button type="submit" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          Decline
        </button>
      </form>
    </div>
  )
}
