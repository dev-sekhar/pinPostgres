import fs from 'fs';
import path from 'path';
import { jsonSchemaToZod } from 'json-schema-to-zod';

const schemasDir = path.join(process.cwd(), 'schemas/json');
const outputDir = path.join(process.cwd(), 'src/generated');

fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));

let indexExports = '';

for (const file of files) {
  const schemaStr = fs.readFileSync(path.join(schemasDir, file), 'utf8');
  const schema = JSON.parse(schemaStr);
  const name = path.basename(file, '.json');

  const zodCode = jsonSchemaToZod(schema, { name: `${name}Schema` });

  const tsCode = `import { z } from 'zod';\n\nexport ${zodCode};\nexport type ${name} = z.infer<typeof ${name}Schema>;\n`;
  
  fs.writeFileSync(path.join(outputDir, `${name}.ts`), tsCode);
  indexExports += `export * from './${name}.js';\n`;
}

fs.writeFileSync(path.join(outputDir, 'index.ts'), indexExports);

console.log("Zod schemas generated successfully!");
