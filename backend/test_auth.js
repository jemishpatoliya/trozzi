require('dotenv').config();
const axios = require('axios');

async function testShiprocketAuth() {
  try {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    console.log('Testing Shiprocket Login...');
    console.log('Email:', email);
    console.log('Password:', password ? '***CONFIGURED***' : 'MISSING');
    
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email, password },
      { timeout: 30000 }
    );
    
    console.log('\n✅ LOGIN SUCCESS!');
    console.log('Token:', response.data.token.substring(0, 50) + '...');
    console.log('Expires:', response.data.expires_in);
    
  } catch (error) {
    console.log('\n❌ LOGIN FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('\n🔴 CAUSE: Invalid credentials or account blocked');
    }
  }
}

testShiprocketAuth();
