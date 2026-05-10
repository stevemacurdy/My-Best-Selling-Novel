// Smoke-tests the auth.signUp → handle_new_user trigger → profile defaults flow.
// Does NOT exercise the form, server action, HIBP, or acceptance recording —
// those need a real browser (or a Playwright test in R-TASK-131).
//
// Run: node --env-file=.env.local scripts/smoke-task-008-trigger.mjs

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('FAIL: missing env vars');
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `smoketest-${randomUUID().slice(0, 8)}@example.com`;
const fullName = 'Smoke Test User';

console.log(`Creating auth user ${email}...`);

const { data: created, error: createErr } = await sb.auth.admin.createUser({
  email,
  password: 'aLongTestPasswordThatIsNotInHIBP-' + randomUUID(),
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (createErr || !created.user) {
  console.error('FAIL admin.createUser:', createErr?.message ?? 'no user');
  process.exit(1);
}
const userId = created.user.id;
console.log(`  user.id = ${userId}`);

// Trigger fires synchronously inside the auth.users INSERT, so the profile
// should already exist by the time createUser returns.
const { data: profile, error: profErr } = await sb
  .from('profiles')
  .select('id, email, full_name, role, subscription_tier, subscription_status')
  .eq('id', userId)
  .single();
if (profErr || !profile) {
  console.error('FAIL profile lookup:', profErr?.message ?? 'no row');
  await sb.auth.admin.deleteUser(userId);
  process.exit(1);
}

console.log('Profile row:');
console.log(`  email               = ${profile.email}`);
console.log(`  full_name           = ${profile.full_name}`);
console.log(`  role                = ${profile.role}`);
console.log(`  subscription_tier   = ${profile.subscription_tier}`);
console.log(`  subscription_status = ${profile.subscription_status}`);

let pass = true;
if (profile.email !== email) {
  console.error(`  EXPECTED email=${email}`);
  pass = false;
}
if (profile.full_name !== fullName) {
  console.error(`  EXPECTED full_name=${fullName}`);
  pass = false;
}
if (profile.role !== 'user') {
  console.error('  EXPECTED role=user');
  pass = false;
}
if (profile.subscription_tier !== 'explorer') {
  console.error('  EXPECTED subscription_tier=explorer');
  pass = false;
}
if (profile.subscription_status !== 'free') {
  console.error('  EXPECTED subscription_status=free');
  pass = false;
}

console.log('\nCleaning up...');
const { error: delErr } = await sb.auth.admin.deleteUser(userId);
if (delErr) console.error(`  cleanup failed: ${delErr.message}`);
else console.log('  user deleted (profile CASCADEd)');

console.log(pass ? '\nTASK-008 trigger smoke: PASS' : '\nTASK-008 trigger smoke: FAIL');
process.exit(pass ? 0 : 1);
