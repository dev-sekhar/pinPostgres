const fs = require('fs');
let schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

// The Asset model looks like this:
/*
model Asset {
    id          String   @id @default(uuid())
    tenantId    String
    name        String
    url         String
    checksum    String
    mimeType    String?
    sizeBytes   Int?
    status      String   @default("ACTIVE")
    metadata    Json?
    
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    deletedAt   DateTime?

    tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
*/

const targetAssetEnd = 'tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)';
const inverseRelations = `    tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

    productMedia ProductMedia[]
    brandMedia   BrandMedia[]
    supplierMedia SupplierMedia[]
    manufacturerMedia ManufacturerMedia[]
    complianceTypeMedia ComplianceTypeMedia[]
    channelMedia ChannelMedia[]`;

schema = schema.replace(targetAssetEnd, inverseRelations);

fs.writeFileSync('apps/backend/prisma/schema.prisma', schema);
