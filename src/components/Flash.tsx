'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// Centralised flash-message catalog. Pages push to `?flash=<key>` and we
// render the matching message. Keeps URLs clean of free-text content.
const FLASH_MESSAGES: Record<string, { type: 'success' | 'info'; text: string }> = {
  registered: {
    type: 'success',
    text: 'Welcome! Your account has been created.',
  },
  'login-ok': {
    type: 'success',
    text: 'Signed in successfully.',
  },
  'donor-pending': {
    type: 'info',
    text: 'Donor application submitted. An admin will review it shortly.',
  },
  'donor-approved': {
    type: 'success',
    text: 'Donor approved.',
  },
  'donor-rejected': {
    type: 'success',
    text: 'Donor rejected and removed.',
  },
  'admin-granted': {
    type: 'success',
    text: 'Admin access granted.',
  },
  'admin-revoked': {
    type: 'success',
    text: 'Admin access revoked.',
  },
  'request-accepted': {
    type: 'success',
    text: 'Request accepted. Donation recorded in your history.',
  },
  'request-declined': {
    type: 'success',
    text: 'Request declined.',
  },
  'request-cancelled': {
    type: 'success',
    text: 'Request cancelled.',
  },
  'availability-on': {
    type: 'success',
    text: 'You are now marked as available.',
  },
  'availability-off': {
    type: 'success',
    text: 'You are now marked as unavailable.',
  },
}

const AUTO_DISMISS_MS = 4000

function FlashItem({ entryKey }: { entryKey: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false)
      // Strip the param so refresh doesn't replay the toast.
      const next = new URLSearchParams(params.toString())
      next.delete('flash')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(timeout)
  }, [params, pathname, router])

  const entry = FLASH_MESSAGES[entryKey]
  if (!visible || !entry) return null

  const palette =
    entry.type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 max-w-md w-[calc(100%-2rem)]"
    >
      <div
        className={`${palette} border rounded-xl px-4 py-3 text-sm font-medium shadow-sm flex items-center gap-2`}
      >
        <span aria-hidden="true">{entry.type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>{entry.text}</span>
      </div>
    </div>
  )
}

function FlashInner() {
  const params = useSearchParams()
  const key = params.get('flash')
  if (!key || !FLASH_MESSAGES[key]) return null
  // Use the key as React key so a different flash remounts the item, giving
  // it a fresh dismiss timer and avoiding setState-in-effect anti-patterns.
  return <FlashItem key={key} entryKey={key} />
}

export default function Flash() {
  // Suspense boundary required because useSearchParams suspends during prerender.
  return (
    <Suspense fallback={null}>
      <FlashInner />
    </Suspense>
  )
}
