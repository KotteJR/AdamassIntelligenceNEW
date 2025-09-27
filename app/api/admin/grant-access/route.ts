import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifyAdminAccess, checkRateLimit } from '../../../../lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin, user, error: authError } = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        details: authError 
      }, { status: 401 });
    }

    // Rate limiting for admin operations (very restrictive)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`admin-grant-${clientIP}`, 3, 300000)) { // 3 requests per 5 minutes
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.' 
      }, { status: 429 });
    }
    const { email, isAdmin: makeAdmin } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Update user profile to set admin status
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        email,
        is_admin: makeAdmin,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('Error updating admin status:', error);
      return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Admin access ${makeAdmin ? 'granted' : 'revoked'} for ${email}` 
    });

  } catch (error: any) {
    console.error('Admin access error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
