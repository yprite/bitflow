import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

const SESSION_COOKIE_NAME = 'bf_session'
const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

interface SessionResult {
  readonly sessionId: string
  readonly sessionToken: string
  readonly isNew: boolean
}

export async function getOrCreateSession(): Promise<SessionResult> {
  const cookieStore = await cookies()
  const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (existingToken) {
    const session = await findSessionByToken(existingToken)
    if (session) {
      await touchSession(session.id)
      return { sessionId: session.id, sessionToken: existingToken, isNew: false }
    }
  }

  const newToken = crypto.randomUUID()
  const sessionId = await createSession(newToken)
  return { sessionId, sessionToken: newToken, isNew: true }
}

async function findSessionByToken(token: string): Promise<{ id: string } | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('anonymous_sessions')
    .select('id')
    .eq('session_token', token)
    .single()

  if (error || !data) {
    return null
  }
  return { id: data.id }
}

async function touchSession(sessionId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('anonymous_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`)
  }
}

async function createSession(token: string): Promise<string> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('anonymous_sessions')
    .insert({ session_token: token })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message ?? 'Unknown error'}`)
  }
  return data.id
}

export function setSessionCookie(
  responseCookies: { set: (name: string, value: string, options: Record<string, unknown>) => void },
  sessionToken: string
): void {
  responseCookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

export function getSessionTokenFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): string | null {
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function findSessionIdByToken(token: string): Promise<string | null> {
  const session = await findSessionByToken(token)
  return session?.id ?? null
}

export { SESSION_COOKIE_NAME }
