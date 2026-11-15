-- Compatibility fixes for databases created with the superseded duplicate schemas.
CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_key ON admins(user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'audit_logs'
      AND column_name = 'old_values'
  ) THEN
    ALTER TABLE audit_logs RENAME COLUMN old_values TO old_value;
    ALTER TABLE audit_logs RENAME COLUMN new_values TO new_value;
    ALTER TABLE audit_logs ALTER COLUMN admin_email DROP NOT NULL;
    ALTER TABLE audit_logs ALTER COLUMN reason DROP NOT NULL;
    ALTER TABLE audit_logs ALTER COLUMN admin_id TYPE TEXT USING admin_id::text;
  END IF;
END
$$;
