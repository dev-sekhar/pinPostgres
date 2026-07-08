const fs = require('fs');
const path = require('path');

const prismaPath = path.join(__dirname, 'apps/backend/prisma/schema.prisma');
let content = fs.readFileSync(prismaPath, 'utf8');

// Add Asset model
const assetModel = `
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

    @@unique([tenantId, checksum])
    @@index([tenantId])
}
`;

if (!content.includes('model Asset')) {
    content += assetModel;
}

// Add assets array to Tenant
if (!content.includes('assets                Asset[]')) {
    const tenantRegex = /(model Tenant \{[\s\S]*?)(^\})/m;
    content = content.replace(tenantRegex, '$1    assets                Asset[]\n$2');
}

fs.writeFileSync(prismaPath, content);
console.log('Updated schema.prisma');
