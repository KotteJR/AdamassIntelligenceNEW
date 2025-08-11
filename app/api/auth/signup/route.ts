import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, avatar_url } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Attempt admin createUser first
    let userId: string | null = null;
    let userEmail: string = email;
    try {
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, avatar_url },
      });
      if (createError) throw createError;
      userId = userData.user?.id ?? null;
    } catch (adminErr: any) {
      console.warn('Admin createUser failed, falling back to anon signUp then force-confirm:', adminErr?.message || adminErr);
      // Fallback: sign up with anon client, then confirm via admin
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (!url || !anon) {
        return NextResponse.json({ error: 'Server missing public Supabase env vars' }, { status: 500 });
      }
      const publicClient = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: signData, error: signErr } = await publicClient.auth.signUp({
        email,
        password,
        options: { data: { name, avatar_url } }
      });
      if (signErr) {
        console.error('Anon signUp error:', signErr);
        return NextResponse.json({ error: signErr.message || 'Signup failed' }, { status: 400 });
      }
      userId = signData.user?.id ?? null;
      if (!userId) return NextResponse.json({ error: 'No user id returned' }, { status: 500 });
      // Force confirm
      const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
      if (confirmErr) console.warn('Force confirm error:', confirmErr);
    }

    // Create profile row
    // Create profile row if table exists; ignore errors to avoid blocking signup
    try {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{ id: userId, email: userEmail, name, avatar_url }]);
      if (profileError) console.warn('Profile insert warning:', profileError.message);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Signup error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Signup failed' }, { status: 500 });
  }
}

