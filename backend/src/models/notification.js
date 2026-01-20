const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      default: null,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, required: true, trim: true, maxlength: 50, index: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

module.exports = { Notification, NotificationModel: Notification };
