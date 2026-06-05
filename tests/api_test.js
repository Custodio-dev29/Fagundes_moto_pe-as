const fetch = global.fetch || require('node-fetch');

const BASE = 'http://127.0.0.1:3000';

async function run() {
  try {
    const email = `test${Date.now()}@local.test`;
    const password = 'TestPass123!';

    console.log('Registering user:', email);
    let res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const reg = await res.json();
    console.log('Register response:', reg);
    if (!reg.success) {
      console.error('Register failed, aborting tests');
      process.exit(1);
    }

    const token = reg.token;
    if (!token) {
      console.error('No token returned on register, aborting');
      process.exit(1);
    }

    console.log('Token received (first 20 chars):', token.slice(0, 20) + '...');

    console.log('Calling GET /api/products with token...');
    res = await fetch(`${BASE}/api/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    let body;
    try { body = await res.json(); } catch(e) { body = await res.text(); }
    console.log('Body:', body);

    console.log('Test finished successfully');
    process.exit(0);
  } catch (e) {
    console.error('Test script error:', e);
    process.exit(2);
  }
}

run();
