-- =====================================================
-- Officer Case Count Sync Trigger
-- Automatically updates current_cases_count in officers table
-- whenever a case assignment changes.
-- =====================================================
-- 1. Create function to recalculate count for a specific officer
CREATE OR REPLACE FUNCTION update_officer_case_count(officer_id uuid) RETURNS void AS $$ BEGIN
UPDATE officers
SET current_cases_count = (
    SELECT count(*)
    FROM cases
    WHERE assigned_to = officer_id
      AND status NOT IN ('closed', 'archived')
  ),
  updated_at = now()
WHERE id = officer_id;
END;
$$ LANGUAGE plpgsql;
-- 2. Create trigger function to handle cases changes
CREATE OR REPLACE FUNCTION tg_fn_sync_officer_case_count() RETURNS TRIGGER AS $$ BEGIN -- Handle INSERT: update the new officer
  IF (TG_OP = 'INSERT') THEN IF (NEW.assigned_to IS NOT NULL) THEN PERFORM update_officer_case_count(NEW.assigned_to);
END IF;
-- Handle UPDATE: update both old and new officers if assignment changed
ELSIF (TG_OP = 'UPDATE') THEN IF (
  COALESCE(
    OLD.assigned_to,
    '00000000-0000-0000-0000-000000000000'::uuid
  ) <> COALESCE(
    NEW.assigned_to,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  OR OLD.status <> NEW.status
) THEN IF (OLD.assigned_to IS NOT NULL) THEN PERFORM update_officer_case_count(OLD.assigned_to);
END IF;
IF (NEW.assigned_to IS NOT NULL) THEN PERFORM update_officer_case_count(NEW.assigned_to);
END IF;
END IF;
-- Handle DELETE: update the old officer
ELSIF (TG_OP = 'DELETE') THEN IF (OLD.assigned_to IS NOT NULL) THEN PERFORM update_officer_case_count(OLD.assigned_to);
END IF;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- 3. Create the trigger on the cases table
DROP TRIGGER IF EXISTS trigger_sync_officer_case_count ON cases;
CREATE TRIGGER trigger_sync_officer_case_count
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION tg_fn_sync_officer_case_count();
-- 4. Initial synchronization for all existing officers
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT id
FROM officers LOOP PERFORM update_officer_case_count(r.id);
END LOOP;
END $$;