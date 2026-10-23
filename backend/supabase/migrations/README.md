# Supabase migrations

For the inspected existing backend, use the separately reviewed
[reconciliation package](../../release/README.md). It assembles compatible forms
of the pending contracts and excludes the original schema/seeds. Do not apply
both that package and these same contracts, or run blanket `db push` against the
existing database. The package remains unapplied pending staging acceptance.

Prompt 10 adds source-only `20261022172429_meeting_link_access.sql`: server-time
meeting RLS, an invoker-rights safe-state RPC, strict URL validation and public
metadata protection. Existing rows are retained; invalid legacy values require
review before validating the new NOT VALID constraints. See
[meeting access](../../../docs/meeting-link-access.md) for admin exceptions and
pending release verification. This migration has not been applied to the cloud.

Prompt 09 adds source-only `20261022170525_registration_service.sql`: restrictive
registration ownership/immutability policies, client privilege limits, and a
private trigger that locks workshop metadata and checks the server clock.
It preserves existing rows and uniqueness. Review
[the registration report](../../../docs/registration-service.md), including
the private definer-function rationale and release checks, before application.
No cloud migration was applied by this stage.

SQL files in this folder are version-controlled migration sources. Frontend
installation and builds run from the repository root; this directory is not
another npm application.

Prompt 13 adds unapplied `20261023081331_admin_workshop_contract.sql`: restrictive
admin-only workshop/link mutations, editable-column grants, invoker validation
and meeting-identity triggers, and revoked client hard-delete/membership writes.
It preserves history and keeps the exact retired LinkedIn workshop archived.
Review grant/policy drift and earlier lifecycle/meeting dependencies first; see
[the admin/hosting report](../../../docs/admin-hosting.md). No live migration was applied.

Prompt 12 adds unapplied `20261023070718_profile_editor_contract.sql`. It limits
profile writes to editable columns, adds restrictive ownership and an invoker
validation trigger, and tightens avatar object paths while preserving intentionally
public image reads. No profile/object rows are rewritten or deleted. Verify the
existing public bucket and policy/grant drift before applying; see
[the profile editor review](../../../docs/profile-editor.md).

Prompt 08 adds the unapplied lifecycle contract migration
`20261021181340_workshop_lifecycle_contract.sql`. It follows the archival source
and adds a NOT VALID schedule check plus private, non-publicly executable pure
predicates. It does not install the registration/meeting authorization policies
owned by prompts 09/10. See [the lifecycle report](../../../docs/workshop-lifecycle.md)
before applying or validating it against an existing project.

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
