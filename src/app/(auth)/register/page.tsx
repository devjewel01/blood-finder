'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GoogleIcon from '@/components/GoogleIcon'
import { MIN_PASSWORD_LENGTH } from '@/lib/validation'

type Form = { full_name: string; email: string; password: string; confirm: string }

export default function RegisterPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [form, setForm] = useState<Form>({
    full_name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set =
    <K extends keyof Form>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const fullName = form.full_name.trim()
    if (!fullName) {
      setError('Full name is required.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard?flash=registered')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Could not start Google sign-in. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-2">Join Blood Finder and save lives</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            aria-busy={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6 disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 uppercase">
              <span className="bg-white px-3">or</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
              >
                {error}
              </div>
            )}
            <Field label="Full Name">
              <input
                type="text"
                value={form.full_name}
                onChange={set('full_name')}
                required
                autoComplete="name"
                className={inputClass}
                placeholder="Jewel Ahmed"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                className={inputClass}
                placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
            <button
              type="submit"
              disabled={loading || googleLoading}
              aria-busy={loading}
              className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-red-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
