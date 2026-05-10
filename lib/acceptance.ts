// R-TASK-120 (signup-side helpers).
//
// recordAcceptance — resolves the current (un-superseded) version of a
// document and inserts a row in document_acceptances. Used by the signup
// flow (TASK-008) and any future re-acceptance UI.
//
// checkAcceptances — for a given user and a list of document types,
// returns which documents the user has NOT accepted at their current
// version. Will be consumed by the AcceptanceWall component (deferred).
//
// Deferred R-TASK-120 deliverables (this lib does not include them):
// - components/AcceptanceWall.tsx — re-acceptance modal that fires only
//   when a document_versions row is inserted with effective_at in the past
//   and the user hasn't accepted that version yet. Not v1-launch-blocking
//   because all 5 versions were seeded together at Phase 3 application;
//   no version bumps will happen pre-launch.
// - app/api/account/accept-terms/route.ts — POST endpoint the wall calls
//   to record acceptance of the current version of each document.
// - Server-side gate (AT-120-4) blocking API requests when the user has
//   un-accepted current versions. Lives in middleware or per-route helper
//   when AcceptanceWall ships.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type DocumentType = 'tos' | 'privacy' | 'aup' | 'cookies' | 'refunds';

interface RecordArgs {
  sb: SupabaseClient<Database>;
  user_id: string;
  document: DocumentType;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Resolves the current (un-superseded) version of `document` and inserts a
 * document_acceptances row for `user_id`. UNIQUE(user_id, document_version_id)
 * means re-acceptance of the same version is treated as idempotent.
 *
 * Caller must pass an authenticated SupabaseClient — RLS allows users to
 * insert their own acceptance rows only.
 */
export async function recordAcceptance({
  sb,
  user_id,
  document,
  ip_address,
  user_agent,
}: RecordArgs): Promise<void> {
  const { data: version, error: vErr } = await sb
    .from('document_versions')
    .select('id')
    .eq('document', document)
    .is('superseded_at', null)
    .single();

  if (vErr || !version) {
    throw new Error(
      `acceptance: no current version of ${document} (${vErr?.message ?? 'not found'})`,
    );
  }

  const { error: insErr } = await sb.from('document_acceptances').insert({
    user_id,
    document_version_id: version.id,
    ip_address,
    user_agent,
  });

  if (insErr && !insErr.message.includes('duplicate key')) {
    throw new Error(`acceptance: insert failed for ${document}: ${insErr.message}`);
  }
}

/**
 * For a user and a list of document types, returns the subset they have NOT
 * accepted at the current (un-superseded) version. Empty array means fully
 * accepted. Errors out if a requested document type has no current version.
 *
 * Consumed by AcceptanceWall (deferred). The caller picks which documents
 * matter — e.g., signup checks ['tos','privacy','refunds']; AcceptanceWall
 * may later check more or fewer.
 */
export async function checkAcceptances({
  sb,
  user_id,
  documents,
}: {
  sb: SupabaseClient<Database>;
  user_id: string;
  documents: DocumentType[];
}): Promise<DocumentType[]> {
  if (documents.length === 0) return [];

  // Resolve current version id per requested document.
  const { data: versions, error: vErr } = await sb
    .from('document_versions')
    .select('id, document')
    .in('document', documents)
    .is('superseded_at', null);

  if (vErr || !versions) {
    throw new Error(`acceptance: version lookup failed: ${vErr?.message ?? 'no rows'}`);
  }

  const wantedByDoc = new Map<DocumentType, string>();
  for (const v of versions) {
    wantedByDoc.set(v.document as DocumentType, v.id as string);
  }

  // Any requested document that has no current version is a hard error —
  // the caller asked about a document type that doesn't exist (e.g. typo).
  for (const d of documents) {
    if (!wantedByDoc.has(d)) {
      throw new Error(`acceptance: no current version of ${d}`);
    }
  }

  const wantedIds = Array.from(wantedByDoc.values());
  const { data: accepted, error: aErr } = await sb
    .from('document_acceptances')
    .select('document_version_id')
    .eq('user_id', user_id)
    .in('document_version_id', wantedIds);

  if (aErr) {
    throw new Error(`acceptance: lookup failed: ${aErr.message}`);
  }

  const acceptedIds = new Set((accepted ?? []).map((r) => r.document_version_id as string));

  const missing: DocumentType[] = [];
  for (const [doc, id] of Array.from(wantedByDoc.entries())) {
    if (!acceptedIds.has(id)) missing.push(doc);
  }
  return missing;
}
