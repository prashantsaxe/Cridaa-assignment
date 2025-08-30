# 🏟️ Cridaa Mini Booking Application

A beautiful, full-stack court/turf booking application built for the Cridaa assignment with MongoDB integration and enhanced UI/UX.

## ✨ Features
- 🔐 **Complete Authentication**: Secure signup/login with JWT & bcrypt
- 🎯 **Court Booking**: View and book available time slots
- ❌ **Cancel Bookings**: Easily cancel your existing reservations  
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🎨 **Beautiful UI**: Modern gradients, animations, and hover effects
- 🍃 **MongoDB Integration**: Robust data persistence with Mongoose
- 📊 **Real-time Updates**: Dynamic slot availability and booking status
- 📚 **API Documentation**: Swagger UI for easy API testing

## 🛠️ Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Cloud Atlas)
- **Authentication**: JWT + bcryptjs
- **Documentation**: Swagger UI
- **Deployment Ready**: Vercel configuration included

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Server Setup
```bash
cd server
npm install
npm start
```
Server runs on http://localhost:4001

### Client Setup  
```bash
cd client
npm install
npm run dev
```
Client runs on http://localhost:5173

### Environment Variables
**Server (.env):**
```
PORT=4001
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

**Client (.env):**
```
VITE_API_BASE=http://localhost:4001
```

## 📱 Usage

### 🔑 Authentication
1. **Sign Up**: Create account with email, username, and password
2. **Sign In**: Login with email and password  
3. **Auto-persistence**: Stay logged in across sessions

### 🏟️ Booking Flow
1. **Browse Courts**: View available slots with pricing
2. **Book Instantly**: One-click booking with real-time updates
3. **Manage Bookings**: View and cancel your reservations
4. **Real-time Sync**: Automatic refresh of availability

## 🎨 UI Highlights
- **Gradient Backgrounds**: Eye-catching blue-to-indigo gradients
- **Interactive Cards**: Hover effects and smooth transitions
- **Loading States**: Animated spinners for better UX
- **Responsive Grid**: Adapts beautifully to all screen sizes
- **Icons & Typography**: Professional design with Tailwind utilities

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/slots` | Get available slots |
| POST | `/api/slots/book` | Book a slot |
| DELETE | `/api/slots/cancel/:id` | Cancel booking |
| GET | `/api/slots/mine` | Get user's bookings |
| GET | `/api/docs` | Swagger documentation |

## 🌐 Deployment

### Vercel (Frontend)
```bash
# Build command: npm run build
# Output directory: dist
# Environment variables: VITE_API_BASE
```

### Railway/Render (Backend)
```bash
# Build command: npm install
# Start command: npm start  
# Environment variables: MONGODB_URI, JWT_SECRET, PORT
```

## 🧩 Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique), 
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String (optional)
}
```

### Slot Model  
```javascript
{
  date: String,
  time: String,
  court: String,
  price: Number,
  duration: String,
  booked: Boolean,
  bookedBy: ObjectId (User ref),
  bookedAt: Date
}
```

## 💡 Challenges & Solutions

1. **State Management**: Used React hooks for clean state handling across components
2. **Real-time Updates**: Implemented optimistic UI updates with error handling
3. **Security**: Added password hashing, JWT tokens, and input validation
4. **UX Design**: Created smooth animations and loading states for better experience
5. **Database Design**: Structured MongoDB schemas with proper relationships and indexing
6. **Responsive Layout**: Used Tailwind's grid system for mobile-first responsive design

## 🔮 Future Enhancements
- 🔍 **Search & Filter**: Filter courts by price, availability, location
- 💳 **Payment Integration**: Stripe/Razorpay integration
- 📧 **Email Notifications**: Booking confirmations and reminders
- 📊 **Analytics Dashboard**: Usage statistics and revenue tracking
- 🌍 **Multi-location**: Support for multiple venues
- 📱 **Mobile App**: React Native version

## 🤝 Contributing
Feel free to fork, improve, and submit pull requests!

---
**Built with ❤️ for Cridaa Sports Platform Assignment**
