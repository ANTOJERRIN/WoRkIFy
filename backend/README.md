# Workify Backend (Supabase)

The LinkedIn assessment endpoint has been retired from source. Historical
`linkedin_reviews` data and policies remain. See
[retirement notes](../docs/linkedin-retirement.md) for the exact workshop identity,
unapplied archival migration, validation and deployed-endpoint checks.

This directory contains the backend database schemas, Row Level Security (RLS) policies, triggers, and migrations for Workify.

## Structure

```
backend/
└── supabase/
    ├── migrations/   # Version-controlled schema and data changes
    └── tests/        # SQL authorization regression checks
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

> **Note**: Frontend application code communicates with Supabase cloud using `src/lib/supabase.ts` and `src/api/`. These local SQL files are version-controlled references and migrations. The application installs/builds from the repository root; backend files are not browser modules.

Local database checks run with `npm run test:db` from the repository root. Review
the [migration workflow](supabase/migrations/README.md) before any cloud action.
