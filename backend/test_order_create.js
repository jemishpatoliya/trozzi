require('dotenv').config();
const axios = require('axios');

async function testOrderCreation() {
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginRes = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      }
    );
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test order creation API
    console.log('\nStep 2: Testing order creation API...');
    const testPayload = {
      order_id: "TEST-ORDER-001",
      order_date: "2026-03-09",
      pickup_location: "work",
      channel_id: "",
      comment: "Test order",
      billing_customer_name: "Test User",
      billing_last_name: "",
      billing_address: "123 Test Street",
      billing_address_2: "",
      billing_city: "Mumbai",
      billing_state: "Maharashtra",
      billing_pincode: "400001",
      billing_country: "India",
      billing_email: "test@test.com",
      billing_phone: "9876543210",
      shipping_is_billing: true,
      order_items: [{
        name: "Test Product",
        sku: "TEST-SKU-001",
        units: 1,
        selling_price: 100
      }],
      payment_method: "Prepaid",
      shipping_charges: 0,
      sub_total: 100,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };
    
    const orderRes = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      testPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    console.log('✅ Order creation successful!');
    console.log('Response:', JSON.stringify(orderRes.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Order creation failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('\n🔴 CAUSE: API access forbidden');
      console.log('Possible reasons:');
      console.log('1. Account not verified by Shiprocket');
      console.log('2. API access disabled for this account');
      console.log('3. Account suspended');
      console.log('\n💡 SOLUTION: Contact Shiprocket support');
    }
  }
}

testOrderCreation();
