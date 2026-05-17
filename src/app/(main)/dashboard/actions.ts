'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { todayIsoDate } from '@/lib/eligibility'
import type { AvailabilityStatus } from '@/types'

export async function toggleAvailability(donorId: string, currentStatus: AvailabilityStatus) {
  const supabase = await createClient()
  const newStatus: AvailabilityStatus =
    currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
  await supabase
    .from('donors')
    .update({ availability_status: newStatus })
    .eq('id', donorId)
  revalidatePath('/dashboard')
  redirect(
    `/dashboard?flash=${newStatus === 'AVAILABLE' ? 'availability-on' : 'availability-off'}`,
  )
}

export async function cancelRequest(requestId: string) {
  const supabase = await createClient()
  await supabase
    .from('blood_requests')
    .update({ status: 'CANCELLED' })
    .eq('id', requestId)
  revalidatePath('/dashboard')
  redirect('/dashboard?flash=request-cancelled')
}

export async function acceptRequest(requestId: string, donorId: string) {
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('blood_requests')
    .select('requester_id')
    .eq('id', requestId)
    .maybeSingle()

  if (!req) return

  const today = todayIsoDate()

  await supabase
    .from('blood_requests')
    .update({ status: 'ACCEPTED' })
    .eq('id', requestId)

  await supabase.from('donation_records').insert({
    donor_id: donorId,
    requester_id: req.requester_id,
    request_id: requestId,
    donation_date: today,
  })

  await supabase
    .from('donors')
    .update({ last_donation_date: today })
    .eq('id', donorId)

  revalidatePath('/dashboard')
  redirect('/dashboard?flash=request-accepted')
}

export async function declineRequest(requestId: string) {
  const supabase = await createClient()
  await supabase
    .from('blood_requests')
    .update({ status: 'CANCELLED' })
    .eq('id', requestId)
  revalidatePath('/dashboard')
  redirect('/dashboard?flash=request-declined')
}
