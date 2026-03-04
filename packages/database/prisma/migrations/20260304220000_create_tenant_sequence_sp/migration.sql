CREATE OR REPLACE FUNCTION fn_get_next_sequence(p_tenant_id text)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_current_value integer;
  v_result text;
BEGIN
  INSERT INTO "TenantSequence" ("id", "tenantId", "prefix", "currentValue", "updatedAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, 'OS', 0, NOW())
  ON CONFLICT ("tenantId") DO NOTHING;

  UPDATE "TenantSequence"
  SET "currentValue" = "currentValue" + 1, "updatedAt" = NOW()
  WHERE "tenantId" = p_tenant_id
  RETURNING "prefix", "currentValue" INTO v_prefix, v_current_value;

  v_result := v_prefix || '-' || lpad(v_current_value::text, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
