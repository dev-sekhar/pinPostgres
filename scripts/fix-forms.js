const fs = require('fs');
const files = [
  'apps/frontend/app/master-data/brands/page.tsx',
  'apps/frontend/app/master-data/channels/page.tsx',
  'apps/frontend/app/master-data/compliance-types/page.tsx',
  'apps/frontend/app/master-data/manufacturers/page.tsx',
  'apps/frontend/app/master-data/suppliers/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add useForm import if missing
  if (!content.includes('useForm')) {
    content = content.replace(/import \{ fetchApi \} from '[^']+';/, match => match + '\nimport { useForm } from \'react-hook-form\';');
  }

  // Replace formData state with useForm hook
  content = content.replace(/const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/, `const { register, handleSubmit: hookFormSubmit, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'ACTIVE'
    }
  });`);

  // Replace formData with data in onSubmit
  content = content.replace(/formData\.status/g, 'data.status');

  fs.writeFileSync(file, content);
}
