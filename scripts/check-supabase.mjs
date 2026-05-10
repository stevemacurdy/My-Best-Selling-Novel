// One-shot connectivity smoke test for TASK-004.
// Verifies the anon key can reach the project (auth.getSession returns cleanly with no session)
// and that the service-role key can SELECT from auth.users (which should be empty at this point).
//
// Run: node --env-file=.env.local scripts/check-supabase.mjs

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('FAIL: missing one of NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log(`Project URL: ${url}`);

// 1. Anon-key reachability — getSession should return cleanly with no session.
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: anonData, error: anonErr } = await anon.auth.getSession();
if (anonErr) {
  console.error('FAIL anon getSession:', anonErr.message);
  process.exit(1);
}
console.log(`anon.auth.getSession() ok — session=${anonData.session ? 'present' : 'null (expected)'}`);

// 2. Service-role can read auth.users via the admin API. listUsers returns the page.
const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: usersData, error: usersErr } = await service.auth.admin.listUsers({ page: 1, perPage: 1 });
if (usersErr) {
  console.error('FAIL service admin.listUsers:', usersErr.message);
  process.exit(1);
}
console.log(`service.auth.admin.listUsers() ok — total users=${usersData.users.length}`);

console.log('\nTASK-004 connectivity: PASS');
