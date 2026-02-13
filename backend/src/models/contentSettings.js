const mongoose = require('mongoose');

const SINGLETON_ID = 'content_settings';

const ContentSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SINGLETON_ID },
    brandLogoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    defaultAvatarUrl: {
      type: String,
      trim: true,
      default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    },
    bioMaxLength: { type: Number, default: 500 },
    showOrderHistory: { type: Boolean, default: true },
    showWishlistCount: { type: Boolean, default: true },
    enableProfileEditing: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ContentSettingsModel =
  mongoose.models.ContentSettings || mongoose.model('ContentSettings', ContentSettingsSchema);

async function getOrCreateContentSettings() {
  const existing = await ContentSettingsModel.findById(SINGLETON_ID);
  if (existing) return existing;

  try {
    const created = await ContentSettingsModel.create({ _id: SINGLETON_ID });
    return created;
  } catch (_e) {
    const retry = await ContentSettingsModel.findById(SINGLETON_ID);
    if (retry) return retry;
    throw _e;
  }
}

module.exports = {
  ContentSettingsModel,
  getOrCreateContentSettings,
  SINGLETON_ID,
};
