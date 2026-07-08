const fs = require('fs');
const path = require('path');

const files = [
    'brands/page.tsx',
    'suppliers/page.tsx',
    'manufacturers/page.tsx',
    'channels/page.tsx',
    'compliance-types/page.tsx'
];

for (const f of files) {
    const filePath = path.join(__dirname, 'apps/frontend/app/master-data', f);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    const snippet = `
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    value={formData.status || 'ACTIVE'} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>`;

    if (!content.includes('value={formData.status')) {
        // Find the button row
        const searchString = '<div style={{ display: \'flex\', justifyContent: \'flex-end\', gap: \'1rem\', marginTop: \'1rem\' }}>';
        content = content.replace(searchString, snippet + '\n                ' + searchString);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${f}`);
    }
}
