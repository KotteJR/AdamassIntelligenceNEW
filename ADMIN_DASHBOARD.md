# Admin Dashboard

## Overview

The admin dashboard is now available at `/admin` and provides comprehensive management capabilities for the Adamass Intelligence platform.

## Features

### 1. Dashboard Overview
- **Total Statistics**: View total analyses, users, intel results, and artifacts
- **Recent Activity**: See activity from the last 7 days
- **Top Companies**: Most analyzed companies by count
- **Artifact Types**: Distribution of generated content types

### 2. Analysis Management
- **View All Analyses**: Complete list of all company analyses
- **Delete Analyses**: Remove analyses and all related data
- **User Information**: See which user created each analysis
- **Direct Links**: Quick access to view reports

### 3. Data Management
- **Intel Results**: View raw data from n8n workflows
- **Artifacts**: Manage generated content (mindmaps, audio, etc.)
- **Storage Cleanup**: Automatic cleanup of related files

### 4. Create New Analysis
- **Quick Create**: Direct link to create new company analysis
- **User Authentication**: Ensures proper user context

## Access Control

The admin dashboard is restricted to users with admin privileges. Currently configured for:
- Users with email containing "admin"
- Specific admin email: `admin@adamass.com`

To modify access control, edit the `isAdmin` check in `/app/admin/page.tsx`:

```typescript
const isAdmin = user?.email === 'admin@adamass.com' || user?.email?.includes('admin');
```

## API Endpoints

### `/api/admin/analyses`
- **GET**: List all analyses with filtering options
- **DELETE**: Delete analysis and all related data

### `/api/admin/stats`
- **GET**: Get dashboard statistics and metrics

## Database Operations

The admin dashboard performs comprehensive cleanup when deleting analyses:

1. **user_analyses** table - Main analysis record
2. **intel_results** table - Raw data from n8n workflows  
3. **user_artifacts** table - Generated content (mindmaps, audio, etc.)
4. **Supabase Storage** - Report JSON files

## Usage

1. Navigate to `/admin` in your browser
2. Sign in with an admin account
3. Use the tabs to navigate between different views:
   - **Overview**: Dashboard statistics and metrics
   - **Analyses**: Manage company analyses
   - **Intel Results**: View raw data collection
   - **Artifacts**: Manage generated content

## Security Notes

- Admin access is controlled by email-based checks
- All database operations use Supabase Admin client
- Comprehensive error handling and user feedback
- Confirmation dialogs for destructive operations

## Environment Variables Required

Make sure these environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Troubleshooting

If you see "Missing environment variable" errors:
1. Create a `.env.local` file in the project root
2. Add the required environment variables
3. Restart the development server (`npm run dev`)
