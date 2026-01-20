const nodemailer = require('nodemailer');

// Abstract providers
class SMSProvider {
  async send({ to, body, templateId, variables }) {
    throw new Error('SMSProvider.send() must be implemented');
  }
}

class EmailProvider {
  async send({ to, subject, body, templateId, variables }) {
    throw new Error('EmailProvider.send() must be implemented');
  }
}

class WhatsAppProvider {
  async send({ to, body, templateId, variables }) {
    throw new Error('WhatsAppProvider.send() must be implemented');
  }
}

// Concrete implementations
class MSG91SMS extends SMSProvider {
  constructor() {
    super();
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.sender = process.env.MSG91_SENDER || 'TROZZY';
  this.route = process.env.MSG91_ROUTE || '4';
    this.country = process.env.MSG91_COUNTRY || '91';
  }

  async send({ to, body, templateId, variables = {} }) {
    if (!this.authKey) throw new Error('MSG91_AUTH_KEY missing');
    const axios = require('axios');
    try {
      const payload = {
        authkey: this.authKey,
        sender: this.sender,
        route: this.route,
        country: this.country,
        sms: [to],
        template_id: templateId,
        variables,
        response: 'json',
      };
      const res = await axios.post('https://control.msg91.com/api/v5/flow/', payload);
      if (res.data?.type === 'success') {
        return { success: true, messageId: res.data.messageid };
      } else {
        throw new Error(res.data?.message || 'MSG91 SMS failed');
      }
    } catch (e) {
      console.error('MSG91 SMS error:', e);
      throw e;
    }
  }
}

class TwilioSMS extends SMSProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
  }

  async send({ to, body, templateId, variables = {} }) {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials missing');
    }
    const twilio = require('twilio')(this.accountSid, this.authToken);
    try {
      const message = await twilio.messages.create({
        body,
        from: this.fromNumber,
        to,
      });
      return { success: true, messageId: message.sid };
    } catch (e) {
      console.error('Twilio SMS error:', e);
      throw e;
    }
  }
}

class SMTPEmail extends EmailProvider {
  constructor() {
    super();
    this.transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send({ to, subject, body, templateId, variables = {} }) {
    if (!process.env.SMTP_USER) {
      throw new Error('SMTP credentials missing');
    }
    try {
      const renderedBody = this.renderTemplate(body, variables);
      const info = await this.transport.sendMail({
        from: process.env.SMTP_FROM || '"TROZZY" <noreply@trozzy.com>',
        to,
        subject,
        html: renderedBody,
      });
      return { success: true, messageId: info.messageId };
    } catch (e) {
      console.error('SMTP Email error:', e);
      throw e;
    }
  }

  renderTemplate(template, variables) {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }
}

class SendGridEmail extends EmailProvider {
  constructor() {
    this.sg = require('@sendgrid/mail');
    this.sg.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send({ to, subject, body, templateId, variables = {} }) {
    if (!process.env.SENDGRID_API_KEY) throw new Error('SendGrid API key missing');
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM || '"TROZZY" <noreply@trozzy.com>',
        subject,
        html: this.renderTemplate(body, variables),
      };
      const response = await this.sg.send(msg);
      if (response[0]?.statusCode === 202) {
        return { success: true, messageId: response[0].headers['x-message-id'] };
      } else {
        throw new Error('SendGrid email failed');
      }
    } catch (e) {
      console.error('SendGrid Email error:', e);
      throw e;
    }
  }

  renderTemplate(template, variables) {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }
}

// Notification service
class NotificationService {
  constructor() {
    this.smsProvider = this.initSMSProvider();
    this.emailProvider = this.initEmailProvider();
    this.whatsappProvider = this.initWhatsAppProvider();
  }

  initSMSProvider() {
    const provider = process.env.SMS_PROVIDER?.toLowerCase();
    switch (provider) {
      case 'msg91': return new MSG91SMS();
      case 'twilio': return new TwilioSMS();
      default: return new MSG91SMS(); // default
    }
  }

