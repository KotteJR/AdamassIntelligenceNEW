import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';

// Admin authentication middleware
export async function verifyAdminAccess(req: NextRequest): Promise<{ isAdmin: boolean; user: any; error?: string }> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, user: null, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { isAdmin: false, user: null, error: 'Invalid or expired token' };
    }

    // Normalize email and allowlist
    const email = (user.email || '').trim().toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // 1) Env allowlist first (no DB read needed)
    if (email && adminEmails.includes(email)) {
      return { isAdmin: true, user };
    }

    // 2) Optional DB fallback using service role; do NOT fail if row missing
    try {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      const isAdmin = profile?.is_admin === true;
      return { isAdmin, user, error: isAdmin ? undefined : 'Not in admin allowlist and no admin flag' };
    } catch (e: any) {
      // On any DB error, default to not admin (don’t leak DB errors as auth)
      return { isAdmin: false, user, error: 'Admin check failed' };
    }
  } catch (error: any) {
    return { isAdmin: false, user: null, error: error.message };
  }
}

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
