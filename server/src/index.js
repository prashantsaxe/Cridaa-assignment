import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../swagger.json' assert { type: 'json' };
import bcrypt from 'bcryptjs';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data/slots.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}
async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Seed default slots if empty
async function ensureSlots() {
  const slots = await readJSON(DATA_FILE);
  if (slots.length === 0) {
    const today = new Date();
    const baseDate = today.toISOString().split('T')[0];
    const times = ['06:00','07:00','08:00','09:00','10:00','16:00','17:00','18:00','19:00','20:00'];
    const seeded = times.map((t, idx) => ({ id: uuid(), date: baseDate, time: t, court: 'Court 1', booked: false }));
    await writeJSON(DATA_FILE, seeded);
    return seeded;
  }
  return slots;
}

// Seed default user (demo)
async function ensureUsers() {
  const users = await readJSON(USERS_FILE);
  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash('demo', 10);
    const defaultUser = { id: uuid(), username: 'demo', password: hashedPassword, email: 'demo@example.com' };
    await writeJSON(USERS_FILE, [defaultUser]);
    return [defaultUser];
  }
  return users;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.post('/api/auth/signup', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Username, password, and email are required' });
  }
  
  const users = await ensureUsers();
  
  // Check if user already exists
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(409).json({ message: 'Username or email already exists' });
  }
  
  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { 
    id: uuid(), 
    username, 
    password: hashedPassword, 
    email,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  await writeJSON(USERS_FILE, users);
  
  const token = jwt.sign({ sub: newUser.id, username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: newUser.id, username, email } });
});

// Serve raw swagger spec
app.get('/api/docs', async (_req, res) => {
  try {
    const specPath = path.join(__dirname, '../swagger.json');
    const specRaw = await fs.readFile(specPath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(specRaw);
  } catch (e) {
    res.status(500).json({ message: 'Docs not available' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await ensureUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username, email: user.email } });
});

app.get('/api/slots', async (req, res) => {
  const slots = await ensureSlots();
  res.json(slots.filter(s => !s.booked));
});

app.post('/api/slots/:id/book', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const slots = await ensureSlots();
  const idx = slots.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Slot not found' });
  if (slots[idx].booked) return res.status(409).json({ message: 'Already booked' });
  slots[idx].booked = true;
  slots[idx].bookedBy = req.user.sub;
  await writeJSON(DATA_FILE, slots);
  res.json({ message: 'Booked', slot: slots[idx] });
});

app.get('/api/slots/mine', authMiddleware, async (req, res) => {
  const slots = await ensureSlots();
  res.json(slots.filter(s => s.bookedBy === req.user.sub));
});

app.delete('/api/slots/:id/cancel', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const slots = await ensureSlots();
  const idx = slots.findIndex(s => s.id === id);
  
  if (idx === -1) return res.status(404).json({ message: 'Slot not found' });
  if (!slots[idx].booked) return res.status(400).json({ message: 'Slot not booked' });
  if (slots[idx].bookedBy !== req.user.sub) return res.status(403).json({ message: 'Not your booking' });
  
  slots[idx].booked = false;
  delete slots[idx].bookedBy;
  await writeJSON(DATA_FILE, slots);
  res.json({ message: 'Booking cancelled', slot: slots[idx] });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
