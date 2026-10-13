# Public browsing regression checks

Run `public_workshop_browsing.sql` as postgres against a disposable Supabase
database with the migrations applied. For example:

```sh
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/supabase/tests/public_workshop_browsing.sql
```

The transaction rolls back its fixtures. It checks public workshop reads,
anonymous private-data and write denial, registration-gated Meet links,
profile ownership, and admin permissions.

The public listing requires `20261013172822_public_workshop_browsing.sql`.
Apply that migration as part of a separately authorized release before exposing
the new visitor flow. It adds only anonymous SELECT access to workshop metadata;
Meet URLs remain in the protected `workshop_links` table. This change does not
disable or otherwise configure the Supabase Google provider.

Browser checks should cover desktop/mobile and both themes, each landing/navbar
workshop button, registration and hosting unavailability with Close/Explore
actions, existing session restoration, profile/admin authorization, registered
Meet access, Calendar, and logout. Live session/provider verification requires
the target project's environment and an existing authenticated test account.
