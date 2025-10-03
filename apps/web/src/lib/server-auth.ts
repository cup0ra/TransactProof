import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface UserProfile {
  walletAddress: string
  freeGenerationsRemaining?: number
  freeUntil?: string | Date | null
}

interface AuthResult {
  user: UserProfile | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_PUBLIC_URL || 'http://localhost:3001'

async function fetchProfileViaApi(sessionCookie: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: `tp_session=${sessionCookie}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Ensures the request has a valid session cookie; otherwise redirects to /login.
 * Returns profile (if available) so page can use it without duplicate fetch.
 */
export async function requireSession(options: { redirectTo?: string } = {}): Promise<AuthResult> {
  const cookieStore = cookies()
  const session = cookieStore.get('tp_session')?.value
  if (!session) {
    const r = options.redirectTo || '/login'
    redirect(r)
  }
  const profile = await fetchProfileViaApi(session!)
  if (!profile) {
    redirect('/login')
  }
  return { user: profile }
}
