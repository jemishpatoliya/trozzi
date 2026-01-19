const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

const router = express.Router();

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
], async (req, res, next) => {
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

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = user.generateToken();

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
        next(error);
    }
});

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
        .isIn(['admin', 'user'])
        .withMessage('Role must be admin or user')
], async (req, res, next) => {
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

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            phone,
            role
        });

        await user.save();

        console.log('✅ User created successfully:', { 
            _id: user._id, 
            email: user.email, 
            role: user.role 
        });

        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please login to continue.',
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/me', auth, async (req, res) => {
    res.json({
        success: true,
        data: req.user
    });
});

router.post('/logout', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
