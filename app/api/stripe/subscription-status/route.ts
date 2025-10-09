import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@lib/supabaseClient';
import { supabaseAdmin } from '@lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        subscription_tier,
        subscription_status,
        analyses_remaining,
        analyses_limit,
        subscription_period_end,
        stripe_customer_id
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription status' },
        { status: 500 }
      );
    }

    // Get active subscription details if exists
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      tier: profile?.subscription_tier || 'free',
      status: profile?.subscription_status || 'none',
      analysesRemaining: profile?.analyses_remaining || 0,
      analysesLimit: profile?.analyses_limit || 1,
      periodEnd: profile?.subscription_period_end,
      hasStripeCustomer: !!profile?.stripe_customer_id,
      subscription: subscription || null,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
