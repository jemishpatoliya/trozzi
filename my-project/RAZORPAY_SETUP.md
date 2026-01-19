# Razorpay Payment Gateway Setup Guide

## Step 1: Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account or login if you already have one
3. Complete the onboarding process

## Step 2: Add Your Website for Verification

During the account setup, Razorpay will ask for your website link:

### For Development/Testing:
- **Website Link**: `http://localhost:3000` (if using React dev server)
- **Purpose**: Development and testing

### For Production:
- **Website Link**: `https://yourdomain.com` (your actual domain)
- **Purpose**: Live payments

## Step 3: Get Your API Keys

After verification, you'll get your API keys from the Razorpay dashboard:

1. Go to **Settings** → **API Keys**
2. You'll find:
   - **Key ID**: `rzp_live_XXXXXXXXXXXX` (for production)
   - **Key Secret**: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - **Test Keys**: `rzp_test_XXXXXXXXXXXX` (for testing)

## Step 4: Configure Environment Variables

### Backend Configuration (`trozzy-admin-suite-main/server/.env`):
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
JWT_SECRET=your-super-secret-jwt-key
```

### Frontend Configuration (`my-project/.env`):
```env
REACT_APP_API_URL=http://localhost:5050
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

## Step 5: Website Requirements for Razorpay

Your website should have:

1. **Privacy Policy** page
2. **Terms of Service** page  
3. **Refund/Cancellation Policy** page
4. **Contact Information** page
5. **About Us** page
6. **SSL Certificate** (HTTPS for production)

## Step 6: Webhook Setup

1. In Razorpay dashboard, go to **Settings** → **Webhooks**
2. Add webhook URL: `http://localhost:5050/api/payments/webhook` (for development)
3. For production: `https://yourdomain.com/api/payments/webhook`
4. Select events: `payment.captured`, `payment.failed`

## Step 7: Test Integration

1. Use test credentials first
2. Make a small test payment (₹1-₹5)
3. Check if payment is recorded in your database
4. Verify webhook is working

## Common Issues & Solutions

### Issue: "Website not verified"
- **Solution**: Ensure your website has all required pages (Privacy Policy, Terms, etc.)
- **Solution**: Make sure your website is accessible and not under construction

### Issue: "Invalid signature"
- **Solution**: Check your webhook secret configuration
- **Solution**: Ensure webhook URL is correct and accessible

### Issue: "Payment failed"
- **Solution**: Verify your API keys are correct
- **Solution**: Check if your backend is running and accessible

## Production Checklist

- [ ] Switch to live API keys
- [ ] Update frontend Razorpay key ID
- [ ] Configure production webhook URL
- [ ] Enable HTTPS on your website
- [ ] Test with actual payment (small amount)
- [ ] Set up proper error handling
- [ ] Monitor payment failures

## Support

If you face any issues:
1. Check Razorpay [Documentation](https://razorpay.com/docs)
2. Contact Razorpay support at [support@razorpay.com](mailto:support@razorpay.com)
3. Check your server logs for detailed error messages

## Security Notes

- Never expose your Key Secret in frontend code
- Always use HTTPS in production
- Keep your webhook secret secure
- Regularly rotate your API keys
- Monitor for suspicious payment activities
