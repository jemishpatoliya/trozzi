# 🚀 Production Readiness Checklist: PhonePe + Shiprocket System

## Environment Variables
- [ ] PHONEPE_MERCHANT_ID (from PhonePe dashboard)
- [ ] PHONEPE_BASE_URL (sandbox: https://api-preprod.phonepe.com/apis/pg-sandbox)
- [ ] PHONEPE_SALT_KEY (from PhonePe dashboard)
- [ ] PHONEPE_SALT_INDEX (usually 1)
- [ ] PHONEPE_WEBHOOK_USERNAME (basic auth for webhooks)
- [ ] PHONEPE_WEBHOOK_PASSWORD (basic auth for webhooks)
- [ ] PHONEPE_CALLBACK_URL (https://yourdomain.com/api/payments/webhook/phonepe)
- [ ] PHONEPE_REDIRECT_URL (https://yourdomain.com/orders)
- [ ] SHIPROCKET_EMAIL (Shiprocket account email)
- [ ] SHIPROCKET_PASSWORD (Shiprocket account password)
- [ ] SHIPROCKET_WEBHOOK_SECRET (generate strong secret)
- [ ] JWT_SECRET (strong secret for auth)
- [ ] MONGODB_URI (production MongoDB Atlas)

## Webhook Configuration
- [ ] PhonePe webhook URL configured in PhonePe dashboard
- [ ] Shiprocket webhook URL configured in Shiprocket panel
- [ ] Webhook endpoints publicly reachable (HTTPS in production)
- [ ] Firewall allows inbound traffic from PhonePe/Shiprocket IPs

## Database
- [ ] MongoDB indexes: payments.providerOrderId, orders.orderNumber, shipments.awbNumber
- [ ] Backup strategy enabled
- [ ] Connection pooling configured
- [ ] TTL/indexing for eventHistory arrays

## Rate Limiting & Security
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] Request size limits enforced
- [ ] Helmet security headers configured
- [ ] CORS restricted to known domains in production

## Logging & Monitoring
- [ ] Structured logging (JSON) enabled
- [ ] Webhook verification failures logged with IP/payload
- [ ] Failed Shiprocket retries logged
- [ ] Error alerting (e.g., Slack, email) configured
- [ ] APM/monitoring tool integrated

## SSL/HTTPS
- [ ] Valid SSL certificate installed
- [ ] All endpoints force HTTPS in production
- [ ] HSTS headers enabled

## Performance & Scaling
- [ ] Node process manager (PM2/cluster) configured
- [ ] Memory and CPU limits set
- [ ] Graceful shutdown handling
- [ ] Load balancer configured if needed

## Admin Controls
- [ ] Admin override endpoints tested:
  - Retry shipment
  - Cancel shipment
  - Mark order delivered
  - Refund payment
- [ ] Role-based access enforced
- [ ] Audit trail enabled for admin actions

## End-to-End Testing
- [ ] PhonePe payment initiation tested
- [ ] PhonePe webhook receiving and verifying
- [ ] Shiprocket order creation tested
- [ ] Shiprocket webhook receiving and verifying
- [ ] Retry worker functional (cron every 5 min)
- [ ] State machine blocking invalid transitions
- [ ] Socket.IO real-time updates verified in admin and user dashboards
- [ ] Browser-close scenario tested (payment completes, user offline)

## Go-Live Checklist
- [ ] Environment variables set to production values
- [ ] Database indexes created
- [ ] Cron job deployed
- [ ] SSL certificate valid
- [ ] Monitoring and alerts active
- [ ] Backup verified
- [ ] Load test completed
- [ ] Full smoke test passed

## Post-Launch
- [ ] Monitor PhonePe/Shiprocket API rate limits
- [ ] Check webhook delivery logs for failures
- [ ] Verify real-time dashboard performance
- [ ] Schedule periodic state machine audit
