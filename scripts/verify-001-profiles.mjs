// Verify TASK-011 / 001_profiles.sql landed cleanly.
// Runs three checks: column shape, trigger attachment, RLS policy set.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('FAIL: missing env vars');
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function rpcSql(sql) {
  // Use the postgrest-meta `query` endpoint via fetch — service role bypasses RLS.
  const res = await fetch(`${url}/rest/v1/rpc/query_runner`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: sql }),
  });
  if (res.status === 404) return null; // RPC not present (expected — we don't define one)
  return res.json();
}

// supabase-js doesn't expose arbitrary SQL. Three options:
//   1) custom RPC (would need a migration to define) — too circular for a verifier
//   2) PostgREST table queries against information_schema — limited but works
//   3) The Management API — needs a separate access token
// Option 2 is the right fit. PostgREST exposes information_schema views via the
// service-role client. Build the queries via .from('information_schema.<view>').

// Check 1: column shape
const { data: cols, error: colsErr } = await sb
  .schema('information_schema')
  .from('columns')
  .select('column_name, data_type, ordinal_position')
  .eq('table_schema', 'public')
  .eq('table_name', 'profiles')
  .order('ordinal_position');
if (colsErr) {
  console.error('FAIL columns query:', colsErr.message);
  process.exit(1);
}
console.log(`\nCheck 1 — columns (${cols.length} found):`);
for (const c of cols) console.log(`  ${c.ordinal_position}. ${c.column_name} :: ${c.data_type}`);
if (cols.length !== 13) {
  console.error(`FAIL: expected 13 columns, got ${cols.length}`);
  process.exit(1);
}

// Check 2: trigger attachment
const { data: trigs, error: trigsErr } = await sb
  .schema('information_schema')
  .from('triggers')
  .select('trigger_name, event_manipulation, trigger_schema, event_object_schema, event_object_table')
  .eq('event_object_schema', 'auth')
  .eq('event_object_table', 'users');
if (trigsErr) {
  console.error('FAIL triggers query:', trigsErr.message);
  process.exit(1);
}
console.log(`\nCheck 2 — triggers on auth.users (${trigs.length} found):`);
for (const t of trigs) console.log(`  ${t.trigger_name} (${t.event_manipulation}) [schema=${t.trigger_schema}]`);
const ours = trigs.find((t) => t.trigger_name === 'on_auth_user_created');
if (!ours) {
  console.error('FAIL: on_auth_user_created trigger not attached');
  process.exit(1);
}

// Check 3: RLS policies
const { data: pols, error: polsErr } = await sb
  .schema('pg_catalog')
  .from('pg_policies')
  .select('policyname, cmd, tablename, schemaname')
  .eq('schemaname', 'public')
  .eq('tablename', 'profiles');
if (polsErr) {
  console.error('FAIL policies query:', polsErr.message);
  process.exit(1);
}
console.log(`\nCheck 3 — RLS policies on profiles (${pols.length} found):`);
for (const p of pols) console.log(`  ${p.policyname} (cmd=${p.cmd})`);

const cmds = new Set(pols.map((p) => p.cmd));
const hasSelect = pols.some((p) => p.cmd === 'SELECT');
const hasUpdate = pols.some((p) => p.cmd === 'UPDATE');
const hasInsert = pols.some((p) => p.cmd === 'INSERT');
const hasDelete = pols.some((p) => p.cmd === 'DELETE');
if (!hasSelect || !hasUpdate) {
  console.error('FAIL: missing SELECT or UPDATE policy');
  process.exit(1);
}
if (hasInsert || hasDelete) {
  console.error('FAIL: unexpected INSERT or DELETE policy present');
  process.exit(1);
}

console.log('\nTASK-011 verification: PASS');
