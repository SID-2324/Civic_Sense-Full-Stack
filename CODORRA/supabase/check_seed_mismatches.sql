-- SAFETY: review before running. Back up your DB.
-- This script:
-- 1) drops FK constraints that reference profiles(id) for listed columns (if present)
-- 2) attempts to ALTER the column to uuid (using ::uuid)
-- 3) adds a FK to public.users(id) with chosen ON DELETE behavior
DO $$
DECLARE
  spec text;
  tbl text;
  col text;
  ondel text;
  found_con text;
  curr_udt text;
BEGIN
  -- iterate the spec strings using FOREACH (PL/pgSQL supported)
  FOREACH spec IN ARRAY ARRAY[
    'documents|owner_id|CASCADE',
    'document_access|granted_by|SET NULL',
    'document_access|grantee_id|SET NULL',
    'access_requests|decided_by|SET NULL',
    'access_requests|requester_id|SET NULL'
  ] LOOP
    tbl := split_part(spec, '|', 1);
    col := split_part(spec, '|', 2);
    ondel := split_part(spec, '|', 3);

    -- find existing FK referencing profiles on this column
    SELECT conname INTO found_con
    FROM pg_constraint
    WHERE conrelid = ('public.'||tbl)::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%' || '(' || col || ')' || '%'
      AND pg_get_constraintdef(oid) LIKE '%REFERENCES profiles(%'
    LIMIT 1;

    IF found_con IS NOT NULL THEN
      RAISE NOTICE 'Dropping constraint % on %', found_con, tbl;
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tbl, found_con);
    ELSE
      RAISE NOTICE 'No profiles FK found on %.%', tbl, col;
    END IF;

    -- check column exists and type
    SELECT udt_name INTO curr_udt
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
    LIMIT 1;

    IF curr_udt IS NULL THEN
      RAISE NOTICE 'Column %.% does not exist, skipping', tbl, col;
      CONTINUE;
    END IF;

    IF curr_udt <> 'uuid' THEN
      RAISE NOTICE 'Altering %.% from % to uuid (attempting cast)', tbl, col, curr_udt;
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING %I::uuid', tbl, col, col);
        RAISE NOTICE 'Altered %.% to uuid', tbl, col;
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Failed to cast %.% to uuid: %', tbl, col, SQLERRM;
        RAISE NOTICE 'You may need to clean or convert values in %.% before adding FK', tbl, col;
        CONTINUE;
      END;
    ELSE
      RAISE NOTICE '%.% already uuid', tbl, col;
    END IF;

    -- check if FK to users already exists
    PERFORM 1 FROM pg_constraint
    WHERE conrelid = ('public.'||tbl)::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%REFERENCES users(%'
      AND pg_get_constraintdef(oid) LIKE '%' || '(' || col || ')' || '%';

    IF FOUND THEN
      RAISE NOTICE 'FK to users already present on %.%', tbl, col;
    ELSE
      -- add FK referencing users(id)
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY(%I) REFERENCES public.users(id) ON DELETE %s',
        tbl, tbl||'_'||col||'_fkey_users', col, ondel
      );
      RAISE NOTICE 'Added FK % on %.%', tbl||'_'||col||'_fkey_users', tbl, col;
    END IF;
  END LOOP;
END $$;

-- QUICK SANITY CHECKS
-- 1) Any remaining FKs referencing profiles?
SELECT conrelid::regclass AS table_name, conname AS constraint_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f' AND pg_get_constraintdef(oid) LIKE '%REFERENCES profiles(%';

-- 2) Rows with non-UUID-looking values (may have blocked earlier casts)
SELECT id, owner_id FROM public.documents
 WHERE owner_id IS NOT NULL
  AND owner_id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
 LIMIT 50;

SELECT * FROM public.document_access
 WHERE (granted_by IS NOT NULL AND granted_by::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
   OR (grantee_id IS NOT NULL AND grantee_id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
 LIMIT 50;

SELECT * FROM public.access_requests
 WHERE (decided_by IS NOT NULL AND decided_by::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
   OR (requester_id IS NOT NULL AND requester_id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
 LIMIT 50;

-- 3) Rows that reference missing users (FK violators)
SELECT d.* FROM public.documents d
 LEFT JOIN public.users u ON d.owner_id = u.id
 WHERE d.owner_id IS NOT NULL AND u.id IS NULL
 LIMIT 50;

SELECT da.* FROM public.document_access da
 LEFT JOIN public.users u ON da.grantee_id = u.id
 WHERE da.grantee_id IS NOT NULL AND u.id IS NULL
 LIMIT 50;

SELECT ar.* FROM public.access_requests ar
 LEFT JOIN public.users u ON ar.requester_id = u.id
 WHERE ar.requester_id IS NOT NULL AND u.id IS NULL
 LIMIT 50;

-- End of checks. Paste the output (NOTICES and SELECT results) here and I'll advise fixes.

-- ==========================
-- FIX: Replace remaining profiles(id) FKs
-- WARNING: Take a DB backup/snapshot before running the following block.
-- This block will: drop old constraints, attempt to cast columns to uuid,
-- and recreate constraints referencing public.users(id).
BEGIN;

-- 1) gov_employees: FOREIGN KEY (id) REFERENCES profiles(id)
ALTER TABLE IF EXISTS public.gov_employees
  DROP CONSTRAINT IF EXISTS gov_employees_id_fkey;

ALTER TABLE IF EXISTS public.gov_employees
  ALTER COLUMN id TYPE uuid USING id::uuid;

ALTER TABLE IF EXISTS public.gov_employees
  ADD CONSTRAINT gov_employees_id_fkey FOREIGN KEY (id) REFERENCES public.users(id);

-- 2) external_accounts: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
ALTER TABLE IF EXISTS public.external_accounts
  DROP CONSTRAINT IF EXISTS external_accounts_profile_id_fkey;

ALTER TABLE IF EXISTS public.external_accounts
  ALTER COLUMN profile_id TYPE uuid USING profile_id::uuid;

ALTER TABLE IF EXISTS public.external_accounts
  ADD CONSTRAINT external_accounts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMIT;

-- End of FK fixes.

-- Ensure `documents` has a `created_at` column (some code expects it)
ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Backfill from uploaded_at when present
UPDATE public.documents SET created_at = uploaded_at WHERE created_at IS NULL AND uploaded_at IS NOT NULL;

-- Ensure default exists
ALTER TABLE IF EXISTS public.documents ALTER COLUMN created_at SET DEFAULT now();

-- End of schema fixes