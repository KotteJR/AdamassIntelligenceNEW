# Supabase Storage Setup for Reports

## Quick Setup Steps:

1. **Go to your Supabase Dashboard** → https://supabase.com/dashboard/project/[your-project-id]/storage

2. **Create a new bucket**:
   - Click "New bucket"
   - Name: `reports`
   - Make it **Public** (so reports can be accessed)
   - Click "Create bucket"

3. **Set bucket policies** (if needed):
   - The bucket should allow uploads from your service role key
   - Since you're using `supabaseAdmin`, it should work automatically

## What this does:

- **Local Development**: Reports saved to `Storage/` folder + Supabase Storage
- **Vercel Production**: Reports saved to Supabase Storage (acts like `/storage` folder)
- **Retrieval**: Checks Supabase Storage first, then database, then local

## File structure in Supabase Storage:
```
reports/
├── report-job-id-1.json
├── report-job-id-2.json
└── report-job-id-3.json
```

This mimics your local `Storage/` folder exactly! 🎯
