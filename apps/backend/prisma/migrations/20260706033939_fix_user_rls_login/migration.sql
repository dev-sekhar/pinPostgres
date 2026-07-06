DROP POLICY IF EXISTS user_tenant_isolation ON "User";
CREATE POLICY user_tenant_isolation ON "User"
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant', true) 
        OR current_setting('app.bypass_rls', true) = 'on'
    )
    WITH CHECK (
        "tenantId" = current_setting('app.current_tenant', true) 
        OR current_setting('app.bypass_rls', true) = 'on'
    );