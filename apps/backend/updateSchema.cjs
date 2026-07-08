const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const models = ['Category', 'Domain', 'Product', 'ProductFamily', 'Tenant', 'User'];
models.forEach(model => {
    const regex = new RegExp(`(model ${model} \\{[^}]*?)(\\n\\s*@@)`, 'g');
    content = content.replace(regex, `$1\n    status      String   @default("ACTIVE")$2`);
});
fs.writeFileSync('prisma/schema.prisma', content);
console.log('Done');
