import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { BLOOD_TYPE_LABELS, type BloodType } from '@/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [{ data: pendingDonors }, { data: allRequests }, { data: allUsers }] = await Promise.all([
    supabase
      .from('donors')
      .select('*, profile:profiles(full_name, email, mobile)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('blood_requests')
      .select('*, requester:profiles(full_name), donor:donors(blood_type, location, profile:profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('id, full_name, email, is_admin, created_at').order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage donors, requests, and users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-amber-500">{pendingDonors?.length ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Donors</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-500">{allRequests?.length ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Requests</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-500">{allUsers?.length ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
        </div>
      </div>

      {/* Pending Donors */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pending Donor Approvals</h2>
        </div>
        {!pendingDonors?.length ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No pending approvals.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingDonors.map((donor: any) => (
              <div key={donor.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold text-sm">
                    {BLOOD_TYPE_LABELS[donor.blood_type as BloodType]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{donor.profile?.full_name}</p>
                    <p className="text-xs text-gray-400">{donor.profile?.email} · {donor.location}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={async () => {
                    'use server'
                    const { createClient } = await import('@/lib/supabase/server')
                    const supabase = await createClient()
                    await supabase.from('donors').update({ is_approved: true }).eq('id', donor.id)
                    revalidatePath('/admin')
                  }}>
                    <button type="submit" className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium transition-colors">
                      Approve
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    const { createClient } = await import('@/lib/supabase/server')
                    const supabase = await createClient()
                    await supabase.from('donors').delete().eq('id', donor.id)
                    revalidatePath('/admin')
                  }}>
                    <button type="submit" className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium transition-colors">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Blood Requests</h2>
        </div>
        {!allRequests?.length ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No requests yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {allRequests.map((req: any) => (
              <div key={req.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {req.requester?.full_name} → {(req.donor as any)?.profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.donor?.blood_type ? BLOOD_TYPE_LABELS[req.donor.blood_type as BloodType] : ''} · {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Users</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {allUsers?.map((u: any) => (
            <div key={u.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {u.is_admin && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
                <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
