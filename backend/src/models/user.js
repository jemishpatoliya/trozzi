const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [15, 'Phone number cannot exceed 15 characters']
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: '',
        maxlength: [2048, 'Avatar URL cannot exceed 2048 characters'],
    },
    bio: {
        type: String,
        trim: true,
        default: '',
        maxlength: [5000, 'Bio cannot exceed 5000 characters'],
    },
    address: {
        line1: { type: String, trim: true, default: '' },
        line2: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        postalCode: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: '' },
    },
    role: {
        type: String,
        enum: ['user'], // ONLY user role allowed
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    lastActiveAt: {
        type: Date,
        default: null
    },
    resetPasswordTokenHash: {
        type: String,
        select: false,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        select: false,
        default: null,
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        { 
            id: this._id, 
            email: this.email, 
            role: this.role,
            type: 'user'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const UserModel = mongoose.model('User', userSchema);

module.exports = { UserModel };
