import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifyAdminAccess, checkRateLimit } from '../../../../lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin, user, error: authError } = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        details: authError 
      }, { status: 401 });
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`admin-stats-${clientIP}`, 20, 60000)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.' 
      }, { status: 429 });
    }
    // Get total counts with error handling for RLS restrictions
    const [
      { count: totalAnalyses, error: analysesError },
      { count: totalUsers, error: usersError },
      { count: totalIntelResults, error: intelError },
      { count: totalArtifacts, error: artifactsError }
    ] = await Promise.all([
      supabaseAdmin.from('user_analyses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('intel_results').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_artifacts').select('*', { count: 'exact', head: true })
    ]);

    // Check if we have permission errors (likely using anon key instead of service role)
    if (analysesError?.message?.includes('permission') || analysesError?.message?.includes('RLS')) {
      return NextResponse.json({ 
        error: 'Admin access requires SUPABASE_SERVICE_ROLE_KEY. Currently using anon key with RLS restrictions.',
        requiresServiceRole: true
      }, { status: 403 });
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { count: recentAnalyses },
      { count: recentArtifacts }
    ] = await Promise.all([
      supabaseAdmin
        .from('user_analyses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabaseAdmin
        .from('user_artifacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
    ]);

    // Get top companies by analysis count
    const { data: topCompanies, error: topCompaniesError } = await supabaseAdmin
      .from('user_analyses')
      .select('company_alias')
      .not('company_alias', 'is', null);

    console.log('Admin stats API - Top companies query result:', { 
      topCompanies: topCompanies?.length, 
      error: topCompaniesError 
    });

    const companyCounts = topCompanies?.reduce((acc: any, analysis) => {
      const company = analysis.company_alias;
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {}) || {};

    const topCompaniesList = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Get artifact type distribution
    const { data: artifactTypes } = await supabaseAdmin
      .from('user_artifacts')
      .select('kind');

    const artifactTypeCounts = artifactTypes?.reduce((acc: any, artifact) => {
      const kind = artifact.kind;
      acc[kind] = (acc[kind] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      totals: {
        analyses: totalAnalyses || 0,
        users: totalUsers || 0,
        intelResults: totalIntelResults || 0,
        artifacts: totalArtifacts || 0
      },
      recent: {
        analyses: recentAnalyses || 0,
        artifacts: recentArtifacts || 0
      },
      topCompanies: topCompaniesList,
      artifactTypes: artifactTypeCounts
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
