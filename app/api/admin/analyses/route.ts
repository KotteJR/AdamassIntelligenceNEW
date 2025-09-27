import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifyAdminAccess, checkRateLimit } from '../../../../lib/adminAuth';

// GET - List all analyses with optional filtering
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
    if (!checkRateLimit(`admin-analyses-${clientIP}`, 30, 60000)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.' 
      }, { status: 429 });
    }
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    let query = supabaseAdmin
      .from('user_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;

    console.log('Admin analyses API - Raw query result:', { data: data?.length, error });

    if (error) {
      console.error('Error fetching analyses:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    // Load user profiles separately to avoid relationship issues
    const userIds = data?.map(a => a.user_id).filter(Boolean) || [];
    let userProfiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, name')
        .in('id', userIds);
      userProfiles = profilesData || [];
    }

    const formattedData = data?.map(analysis => {
      const profile = userProfiles.find(p => p.id === analysis.user_id);
      return {
        ...analysis,
        user_email: profile?.email || 'Unknown',
        user_name: profile?.name || 'Unknown'
      };
    }) || [];

    return NextResponse.json({
      analyses: formattedData,
      total: formattedData.length,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete an analysis and all related data
export async function DELETE(req: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin, user, error: authError } = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        details: authError 
      }, { status: 401 });
    }

    // Rate limiting for delete operations (more restrictive)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`admin-delete-${clientIP}`, 5, 60000)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.' 
      }, { status: 429 });
    }
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Delete from user_analyses
    const { error: analysesError } = await supabaseAdmin
      .from('user_analyses')
      .delete()
      .eq('job_id', jobId);

    if (analysesError) {
      console.error('Error deleting analysis:', analysesError);
      return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
    }

    // Delete from intel_results
    const { error: intelError } = await supabaseAdmin
      .from('intel_results')
      .delete()
      .eq('job_id', jobId);

    if (intelError) {
      console.error('Error deleting intel results:', intelError);
      // Don't fail the request, just log the error
    }

    // Delete from user_artifacts
    const { error: artifactsError } = await supabaseAdmin
      .from('user_artifacts')
      .delete()
      .eq('job_id', jobId);

    if (artifactsError) {
      console.error('Error deleting artifacts:', artifactsError);
      // Don't fail the request, just log the error
    }

    // Delete from Supabase Storage
    try {
      await supabaseAdmin.storage
        .from('reports')
        .remove([`report-${jobId}.json`]);
    } catch (storageError) {
      console.warn('Could not delete from storage:', storageError);
      // Don't fail the request, just log the warning
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Analysis and all related data deleted successfully' 
    });

  } catch (error: any) {
    console.error('Admin delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
