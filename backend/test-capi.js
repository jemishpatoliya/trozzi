/**
 * Quick test to verify Meta CAPI is working
 */
require('dotenv').config();

const axios = require('axios');

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

async function testCAPI() {
  console.log('=== Meta CAPI Test ===');
  console.log('Pixel ID:', META_PIXEL_ID ? META_PIXEL_ID.substring(0, 4) + '****' : 'NOT SET');
  console.log('Access Token:', ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 4) + '****' : 'NOT SET');
  
  if (!META_PIXEL_ID || !ACCESS_TOKEN) {
    console.error('❌ Missing credentials');
    return;
  }

  const event = {
    data: [{
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      event_id: 'test_' + Date.now(),
      action_source: 'website',
      event_source_url: 'https://trozzi.in/test',
      user_data: {
        client_ip_address: '127.0.0.1',
        client_user_agent: 'Test/1.0'
      },
      custom_data: {
        content_ids: ['test-product-123'],
        content_type: 'product',
        content_name: 'Test Product',
        value: 999.00,
        currency: 'INR'
      }
    }],
    test_event_code: process.env.META_CAPI_TEST_EVENT_CODE || 'TEST14511'
  };

  const url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    console.log('\nSending test event to Meta...');
    const response = await axios.post(url, event, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS! Event sent to Meta');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED to send event');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCAPI();
