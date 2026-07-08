INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'Administrator'
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );
