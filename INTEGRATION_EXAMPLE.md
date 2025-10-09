# How to Integrate Stripe with Your Existing Analysis Flow

This guide shows you exactly how to add subscription checks to your current analysis creation process.

## Current Flow (Without Stripe)

Your current `app/api/initiate-analysis/route.ts` probably looks like this:

```typescript
export async function POST(req: Request) {
  // Get form data
  const body = await req.json();
  const { companyAlias, websiteUrl, jobId, ... } = body;

  // Validate required fields
  if (!companyAlias || !websiteUrl || !jobId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Trigger n8n workflow
  const response = await fetch(n8nUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return NextResponse.json({ success: true, jobId });
}
```

## Updated Flow (With Stripe)

Here's the same flow with subscription checks:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkUserCanCreateAnalysis, decrementAnalysisCount } from '@/lib/subscriptionCheck';

export async function POST(req: Request) {
  // ==================== NEW: Authentication ====================
  // Get authorization token
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - Please sign in' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  
  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }

  // ==================== NEW: Subscription Check ====================
  const subscriptionCheck = await checkUserCanCreateAnalysis(user.id);
  
  if (!subscriptionCheck.canCreateAnalysis) {
    return NextResponse.json({ 
      error: 'Subscription limit reached',
      message: subscriptionCheck.reason,
      tier: subscriptionCheck.tier,
      analysesRemaining: 0,
      needsUpgrade: true,
      upgradeUrl: '/pricing'
    }, { status: 403 });
  }

  // ==================== EXISTING: Get form data ====================
  const body = await req.json();
  const { 
    companyAlias, 
    websiteUrl, 
    jobId,
    legalAlias,
    countryOfIncorporation,
    // ... other fields
  } = body;

  // Validate required fields
  if (!companyAlias || !websiteUrl || !jobId) {
    return NextResponse.json({ 
      error: 'Missing required fields: companyAlias, websiteUrl, and jobId are required.' 
    }, { status: 400 });
  }

  // ==================== EXISTING: Prepare payload ====================
  const payload = {
    job_id: jobId,
    url: websiteUrl,
    company_name: companyAlias,
    legal_name: legalAlias || companyAlias,
    country: countryOfIncorporation || 'Unknown'
  };

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // ==================== EXISTING: Trigger n8n workflow ====================
  console.log(`[API] Triggering n8n workflow for job_id: ${jobId}`);
  
  const n8nResponse = await fetch(n8nUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!n8nResponse.ok) {
    console.error(`[API] n8n workflow failed. Status: ${n8nResponse.status}`);
    return NextResponse.json({ 
      error: 'Failed to trigger analysis workflow' 
    }, { status: n8nResponse.status });
  }

  // ==================== NEW: Decrement usage counter ====================
  // Only decrement if workflow was successfully triggered
  const decremented = await decrementAnalysisCount(user.id);
  
  if (!decremented) {
    console.warn(`[API] Failed to decrement analysis count for user ${user.id}`);
    // Don't fail the request, but log for monitoring
  }

  // ==================== NEW: Store analysis in user_analyses ====================
  // Link the analysis to the user for their dashboard
  const { error: dbError } = await supabaseAdmin
    .from('user_analyses')
    .insert({
      user_id: user.id,
      job_id: jobId,
      company_alias: companyAlias,
      legal_alias: legalAlias,
      website_url: websiteUrl,
      country_of_incorporation: countryOfIncorporation,
    });

  if (dbError) {
    console.error('[API] Failed to store analysis in database:', dbError);
    // Don't fail the request since n8n workflow was triggered
  }

  // ==================== EXISTING: Return success ====================
  return NextResponse.json({ 
    success: true, 
    message: 'Analysis initiated successfully',
    jobId,
    analysesRemaining: subscriptionCheck.analysesRemaining - 1
  });
}
```

## Key Changes Made

### 1. Added Authentication (Lines marked "NEW")
- Extract token from Authorization header
- Verify token with Supabase
- Get user information

### 2. Added Subscription Check (Lines marked "NEW")
- Call `checkUserCanCreateAnalysis()` before creating analysis
- Return 403 error if user has no remaining analyses
- Include upgrade URL in error response

### 3. Decrement Usage Counter (Lines marked "NEW")
- Call `decrementAnalysisCount()` after successful workflow trigger
- This updates the database to track usage

### 4. Store User Analysis (Lines marked "NEW")
- Insert record in `user_analyses` table
- Links the analysis to the user for their dashboard

---

## Frontend Integration

### Update Your Analysis Form Component

Before:
```tsx
const handleSubmit = async (data) => {
  const response = await fetch('/api/initiate-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (response.ok) {
    alert('Analysis started!');
  }
};
```

After:
```tsx
import { useSubscription } from '@/app/hooks/useSubscription';

