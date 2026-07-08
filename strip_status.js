const fs = require('fs');
const path = require('path');

const routeFiles = [
    'brandRoutes.ts',
    'supplierRoutes.ts',
    'manufacturerRoutes.ts',
    'channelRoutes.ts',
    'complianceTypeRoutes.ts',
    'categoryRoutes.ts',
    'productFamilyRoutes.ts',
    'domainRoutes.ts',
    'productRoutes.ts'
];

for (const f of routeFiles) {
    const filePath = path.join(__dirname, 'apps/backend/src', f);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // For PUT and PATCH (excluding the new PATCH /:id/status route) we will insert `delete req.body.status;` at the beginning.
    // A simple way is to replace `async (req: AuthRequest, res) => {` 
    // with `async (req: AuthRequest, res) => {\n    delete req.body.status;`
    // but ONLY for PUT and PATCH. Wait, let's just do a regex replace for `router.put(` and `router.patch(`
    
    // Split by lines
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if ((lines[i].includes('router.put(') || lines[i].includes('router.patch(')) 
             && !lines[i].includes('/status')) {
            // Find the opening brace of the handler
            for (let j = i; j < i + 3 && j < lines.length; j++) {
                if (lines[j].includes('{')) {
                    if (!lines[j+1].includes('delete req.body.status;')) {
                        lines.splice(j + 1, 0, '    delete req.body.status; // Prevent status update via generic endpoint');
                    }
                    break;
                }
            }
        }
    }
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Stripped status from PUT/PATCH in ${f}`);
}
