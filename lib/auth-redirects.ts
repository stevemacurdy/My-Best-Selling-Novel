/**
 * Open-redirect protection for redirect query params (returnTo, next, etc.).
 * Allows only same-origin path+search; rejects anything that resolves to a
 * different origin when parsed against a fixed base URL.
 *
 * The fixed base is 'http://localhost' so any well-formed URL with an
 * explicit protocol (http, https, javascript, data, etc.) parses with a
 * non-localhost origin and gets rejected. Path-only inputs ('/app', '/x?y=1')
 * inherit the base origin and pass through.
 *
 * Used by:
 *   - signinAction (returnTo after sign-in)
 *   - /auth/callback (next after code exchange)
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string = '/',
): string {
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return fallback;
    return parsed.pathname + parsed.search;
  } catch {
    return fallback;
  }
}
