// TASK-008-scope helper. Will be replaced/refined when R-TASK-120 lands its
// canonical lib/acceptance.ts. Records a row in document_acceptances tied to
// the latest version of a document type.

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
 * means re-acceptance of the same version is a no-op (returns silently).
 *
 * Caller must pass an authenticated SupabaseClient — RLS allows users to insert
 * their own acceptance rows only.
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
    throw new Error(`acceptance: no current version of ${document} (${vErr?.message ?? 'not found'})`);
  }

  const { error: insErr } = await sb
    .from('document_acceptances')
    .insert({
      user_id,
      document_version_id: version.id,
      ip_address,
      user_agent,
    });

  if (insErr && !insErr.message.includes('duplicate key')) {
    throw new Error(`acceptance: insert failed for ${document}: ${insErr.message}`);
  }
}
