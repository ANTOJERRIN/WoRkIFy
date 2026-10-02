# Workify Backend (Supabase)

This directory contains the backend database schemas, Row Level Security (RLS) policies, triggers, and migrations for Workify.

## Structure

```
backend/
└── supabase/
    └── migrations/
        ├── 20261002000000_full_schema.sql   # Complete database schema, RLS, triggers, seeds
        └── README.md                        # Migration instructions
```

## Running Supabase CLI Commands

When using the Supabase CLI from the repository root, specify the `backend` working directory, or navigate into `backend/`:

```bash
cd backend
supabase link --project-ref <your-project-ref>
```

Or from the root:
```bash
supabase --workdir backend link --project-ref <your-project-ref>
```

> **Note**: Frontend application code communicates with Supabase cloud using `frontend/src/lib/supabase.ts` and `frontend/src/api/`. These local SQL files are version-controlled references and migrations.
