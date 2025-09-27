import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No authorization token provided',
        debug: 'Add Authorization: Bearer <token> header'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        details: error?.message 
      }, { status: 401 });
    }

    // Check admin emails from environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(user.email || '');

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        id: user.id
      },
      adminEmails: adminEmails,
      isAdmin: isAdmin,
      message: isAdmin ? 'User is admin' : 'User is not admin'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
