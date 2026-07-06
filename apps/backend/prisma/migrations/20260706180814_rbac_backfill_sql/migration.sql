-- Seed the permissions first (we need them in the DB globally)
-- Using ON CONFLICT to avoid duplicate key errors if already seeded
INSERT INTO "Permission" (id, code, name, module, description, "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'product.create', 'Create Product', 'Product', 'Allows creation of products', now(), now()),
    (gen_random_uuid(), 'product.read', 'Read Product', 'Product', 'Allows viewing of products', now(), now()),
    (gen_random_uuid(), 'product.update', 'Update Product', 'Product', 'Allows updating of products', now(), now()),
    (gen_random_uuid(), 'product.delete', 'Delete Product', 'Product', 'Allows deletion of products', now(), now()),
    (gen_random_uuid(), 'category.create', 'Create Category', 'Category', 'Allows creation of categories', now(), now()),
    (gen_random_uuid(), 'category.read', 'Read Category', 'Category', 'Allows viewing of categories', now(), now()),
    (gen_random_uuid(), 'category.update', 'Update Category', 'Category', 'Allows updating of categories', now(), now()),
    (gen_random_uuid(), 'category.delete', 'Delete Category', 'Category', 'Allows deletion of categories', now(), now()),
    (gen_random_uuid(), 'attribute.create', 'Create Attribute', 'Attribute', 'Allows creation of attributes', now(), now()),
    (gen_random_uuid(), 'attribute.read', 'Read Attribute', 'Attribute', 'Allows viewing of attributes', now(), now()),
    (gen_random_uuid(), 'attribute.update', 'Update Attribute', 'Attribute', 'Allows updating of attributes', now(), now()),
    (gen_random_uuid(), 'attribute.delete', 'Delete Attribute', 'Attribute', 'Allows deletion of attributes', now(), now()),
    (gen_random_uuid(), 'brand.create', 'Create Brand', 'Brand', 'Allows creation of brands', now(), now()),
    (gen_random_uuid(), 'brand.read', 'Read Brand', 'Brand', 'Allows viewing of brands', now(), now()),
    (gen_random_uuid(), 'brand.update', 'Update Brand', 'Brand', 'Allows updating of brands', now(), now()),
    (gen_random_uuid(), 'brand.delete', 'Delete Brand', 'Brand', 'Allows deletion of brands', now(), now()),
    (gen_random_uuid(), 'asset.create', 'Create Asset', 'Asset', 'Allows creation of assets', now(), now()),
    (gen_random_uuid(), 'asset.read', 'Read Asset', 'Asset', 'Allows viewing of assets', now(), now()),
    (gen_random_uuid(), 'asset.update', 'Update Asset', 'Asset', 'Allows updating of assets', now(), now()),
    (gen_random_uuid(), 'asset.delete', 'Delete Asset', 'Asset', 'Allows deletion of assets', now(), now()),
    (gen_random_uuid(), 'audit.read', 'Read Audit Logs', 'Audit', 'Allows viewing of audit logs', now(), now()),
    (gen_random_uuid(), 'user.create', 'Create User', 'User', 'Allows creation of users', now(), now()),
    (gen_random_uuid(), 'user.read', 'Read User', 'User', 'Allows viewing of users', now(), now()),
    (gen_random_uuid(), 'user.update', 'Update User', 'User', 'Allows updating of users', now(), now()),
    (gen_random_uuid(), 'user.delete', 'Delete User', 'User', 'Allows deletion of users', now(), now()),
    (gen_random_uuid(), 'tenant.manage', 'Manage Tenant', 'Tenant', 'Master tenant administration', now(), now())
ON CONFLICT (code) DO NOTHING;


-- Create Administrator Role for existing Tenants
INSERT INTO "Role" (id, "tenantId", name, description, "roleType", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Administrator', 'Full access to all modules', 'SYSTEM', true, now(), now()
FROM "Tenant"
ON CONFLICT ("tenantId", name) DO NOTHING;

-- Create Viewer Role for existing Tenants
INSERT INTO "Role" (id, "tenantId", name, description, "roleType", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 'Viewer', 'Read-only access to all modules', 'SYSTEM', true, now(), now()
FROM "Tenant"
ON CONFLICT ("tenantId", name) DO NOTHING;

-- Assign all permissions to Administrator role
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), r.id, p.id, now()
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'Administrator'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Assign read permissions to Viewer role
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), r.id, p.id, now()
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'Viewer' AND p.code LIKE '%.read'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Assign users to roles based on legacy role
INSERT INTO "UserRole" (id, "userId", "roleId", "createdAt")
SELECT gen_random_uuid(), u.id, r.id, now()
FROM "User" u
JOIN "Role" r ON u."tenantId" = r."tenantId"
WHERE 
    (u.role = 'ADMIN' AND r.name = 'Administrator') OR 
    (u.role != 'ADMIN' AND r.name = 'Viewer')
ON CONFLICT ("userId", "roleId") DO NOTHING;