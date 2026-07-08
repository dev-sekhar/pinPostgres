const fs = require('fs');
const path = require('path');

const pages = [
  'brands/page.tsx',
  'channels/page.tsx',
  'compliance-types/page.tsx',
  'manufacturers/page.tsx',
  'suppliers/page.tsx'
];

pages.forEach(p => {
  const fullPath = path.join('apps/frontend/app/master-data', p);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Add import
  if (!content.includes('MediaGallery')) {
    content = content.replace(
      "import { Input } from '../../../components/ui/Input';",
      "import { Input } from '../../../components/ui/Input';\nimport { MediaGallery } from '../../../components/ui/MediaGallery';"
    );
  }

  // Determine entityType
  const entityTypeMap = {
    'brands': 'brand',
    'channels': 'channel',
    'compliance-types': 'complianceType',
    'manufacturers': 'manufacturer',
    'suppliers': 'supplier'
  };
  const entityType = entityTypeMap[p.split('/')[0]];

  // 2. Insert MediaGallery after </form> inside the modal
  const targetFormEnd = '</form>';
  const mediaGalleryCode = `\n              {editingItem && (\n                <div style={{ marginTop: '2rem' }}>\n                  <MediaGallery entityType="${entityType}" entityId={editingItem.id} />\n                </div>\n              )}`;
  
  if (!content.includes(`<MediaGallery entityType="${entityType}"`)) {
    // Find the last form tag because there's only one form in these pages
    const lastIndex = content.lastIndexOf('</form>');
    if (lastIndex !== -1) {
      content = content.slice(0, lastIndex + '</form>'.length) + mediaGalleryCode + content.slice(lastIndex + '</form>'.length);
    }
  }

  // Wait, also update the Card to have max-height and overflow
  content = content.replace(
    `<Card style={{ width: '100%', maxWidth: '500px', margin: '0 1rem', background: 'var(--bg-panel)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>`,
    `<Card style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', margin: '0 1rem', background: 'var(--bg-panel)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>`
  );

  fs.writeFileSync(fullPath, content);
});
