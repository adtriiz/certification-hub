# Supabase Schema Migrations

This directory contains the database schema migrations for the Certification Hub project.

## Structure

```
supabase/
├── schema/          # Database schema migrations (in order)
│   ├── 001_initial_schema.sql      # Base tables: profiles, certifications, user_certifications, applications
│   ├── 002_certifications_revamp.sql  # External certifications feature
│   └── 003_keep_alive.sql          # Keep-alive table for preventing database pausing
└── seeds/           # Optional: Sample/seed data (currently empty)
```

## Important Notes

- **These are NOT automatically applied** - They must be run manually in the Supabase SQL Editor
- **Order matters** - Run migrations in numerical order (001, 002, 003)
- **Idempotent** - Most migrations use `IF NOT EXISTS` to allow safe re-runs
- **Documentation** - These files serve as version-controlled schema documentation

## Running Migrations

1. Open your Supabase project SQL Editor
2. Copy and paste the content of each migration file in order
3. Run them sequentially

## Current Schema

### 001_initial_schema.sql
- `profiles` - User profiles linked to auth.users
- `certifications` - Certification listings
- `user_certifications` - User's saved/applied/completed certifications
- `applications` - Funding applications
- `admin_settings` - Admin configuration

### 002_certifications_revamp.sql
- Adds columns to `user_certifications` (completed_at, credential_url, expires_at)
- Creates `external_certifications` table for user-added certifications

### 003_keep_alive.sql
- Creates `keep_alive` table for GitHub Actions to ping
- Prevents database from pausing due to inactivity
- Auto-increments ping_count via trigger