const YourFormComponent = () => {
  const { canCreateAnalysis, needsUpgrade, subscription } = useSubscription();

  const handleSubmit = async (data) => {
    // Check subscription before even making the request
    if (!canCreateAnalysis()) {
      if (needsUpgrade()) {
        if (confirm('You have no remaining analyses. Upgrade now?')) {
          window.location.href = '/pricing';
        }
        return;
      }
    }

    // Get auth token from localStorage or your auth context
    const token = localStorage.getItem('sb-auth-token');
    if (!token) {
      alert('Please sign in first');
      return;
    }

    const response = await fetch('/api/initiate-analysis', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // NEW: Add token
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();

    if (response.status === 403 && result.needsUpgrade) {
      // User hit their limit
      if (confirm(result.message + ' Upgrade now?')) {
        window.location.href = '/pricing';
      }
      return;
    }

    if (response.ok) {
      alert(`Analysis started! You have ${result.analysesRemaining} analyses remaining.`);
      // Optionally refresh subscription data
      window.location.href = `/report?jobId=${result.jobId}`;
    } else {
      alert(result.error || 'Failed to start analysis');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show usage indicator */}
      {subscription && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p className="text-sm">
            {subscription.analysesLimit === 999999 
              ? '∞ Unlimited analyses' 
              : `${subscription.analysesRemaining} of ${subscription.analysesLimit} analyses remaining`
            }
          </p>
        </div>
      )}

      {/* Your form fields */}
      <input name="companyAlias" placeholder="Company Name" />
      <input name="websiteUrl" placeholder="Website URL" />
      
      <button 
        type="submit"
        disabled={!canCreateAnalysis()}
        className={!canCreateAnalysis() ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {!canCreateAnalysis() 
          ? 'Upgrade to Create Analysis' 
          : 'Create Analysis'
        }
      </button>

      {needsUpgrade() && (
        <a href="/pricing" className="text-blue-500 underline mt-2 block">
          View Pricing Plans
        </a>
      )}
    </form>
  );
};
```

---

## Error Handling

Handle different subscription states:

```typescript
const handleAnalysisResponse = (response, data) => {
  if (response.status === 403) {
    // Subscription limit reached
    showUpgradeModal(data.message);
    return;
  }

  if (response.status === 401) {
    // Not authenticated
    redirectToLogin();
    return;
  }

  if (response.status === 402) {
    // Payment required (optional: for pay-per-analysis)
    redirectToCheckout();
    return;
  }

  if (response.ok) {
    // Success!
    showSuccessMessage(data);
  } else {
    // Other error
    showErrorMessage(data.error);
  }
};
```

---

## Testing the Integration

### Test Cases

1. **Free user with 0 analyses remaining**
   - Should see "Upgrade required" message
   - Should be redirected to pricing page

2. **Pro user with 5 analyses remaining**
   - Should successfully create analysis
   - Counter should decrement to 4

3. **Enterprise user (unlimited)**
   - Should always be able to create analysis
   - Counter should not decrement

4. **Unauthenticated user**
   - Should receive 401 error
   - Should be prompted to sign in

### Manual Test Steps

1. Create a test user
2. Check their subscription status: `/api/stripe/subscription-status`
3. Try to create an analysis
4. Verify counter decrements
5. Create analyses until limit is reached
6. Verify upgrade prompt appears
7. Subscribe to a plan
8. Verify analyses are available again

---

## Optional: Add Middleware for Route Protection

Create `middleware.ts` in your project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect analysis-related routes
  if (pathname.startsWith('/api/initiate-analysis')) {
    const token = request.headers.get('authorization')?.substring(7);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Token validation happens in the route handler
    // This is just a quick check
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/initiate-analysis/:path*'],
};
```

---

## Monitoring Usage

Add this to your admin dashboard to monitor usage:

```typescript
// app/admin/usage/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function UsageMonitoring() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    // Query your database for usage statistics
    const response = await fetch('/api/admin/usage-stats');
    const data = await response.json();
    setStats(data);
  };

  return (
    <div>
      <h1>Usage Monitoring</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h3>Total Analyses This Month</h3>
          <p className="text-3xl">{stats?.totalAnalyses}</p>
        </div>
        
        <div className="card">
          <h3>Active Subscriptions</h3>
          <p className="text-3xl">{stats?.activeSubscriptions}</p>
        </div>
        
        <div className="card">
          <h3>Revenue This Month</h3>
          <p className="text-3xl">${stats?.revenue}</p>
        </div>
      </div>

      {/* Usage chart, user list, etc. */}
    </div>
  );
}
```

---

## Summary of Changes Needed

1. ✅ Install Stripe packages: `npm install stripe @stripe/stripe-js`
2. ✅ Add environment variables to `.env.local`
3. ✅ Run database migration (`stripe_schema.sql`)
4. ✅ Update `/api/initiate-analysis/route.ts` with subscription checks
5. ✅ Update frontend form to include auth token
6. ✅ Add usage indicator to dashboard
7. ✅ Test the complete flow

---

**That's it!** Your analysis creation flow now enforces subscription limits. 🎉
