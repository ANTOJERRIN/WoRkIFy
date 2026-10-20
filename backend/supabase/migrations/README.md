# Supabase migrations

SQL files in this folder are version-controlled migration sources. Frontend
installation and builds run from the repository root; this directory is not
another npm application.

Create a local migration from the repository root:

```powershell
npx.cmd supabase --workdir backend migration new descriptive_name
```

Use `npx` instead of `npx.cmd` on other shells. The CLI generates the timestamped
filename. Read the generated SQL and run relevant disposable database tests with
`npm run test:db`. The runner verifies the source schema, public browsing and
archival changes without connecting to Supabase cloud.

Applying migrations is a separate release action. First verify the intended
project, effective schema/policies and applied migration history. The inspected
project has schema/history drift, so do not blindly replay the original schema,
seed inserts or every local migration using `db push`.

The public-read and archival migrations remain unapplied in that project. Their
scope and release requirements are documented in
[public browsing](../../../docs/public-browsing.md) and
[LinkedIn retirement](../../../docs/linkedin-retirement.md). No historical data
cleanup or cloud change is authorized by the local layout consolidation.
