import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
const generateToken = (userId: string) => {
  // Backward/forward compatible payload for existing clients
  return jwt.sign({ id: userId, userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new UserModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    const userPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      emailVerified: user.emailVerified,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    const userPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      emailVerified: user.emailVerified,
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function extractUserIdFromAuthHeader(authorization: string | undefined) {
  const token = authorization?.replace('Bearer ', '');
  if (!token) return null;
  const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
  return decoded.userId ?? decoded.id ?? null;
}

// Get current user profile (legacy)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromAuthHeader(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: 'No token provided' });

    const user = await UserModel.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ user: userPayload });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user profile (new, used by User Web)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromAuthHeader(req.headers.authorization);
    if (!userId) return res.status(401).json({ success: false, message: 'No token provided' });

    const user = await UserModel.findById(userId).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.active,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
