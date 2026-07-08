const fs = require('fs');
const path = require('path');

// 1. Update Master Data Pages
const masterDataFiles = [
    { file: 'brands/page.tsx', endpoint: 'brands' },
    { file: 'suppliers/page.tsx', endpoint: 'suppliers' },
    { file: 'manufacturers/page.tsx', endpoint: 'manufacturers' },
    { file: 'channels/page.tsx', endpoint: 'channels' },
    { file: 'compliance-types/page.tsx', endpoint: 'complianceTypes' }
];

for (const mf of masterDataFiles) {
    const p = path.join(__dirname, 'apps/frontend/app/master-data', mf.file);
    if (!fs.existsSync(p)) continue;
    let content = fs.readFileSync(p, 'utf8');

    // Inside handleSubmit:
    const searchString = `
      if (editingItem) {
        await fetchApi(\`/api/${mf.endpoint}/\${editingItem.id}\`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });`;
        
    const replaceString = `
      if (editingItem) {
        await fetchApi(\`/api/${mf.endpoint}/\${editingItem.id}\`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        if (editingItem.status !== formData.status) {
            await fetchApi(\`/api/${mf.endpoint}/\${editingItem.id}/status\`, {
                method: 'PATCH',
                body: JSON.stringify({ status: formData.status })
            });
        }`;

    if (!content.includes('editingItem.status !== formData.status')) {
        content = content.replace(searchString, replaceString);
        fs.writeFileSync(p, content);
        console.log(`Updated API call in ${mf.file}`);
    }
}

// 2. Update Product Edit Page
const productEditFile = path.join(__dirname, 'apps/frontend/app/products/[id]/edit/page.tsx');
if (fs.existsSync(productEditFile)) {
    let content = fs.readFileSync(productEditFile, 'utf8');
    
    const searchString = `
      await fetchApi(\`/api/products/\${params.id}\`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          productFamilyId: selectedFamilyId,
          attributes: attributesObj,
          brandId: selectedBrandId || undefined,
          supplierId: selectedSupplierId || undefined,
          manufacturerId: selectedManufacturerId || undefined,
          complianceTypeIds: selectedComplianceTypeIds,
          channelIds: selectedChannelIds,
          status: formData.status
        }),
      });`;
      
    const replaceString = `
      await fetchApi(\`/api/products/\${params.id}\`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          productFamilyId: selectedFamilyId,
          attributes: attributesObj,
          brandId: selectedBrandId || undefined,
          supplierId: selectedSupplierId || undefined,
          manufacturerId: selectedManufacturerId || undefined,
          complianceTypeIds: selectedComplianceTypeIds,
          channelIds: selectedChannelIds,
        }),
      });

      // Update status separately if it changed
      if (product && product.status !== formData.status) {
          await fetchApi(\`/api/products/\${params.id}/status\`, {
              method: 'PATCH',
              body: JSON.stringify({ status: formData.status })
          });
      }`;

    if (!content.includes('product.status !== formData.status')) {
        content = content.replace(searchString, replaceString);
        fs.writeFileSync(productEditFile, content);
        console.log('Updated API call in products/[id]/edit/page.tsx');
    }
}
