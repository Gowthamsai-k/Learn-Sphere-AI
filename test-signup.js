const signup = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test-${Date.now()}@domain.com`,
        password: 'password123'
      })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('TEXT:', text.substring(0, 300));
  } catch (err) {
    console.error('ERROR:', err);
  }
};

signup();
