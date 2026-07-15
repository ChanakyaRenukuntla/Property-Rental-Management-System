// ============================================================
// server.js — The main entry point of our Node.js backend
// Think of this as the "front door" of our entire backend app
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();

// -------------------------------------------------------
// MIDDLEWARE — Code that runs on EVERY request
// -------------------------------------------------------

// Allow our React frontend (running on port 3000) to talk to this backend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Tell Express to understand JSON data in request bodies
app.use(express.json());

// -------------------------------------------------------
// ROUTES — Different URL paths go to different handlers
// -------------------------------------------------------
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/properties',  require('./routes/property.routes'));
app.use('/api/tenants',     require('./routes/tenant.routes'));
app.use('/api/payments',    require('./routes/payment.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/messages',    require('./routes/message.routes'));
app.use('/api/requests',    require('./routes/request.routes'));
app.use('/api/ai',          require('./routes/ai.routes'));

// Health check — visit http://localhost:5000/ to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: '✅ PropEase API is running!', version: '1.0.0' });
});

// -------------------------------------------------------
// CONNECT TO MONGODB, THEN START THE SERVER
// -------------------------------------------------------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Stop the app if DB connection fails
  });
