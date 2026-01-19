const express = require('express');
const router = express.Router();

const { getOrCreateContentSettings } = require('../models/contentSettings');

router.get('/', async (_req, res) => {
  try {
    const settings = await getOrCreateContentSettings();

    res.json({
      success: true,
      data: {
        defaultAvatarUrl: settings.defaultAvatarUrl,
        bioMaxLength: settings.bioMaxLength,
        showOrderHistory: settings.showOrderHistory,
        showWishlistCount: settings.showWishlistCount,
        enableProfileEditing: settings.enableProfileEditing,
      },
    });
  } catch (error) {
    console.error('Public content settings GET error:', error);
    res.status(500).json({ success: false, message: 'Failed to load content settings' });
  }
});

module.exports = router;
