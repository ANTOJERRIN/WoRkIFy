# Supabase Migrations

This folder holds SQL migration files for the Workify database schema.

## Linking your Supabase project

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in: `supabase login`
3. Link your project (run from the repo root):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   You can find your project ref in the Supabase dashboard under **Settings > General**.
4. To apply migrations:
   ```bash
   supabase db push
   ```
5. To pull the current remote schema:
   ```bash
   supabase db pull
   ```

## Migration file naming

Files are named with a timestamp prefix so they run in order:
```
20261002000000_create_profiles.sql
20261002000001_create_workshops.sql
```

**Do not apply migrations without reviewing them first.**
