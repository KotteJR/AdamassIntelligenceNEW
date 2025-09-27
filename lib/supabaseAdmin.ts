import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
}

// Use service role key if available, otherwise fall back to anon key
// Note: Service role key provides admin privileges, anon key has RLS restrictions
const keyToUse = serviceRoleKey || anonKey;

if (!keyToUse) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, keyToUse, {
  auth: { autoRefreshToken: false, persistSession: false },
});

