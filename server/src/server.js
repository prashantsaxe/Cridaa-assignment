import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import User from './models/User.js';
import Slot from './models/Slot.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Swagger documentation
const swaggerDoc = {
  openapi: "3.0.0",
  info: { title: "Cridaa Booking API", version: "2.0.0" },
  paths: {
    "/api/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/api/auth/signup": { post: { summary: "User signup", responses: { "201": { description: "User created" } } } },
    "/api/auth/login": { post: { summary: "User login", responses: { "200": { description: "Login successful" } } } },
    "/api/slots": { get: { summary: "Get available slots", responses: { "200": { description: "List of slots" } } } },
    "/api/slots/book": { post: { summary: "Book a slot", responses: { "200": { description: "Slot booked" } } } },
    "/api/slots/cancel": { delete: { summary: "Cancel booking", responses: { "200": { description: "Booking cancelled" } } } },
    "/api/slots/mine": { get: { summary: "Get user bookings", responses: { "200": { description: "User bookings" } } } }
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Authorization header missing' });
  
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Seed initial slots
async function seedSlots() {
  const count = await Slot.countDocuments();
  if (count === 0) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];
    
    const times = ['06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    const courts = ['Court 1', 'Court 2', 'Court 3'];
    const prices = [1000, 1200, 1500];
    
    const slots = [];
    dates.forEach(date => {
      times.forEach((time, timeIndex) => {
        courts.forEach((court, courtIndex) => {
          slots.push({
            date,
            time,
            court,
            price: prices[courtIndex],
            duration: '1 hour'
          });
        });
      });
    });
    
    await Slot.insertMany(slots);
    console.log('Seeded initial slots');
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { sub: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { sub: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/slots', async (req, res) => {
  try {
    const slots = await Slot.find({ booked: false }).sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/slots/book', authMiddleware, async (req, res) => {
  try {
    const { slotId } = req.body;
    
    if (!slotId) {
      return res.status(400).json({ message: 'Slot ID is required' });
    }
    
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.booked) {
      return res.status(409).json({ message: 'Slot already booked' });
    }
    
    slot.booked = true;
    slot.bookedBy = req.user.sub;
    slot.bookedAt = new Date();
    await slot.save();
    
    const populatedSlot = await Slot.findById(slot._id).populate('bookedBy', 'username email firstName lastName');
    
    res.json({
      message: 'Slot booked successfully',
      slot: populatedSlot
    });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/slots/cancel/:slotId', authMiddleware, async (req, res) => {
  try {
    const { slotId } = req.params;
    
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (!slot.booked || slot.bookedBy.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    
    slot.booked = false;
    slot.bookedBy = null;
    slot.bookedAt = null;
    await slot.save();
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/slots/mine', authMiddleware, async (req, res) => {
  try {
    const slots = await Slot.find({ bookedBy: req.user.sub }).sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Get user slots error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Initialize database and start server
async function startServer() {
  await seedSlots();
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  });
}

startServer().catch(console.error);
