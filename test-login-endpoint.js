const login = async () => {
  try {
    // First, let's create a unique email
    const email = `login-test-${Date.now()}@domain.com`;
    
    // Sign up first
    console.log('Registering user...');
    const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Login Tester',
        email,
        password: 'password123'
      })
    });
    const signupText = await signupRes.text();
    console.log('Signup Response Status:', signupRes.status);
    console.log('Signup Response Text:', signupText.substring(0, 300));
    
  } catch (err) {
    console.error('ERROR:', err);
  }
};

login();
