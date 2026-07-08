const fs = require('fs');
const path = require('path');

const files = [
    'apps/frontend/app/products/new/page.tsx',
    'apps/frontend/app/products/[id]/edit/page.tsx'
];

for (const f of files) {
    const filePath = path.join(__dirname, f);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Add status to formData defaults if not there
    if (!content.includes("status: 'ACTIVE'")) {
        content = content.replace(
            "price: '',", 
            "price: '',\n    status: 'ACTIVE',"
        );
    }

    // Add status to fetchApi body in both POST and PUT
    if (!content.includes("status: formData.status")) {
        content = content.replace(
            "channelIds: selectedChannelIds", 
            "channelIds: selectedChannelIds,\n          status: formData.status"
        );
    }

    // Insert the status select dropdown before the "Attributes" section
    const snippet = `
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
            <select 
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
`;

    if (!content.includes('value={formData.status}')) {
        content = content.replace(
            '<div style={{ marginTop: \'2rem\' }}>\n            <h2', 
            snippet + '\n          <div style={{ marginTop: \'2rem\' }}>\n            <h2'
        );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${f}`);
}
