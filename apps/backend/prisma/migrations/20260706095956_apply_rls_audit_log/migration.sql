-- Enable Row-Level Security on AuditLog table
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (useful if the DB owner is the same as the app user)
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

-- Create policy for Tenant Isolation
CREATE POLICY "Tenant Isolation Policy for AuditLog" ON "AuditLog"
    FOR ALL
    USING (
        -- If bypass_rls is on, allow access
        current_setting('app.bypass_rls', true) = 'on'
        OR
        -- Otherwise, tenantId must match the session's current_tenant
        "tenantId"::text = current_setting('app.current_tenant', true)
    );