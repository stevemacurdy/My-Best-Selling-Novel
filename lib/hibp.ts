import { createHash } from 'node:crypto';

/**
 * HIBP Pwned Passwords k-anonymity check (R-TASK-114, Q-2.7).
 * SHA-1's the password locally, sends only the first 5 hex chars of the hash,
 * scans the returned suffix list for a full match. Plaintext never leaves the host.
 *
 * Throws on network failure; caller decides whether to fail-open or fail-closed.
 * 3-second timeout matches Q-2.12 (HIBP-down → warn-but-allow per default).
 *
 * Server runtime only — node:crypto is not available in Edge.
 */
export async function checkBreached(password: string): Promise<boolean> {
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'User-Agent': 'mybestsellingnovel-signup' },
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`HIBP responded ${res.status}`);
  const text = await res.text();
  return text.split('\n').some((line) => line.split(':')[0]?.trim() === suffix);
}
