async function test() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tony@stark.com', password: 'password123' })
  });
  const { token } = await loginRes.json();
  
  const attrRes = await fetch('http://localhost:3001/api/attributes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const attrs = await attrRes.json();
  console.log("Attributes list:", attrs);

  if (attrs.length > 0) {
    const singleRes = await fetch(`http://localhost:3001/api/attributes/${attrs[0].id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`GET single attr status:`, singleRes.status);
    const attr = await singleRes.json();
    console.log("Single attr:", attr);
  }
}

test();
