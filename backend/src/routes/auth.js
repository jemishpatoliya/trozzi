const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { UserModel } = require('../models/user');
const auth = require('../middleware/auth');
const { getOrCreateContentSettings } = require('../models/contentSettings');
const { sendMail } = require('../services/mailer');

function pickUserForClient(userDoc, settings) {
    const u = userDoc && typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
    if (!u) return u;

    const avatarUrl = String(u.avatarUrl || '').trim();
    const defaultAvatarUrl = settings ? String(settings.defaultAvatarUrl || '').trim() : '';

    return {
        ...u,
        avatarUrl: avatarUrl || defaultAvatarUrl,
        bio: String(u.bio || ''),
    };
}

// POST /api/auth/login - Login user
router.post('/login', [
    body('email')
        .notEmpty()
        .withMessage('Please provide a valid email address')
        .isEmail()
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await UserModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        user.lastActiveAt = new Date();
        await user.save();

        // Generate token
        const token = user.generateToken();

        // Remove password from response
        user.password = undefined;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// POST /api/auth/register - Register new user
router.post('/register', [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isString()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isString()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .notEmpty()
        .withMessage('Please provide a valid email address')
        .isEmail()
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('phone')
        .optional()
        .isString()
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be between 10 and 15 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'moderator', 'user'])
        .withMessage('Role must be admin, moderator, or user')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }
    try {
        const { firstName, lastName, email, password, phone, role = 'user' } = req.body;

        // Check if user already exists
        const existingUserModel = await UserModel.findOne({ email });

        if (existingUserModel) {
            return res.status(409).json({
                success: false,
                message: 'UserModel with this email already exists'
            });
        }

        // Create new user
        const user = new UserModel({
            firstName,
            lastName,
            email,
            password,
            phone,
            role
        });

        await user.save();

        // Remove password from response
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'UserModel registered successfully',
            data: user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// POST /api/auth/forgot-password - Request password reset link
router.post('/forgot-password', [
    body('email')
        .notEmpty()
        .withMessage('Please provide a valid email address')
        .isEmail()
        .normalizeEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }

    try {
        const email = String(req.body?.email ?? '').trim().toLowerCase();

        let devResetUrl = null;

        // Always return success to avoid leaking whether an email exists
        const user = await UserModel.findOne({ email }).select('+resetPasswordTokenHash +resetPasswordExpires');
        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            user.resetPasswordTokenHash = tokenHash;
            user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();

            const envAppBaseUrl = String(process.env.APP_BASE_URL || '').trim();
            const originHeader = String(req.headers?.origin || '').trim();
            const inferredBaseUrl = originHeader || '';
            const appBaseUrl = envAppBaseUrl || inferredBaseUrl;

            const resetUrl = appBaseUrl
                ? `${appBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`
                : `RESET_TOKEN=${rawToken}`;

            if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
                devResetUrl = appBaseUrl
                    ? `${appBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`
                    : `/reset-password?token=${rawToken}`;
            }

            console.log('🔐 Password reset requested for:', email);
            console.log('🔗 Reset link/token:', resetUrl);

            if (appBaseUrl) {
                try {
                    await sendMail({
                        to: user.email,
                        subject: 'Reset your password',
                        html: `
                          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
                            <h2 style="margin: 0 0 12px 0;">Password reset</h2>
                            <p style="margin: 0 0 12px 0;">We received a request to reset your password.</p>
                            <p style="margin: 0 0 12px 0;">Click this link to reset your password (valid for 1 hour):</p>
                            <p style="margin: 0 0 16px 0;">
                              <a href="${resetUrl}" style="color: #2563eb;">Reset Password</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #555;">If you didn’t request this, you can ignore this email.</p>
                          </div>
                        `,
                    });
                } catch (mailError) {
                    console.error('Forgot password email send error:', mailError);
                }
            } else {
                console.warn('APP_BASE_URL missing and Origin header missing; forgot-password email not sent.');
            }
        }

        return res.json({
            success: true,
            message: 'If an account exists for this email, a password reset link has been generated.',
            ...(devResetUrl ? { data: { resetUrl: devResetUrl } } : {}),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process forgot password request'
        });
    }
});

// POST /api/auth/reset-password - Reset password using token
router.post('/reset-password', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => error.msg)
        });
    }

    try {
        const token = String(req.body?.token ?? '').trim();
        const newPassword = String(req.body?.newPassword ?? '');

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await UserModel.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpires: { $gt: new Date() },
        }).select('+password +resetPasswordTokenHash +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.password = newPassword;
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const settings = await getOrCreateContentSettings();
        res.json({
            success: true,
            data: pickUserForClient(req.user, settings),
        });
    } catch (error) {
        console.error('Auth me error:', error);
        res.json({
            success: true,
            data: req.user,
        });
    }
});

router.post('/ping', auth, async (req, res) => {
    try {
        await UserModel.findByIdAndUpdate(
            req.user._id,
            { $set: { lastActiveAt: new Date() } },
            { new: false }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Auth ping error:', error);
        res.status(500).json({ success: false, message: 'Failed to update activity' });
    }
});

// PUT /api/auth/me - Update current user profile/address
router.put('/me', auth, async (req, res) => {
    try {
        const settings = await getOrCreateContentSettings();

        if (!settings.enableProfileEditing) {
            return res.status(403).json({ success: false, message: 'Profile editing is disabled' });
        }

        const allowed = ['firstName', 'lastName', 'phone', 'address', 'bio', 'avatarUrl'];
        const next = {};
        for (const k of allowed) {
            if (req.body?.[k] !== undefined) next[k] = req.body[k];
        }

        if (next.bio !== undefined) {
            const bio = String(next.bio ?? '');
            if (bio.length > Number(settings.bioMaxLength ?? 500)) {
                return res.status(400).json({
                    success: false,
                    message: `Bio cannot exceed ${Number(settings.bioMaxLength ?? 500)} characters`,
                });
            }
            next.bio = bio;
        }

        if (next.avatarUrl !== undefined) {
            next.avatarUrl = String(next.avatarUrl ?? '').trim().slice(0, 2048);
        }

        if (next.address && typeof next.address === 'object') {
            const a = next.address;
            next.address = {
                line1: a.line1 ?? a.addressLine1 ?? a.line_1 ?? '',
                line2: a.line2 ?? a.addressLine2 ?? a.line_2 ?? '',
                city: a.city ?? '',
                state: a.state ?? '',
                postalCode: a.postalCode ?? a.pincode ?? a.zip ?? '',
                country: a.country ?? '',
            };
        }

        const updated = await UserModel.findByIdAndUpdate(
            req.user._id,
            { $set: next },
            { new: true, runValidators: true, projection: { password: 0 } }
        );

        res.json({ success: true, data: pickUserForClient(updated, settings) });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const currentPassword = String(req.body?.currentPassword ?? '');
        const newPassword = String(req.body?.newPassword ?? '');

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const user = await UserModel.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const ok = await user.comparePassword(currentPassword);
        if (!ok) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
