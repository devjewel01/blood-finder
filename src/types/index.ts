export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG'
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE'
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'COMPLETED'

export interface Profile {
  id: string
  full_name: string
  email: string
  mobile: string | null
  location: string | null
  is_admin: boolean
  created_at: string
}

export interface Donor {
  id: string
  user_id: string
  blood_type: BloodType
  location: string
  availability_status: AvailabilityStatus
  last_donation_date: string | null
  is_approved: boolean
  created_at: string
  profile?: Profile
}

export interface BloodRequest {
  id: string
  requester_id: string
  donor_id: string
  status: RequestStatus
  notes: string | null
  created_at: string
  requester?: Profile
  donor?: Donor
}

export interface DonationRecord {
  id: string
  donor_id: string
  requester_id: string
  request_id: string
  donation_date: string
  created_at: string
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POS: 'A+',
  A_NEG: 'A-',
  B_POS: 'B+',
  B_NEG: 'B-',
  AB_POS: 'AB+',
  AB_NEG: 'AB-',
  O_POS: 'O+',
  O_NEG: 'O-',
}
