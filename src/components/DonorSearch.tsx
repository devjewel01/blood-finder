'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BLOOD_TYPE_LABELS, type BloodType, type Donor } from '@/types'

const BLOOD_TYPES: BloodType[] = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']

export default function DonorSearch() {
  const supabase = createClient()
  const [donors, setDonors] = useState<(Donor & { profile: { full_name: string; location: string | null } })[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ blood_type: '', location: '' })
  const [searched, setSearched] = useState(false)

  const search = async () => {
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('donors')
      .select('*, profile:profiles(full_name, location)')
      .eq('is_approved', true)
      .eq('availability_status', 'AVAILABLE')

    if (filters.blood_type) query = query.eq('blood_type', filters.blood_type)
    if (filters.location) query = query.ilike('location', `%${filters.location}%`)

    const { data } = await query.order('created_at', { ascending: false })
    setDonors((data as any) ?? [])
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <span className="text-3xl">🩸</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Blood Donors</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Search for verified blood donors near you. Every donation saves a life.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <select
            value={filters.blood_type}
            onChange={e => setFilters(f => ({ ...f, blood_type: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
          >
            <option value="">Any Blood Type</option>
            {BLOOD_TYPES.map(bt => (
              <option key={bt} value={bt}>{BLOOD_TYPE_LABELS[bt]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location (e.g. Dhaka)"
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-16 text-gray-400">Searching...</div>
      )}

      {!loading && searched && donors.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No donors found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-1">Try changing your filters.</p>
        </div>
      )}

      {!loading && donors.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{donors.length} donor{donors.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map(donor => (
              <Link
                key={donor.id}
                href={`/donor/${donor.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-red-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl font-bold text-red-600">
                    {BLOOD_TYPE_LABELS[donor.blood_type as BloodType]}
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    Available
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  {donor.profile?.full_name ?? 'Donor'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {donor.location}
                </p>
                {donor.last_donation_date && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last donated: {new Date(donor.last_donation_date).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-400">
          <p>Enter search criteria above to find donors.</p>
        </div>
      )}
    </div>
  )
}
