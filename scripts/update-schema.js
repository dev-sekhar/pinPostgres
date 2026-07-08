const fs = require('fs');
let schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

// Update ProductMedia
schema = schema.replace(
  'productId String',
  'assetId String?\n    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)\n\n    productId String'
);

// Append new models
const newModels = `
model BrandMedia {
    id        String   @id @default(uuid())
    url       String
    altText   String?
    sortOrder Int      @default(0)
    
    brandId   String
    brand     Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
    
    assetId   String?
    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
    
    tenantId  String   
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime?

    @@index([brandId])
    @@index([tenantId])
}

model SupplierMedia {
    id        String   @id @default(uuid())
    url       String
    altText   String?
    sortOrder Int      @default(0)
    
    supplierId String
    supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
    
    assetId   String?
    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
    
    tenantId  String   
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime?

    @@index([supplierId])
    @@index([tenantId])
}

model ManufacturerMedia {
    id        String   @id @default(uuid())
    url       String
    altText   String?
    sortOrder Int      @default(0)
    
    manufacturerId String
    manufacturer   Manufacturer @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)
    
    assetId   String?
    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime?

    @@index([manufacturerId])
}

model ComplianceTypeMedia {
    id        String   @id @default(uuid())
    url       String
    altText   String?
    sortOrder Int      @default(0)
    
    complianceTypeId String
    complianceType   ComplianceType @relation(fields: [complianceTypeId], references: [id], onDelete: Cascade)
    
    assetId   String?
    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime?

    @@index([complianceTypeId])
}

model ChannelMedia {
    id        String   @id @default(uuid())
    url       String
    altText   String?
    sortOrder Int      @default(0)
    
    channelId String
    channel   Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
    
    assetId   String?
    asset     Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
    
    tenantId  String   
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime?

    @@index([channelId])
    @@index([tenantId])
}
`;

schema = schema + '\n' + newModels;

fs.writeFileSync('apps/backend/prisma/schema.prisma', schema);
