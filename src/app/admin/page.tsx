import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BloodTypeBadge from '@/components/BloodTypeBadge'
import StatusBadge from '@/components/StatusBadge'
import {
  BLOOD_TYPE_LABELS,
  type AdminRequest,
  type AdminUser,
  type PendingDonor,
} from '@/types'
import { DonorApprovalActions, UserAdminToggle } from './_components'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) redirect('/dashboard')

  const [pendingDonorsRes, allRequestsRes, allUsersRes] = await Promise.all([
    supabase
      .from('donors')
      .select('*, profile:profiles(full_name, email, mobile)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('blood_requests')
      .select(
        '*, requester:profiles(full_name), donor:donors(blood_type, location, profile:profiles(full_name))'
      )
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('profiles')
      .select('id, full_name, email, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const pendingDonors = (pendingDonorsRes.data ?? []) as PendingDonor[]
  const allRequests = (allRequestsRes.data ?? []) as AdminRequest[]
  const allUsers = (allUsersRes.data ?? []) as AdminUser[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage donors, requests, and users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Pending Donors" value={pendingDonors.length} accent="amber" />
        <StatCard label="Recent Requests" value={allRequests.length} accent="blue" />
        <StatCard label="Total Users" value={allUsers.length} accent="green" />
      </div>

      {/* Pending Donors */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pending Donor Approvals</h2>
        </div>
        {pendingDonors.length === 0 ? (
          <Empty text="No pending approvals." />
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingDonors.map((donor) => (
              <div
                key={donor.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <BloodTypeBadge bloodType={donor.blood_type} size="sm" variant="soft" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {donor.profile?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {donor.profile?.email ?? ''}
                      {donor.location ? ` · ${donor.location}` : ''}
                    </p>
                  </div>
                </div>
                <DonorApprovalActions
                  donorId={donor.id}
                  donorName={donor.profile?.full_name ?? 'this donor'}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Requests */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Blood Requests</h2>
        </div>
        {allRequests.length === 0 ? (
          <Empty text="No requests yet." />
        ) : (
          <div className="divide-y divide-gray-50">
            {allRequests.map((req) => (
              <div
                key={req.id}
                className="px-6 py-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {req.requester?.full_name ?? 'User'}
                    {' → '}
                    {req.donor?.profile?.full_name ?? 'Donor'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.donor?.blood_type
                      ? BLOOD_TYPE_LABELS[req.donor.blood_type]
                      : ''}
                    {' · '}
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Users */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Users</h2>
          <span className="text-xs text-gray-400">
            Showing latest {allUsers.length}
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {allUsers.map((u) => (
            <div
              key={u.id}
              className="px-6 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {u.full_name || '—'}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 whitespace-nowrap">
                {u.is_admin && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                <UserAdminToggle
                  userId={u.id}
                  userName={u.full_name || u.email}
                  isAdmin={u.is_admin}
                  isSelf={u.id === user.id}
                />
                <span className="text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'amber' | 'blue' | 'green'
}) {
  const colors: Record<typeof accent, string> = {
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
      <p className={`text-3xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-6 py-8 text-sm text-gray-400 text-center">{text}</p>
}
