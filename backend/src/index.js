const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parser
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const recommendationsRoutes = require('./routes/recommendations');
const roadmapRoutes = require('./routes/roadmap');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'pathfinder-backend' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
