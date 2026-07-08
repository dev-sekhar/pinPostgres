INSERT INTO "Permission" ("id", "code", "name", "module", "description", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'domain.read', 'Read Domain', 'Product', 'Allows reading domain', NOW(), NOW()),
(gen_random_uuid(), 'domain.create', 'Create Domain', 'Product', 'Allows creating domain', NOW(), NOW()),
(gen_random_uuid(), 'domain.update', 'Update Domain', 'Product', 'Allows updating domain', NOW(), NOW()),
(gen_random_uuid(), 'domain.delete', 'Delete Domain', 'Product', 'Allows deleting domain', NOW(), NOW()),
(gen_random_uuid(), 'category.read', 'Read Category', 'Product', 'Allows reading category', NOW(), NOW()),
(gen_random_uuid(), 'category.create', 'Create Category', 'Product', 'Allows creating category', NOW(), NOW()),
(gen_random_uuid(), 'category.update', 'Update Category', 'Product', 'Allows updating category', NOW(), NOW()),
(gen_random_uuid(), 'category.delete', 'Delete Category', 'Product', 'Allows deleting category', NOW(), NOW()),
(gen_random_uuid(), 'productFamily.read', 'Read Product Family', 'Product', 'Allows reading product family', NOW(), NOW()),
(gen_random_uuid(), 'productFamily.create', 'Create Product Family', 'Product', 'Allows creating product family', NOW(), NOW()),
(gen_random_uuid(), 'productFamily.update', 'Update Product Family', 'Product', 'Allows updating product family', NOW(), NOW()),
(gen_random_uuid(), 'productFamily.delete', 'Delete Product Family', 'Product', 'Allows deleting product family', NOW(), NOW()),
(gen_random_uuid(), 'asset.read', 'Read Asset', 'System', 'Allows reading digital assets', NOW(), NOW()),
(gen_random_uuid(), 'asset.create', 'Create Asset', 'System', 'Allows uploading digital assets', NOW(), NOW()),
(gen_random_uuid(), 'asset.update', 'Update Asset', 'System', 'Allows updating digital assets', NOW(), NOW()),
(gen_random_uuid(), 'asset.delete', 'Delete Asset', 'System', 'Allows deleting digital assets', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
