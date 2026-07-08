export const permissions = [
    // Settings
    { code: "settings.read", name: "Read Settings", module: "System", description: "Allows reading settings" },
    { code: "settings.update", name: "Update Settings", module: "System", description: "Allows updating settings" },
];

const entities = [
    { key: "domain", name: "Domain", module: "Product" },
    { key: "category", name: "Category", module: "Product" },
    { key: "productFamily", name: "Product Family", module: "Product" },
    { key: "brand", name: "Brand", module: "Product" },
    { key: "supplier", name: "Supplier", module: "Product" },
    { key: "manufacturer", name: "Manufacturer", module: "Product" },
    { key: "channel", name: "Channel", module: "Product" },
    { key: "complianceType", name: "Compliance Type", module: "Product" },
    { key: "product", name: "Product", module: "Product" },
    { key: "attributeDefinition", name: "Attribute Definition", module: "Product" },
    { key: "user", name: "User", module: "System" },
    { key: "role", name: "Role", module: "System" },
];

for (const entity of entities) {
    permissions.push({ code: `${entity.key}.read`, name: `Read ${entity.name}`, module: entity.module, description: `Allows reading ${entity.name.toLowerCase()}` });
    permissions.push({ code: `${entity.key}.create`, name: `Create ${entity.name}`, module: entity.module, description: `Allows creating ${entity.name.toLowerCase()}` });
    permissions.push({ code: `${entity.key}.update`, name: `Update ${entity.name}`, module: entity.module, description: `Allows updating ${entity.name.toLowerCase()}` });
    permissions.push({ code: `${entity.key}.delete`, name: `Delete ${entity.name}`, module: entity.module, description: `Allows deleting ${entity.name.toLowerCase()}` });
    permissions.push({ code: `${entity.key}.status.update`, name: `Update ${entity.name} Status`, module: entity.module, description: `Allows updating status of ${entity.name.toLowerCase()}` });
}