  initEmailProvider() {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
    switch (provider) {
      case 'sendgrid': return new SendGridEmail();
      case 'smtp': return new SMTPEmail();
      default: return new SMTPEmail(); // default
    }
  }

  initWhatsAppProvider() {
    // Placeholder for future WhatsApp integration
    return null;
  }

  async sendSms({ to, templateId, variables }) {
    const templates = require('./notificationTemplates');
    const template = templates.SMS[templateId];
    if (!template) throw new Error(`SMS template ${templateId} not found`);
    try {
      const result = await this.smsProvider.send({ to, body: template.text, templateId, variables });
      await this.logNotification({ type: 'sms', to, templateId, variables, result });
      return result;
    } catch (e) {
      await this.logNotification({ type: 'sms', to, templateId, variables, error: e.message });
      throw e;
    }
  }

  async sendEmail({ to, templateId, variables }) {
    const templates = require('./notificationTemplates');
    const template = templates.EMAIL[templateId];
    if (!template) throw new Error(`Email template ${templateId} not found`);
    try {
      const result = await this.emailProvider.send({ to, subject: template.subject, body: template.html, templateId, variables });
      await this.logNotification({ type: 'email', to, templateId, variables, result });
      return result;
    } catch (e) {
      await this.logNotification({ type: 'email', to, templateId, variables, error: e.message });
      throw e;
    }
  }

  async sendWhatsApp({ to, templateId, variables }) {
    if (!this.whatsappProvider) return { success: false, reason: 'WhatsApp not configured' };
    const templates = require('./notificationTemplates');
    const template = templates.WHATSAPP[templateId];
    if (!template) throw new Error(`WhatsApp template ${templateId} not found`);
    try {
      const result = await this.whatsappProvider.send({ to, body: template.text, templateId, variables });
      await this.logNotification({ type: 'whatsapp', to, templateId, variables, result });
      return result;
    } catch (e) {
      await this.logNotification({ type: 'whatsapp', to, templateId, variables, error: e.message });
      throw e;
    }
  }

  async logNotification({ type, to, templateId, variables, result, error }) {
    const mongoose = require('mongoose');
    const NotificationLog = mongoose.models.NotificationLog || mongoose.model('NotificationLog', new mongoose.Schema({
      type: String, // sms, email, whatsapp
      to: String,
      templateId: String,
      variables: mongoose.Schema.Types.Mixed,
      status: { type: String, enum: ['sent', 'failed', 'retry'], default: 'sent' },
      providerMessageId: String,
      error: String,
      sentAt: { type: Date, default: Date.now },
      retryCount: { type: Number, default: 0 },
      nextRetryAt: { type: Date },
    }, { timestamps: true }));
    await NotificationLog.create({
      type,
      to,
      templateId,
      variables,
      status: error ? 'failed' : (result?.success ? 'sent' : 'failed'),
      providerMessageId: result?.messageId || '',
      error: error || null,
      retryCount: 0,
    });
  }

  async retryFailedNotifications() {
    const mongoose = require('mongoose');
    const NotificationLog = mongoose.models.NotificationLog;
    const now = new Date();
    const failed = await NotificationLog.find({
      status: 'failed',
      nextRetryAt: { $lte: now },
      retryCount: { $lt: 3 },
    });
    for (const log of failed) {
      try {
        if (log.type === 'sms') await this.sendSms({ to: log.to, templateId: log.templateId, variables: log.variables });
        if (log.type === 'email') await this.sendEmail({ to: log.to, templateId: log.templateId, variables: log.variables });
        // WhatsApp optional
      } catch (e) {
        await NotificationLog.updateOne(
          { _id: log._id },
          { $set: { retryCount: log.retryCount + 1, nextRetryAt: new Date(now.getTime() + 5 * 60 * 1000) }, $push: { error: e.message, sentAt: now } }
        );
      }
    }
  }
}

module.exports = {
  NotificationService,
  SMSProvider,
  EmailProvider,
  WhatsAppProvider,
  MSG91SMS,
  TwilioSMS,
  SMTPEmail,
  SendGridEmail,
};
