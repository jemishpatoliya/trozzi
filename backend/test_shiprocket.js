require('dotenv').config();
const axios = require('axios');

async function testShiprocket() {
  try {
    // Test with known AWB from logs
    const awb = "1319450866699";
    
    // Get token first
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    console.log('Testing Shiprocket API...');
    console.log('Email:', email ? 'CONFIGURED' : 'MISSING');
    console.log('Password:', password ? 'CONFIGURED' : 'MISSING');
    
    if (!email || !password) {
      console.log('❌ Shiprocket credentials not configured');
      return;
    }
    
    const loginResponse = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email, password }
    );
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtained successfully');
    
    // Test tracking API
    const trackingResponse = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = trackingResponse.data;
    console.log('\n=== Shiprocket API Response ===');
    console.log('Tracking Data:', !!data.tracking_data);
    
    if (data.tracking_data?.shipment_track?.[0]) {
      const currentStatus = data.tracking_data.shipment_track[0].current_status;
      console.log('✅ Current Status:', currentStatus);
      
      const activities = data.tracking_data?.shipment_track_activities;
      if (activities?.[0]) {
        const adminStatus = activities[0]['sr-status-label'];
        console.log('✅ Admin Status:', adminStatus);
      }
    } else {
      console.log('❌ No tracking data found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testShiprocket();
