-- 1. Enable Row-Level Security on all tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttributeDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductMedia" ENABLE ROW LEVEL SECURITY;

-- 2. Create Security Policies for "User" table
CREATE POLICY user_tenant_isolation ON "User"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true))
    WITH CHECK ("tenantId" = current_setting('app.current_tenant', true));

-- 3. Create Security Policies for "Product" table
CREATE POLICY product_tenant_isolation ON "Product"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true))
    WITH CHECK ("tenantId" = current_setting('app.current_tenant', true));

-- 4. Create Security Policies for "AttributeDefinition" table
CREATE POLICY attribute_tenant_isolation ON "AttributeDefinition"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true))
    WITH CHECK ("tenantId" = current_setting('app.current_tenant', true));

-- 5. Create Security Policies for "ProductMedia" table
CREATE POLICY media_tenant_isolation ON "ProductMedia"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true))
    WITH CHECK ("tenantId" = current_setting('app.current_tenant', true));