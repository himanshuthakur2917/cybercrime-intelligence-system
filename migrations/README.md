# Database Migrations

This folder contains SQL migration files for the Cybercrime Intelligence System database schema.

## Overview

The migration system uses Supabase/PostgreSQL and follows a numbered ordering convention for proper execution sequence.

## Migration Files

| File | Description |
|------|-------------|
| `001_create_users_table.sql` | Creates the users table for officers and administrators |
| `002_create_otps_table.sql` | Creates the OTPs table for phone-based authentication |
| `003_create_activity_log_table.sql` | Creates the activity log table for audit trail |
| `004_create_triggers_and_functions.sql` | Creates database triggers and helper functions |
| `005_create_rls_policies.sql` | Creates Row Level Security policies |

## Authentication Flow

1. **Administrator** creates a user with:
   - Username, password, email, phone
   - Role (officer/administrator)
   - Uploads user's face image (converted to encoding)

2. **Officer Login Flow**:
   - Login with username/password
   - OTP verification sent to registered phone
   - Face recognition verification
   - Route to dashboard based on role

## Running Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001, 002, 003, etc.)

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Run migrations
supabase db push
```

### Option 3: Direct PostgreSQL Connection
```bash
# Using psql
psql -h <your-supabase-host> -U postgres -d postgres -f migrations/001_create_users_table.sql
```

## Schema Design

### Users Table
- Stores officers and administrators
- Contains face encoding for biometric authentication
- Tracks registration status and login history

### OTPs Table
- Manages one-time passwords for authentication
- Tracks verification attempts and expiration

### Activity Log Table
- Audit trail for all system activities
- Tracks user actions, IP addresses, and timestamps

## Notes

- All tables use UUID primary keys with `gen_random_uuid()`
- Timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- Row Level Security (RLS) is enabled for data protection
- Indexes are created for optimized query performance
