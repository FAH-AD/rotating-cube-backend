require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dataRoutes = require('./src/routes/data');
const registrationRoutes = require('./src/routes/registration');

const app = express();

// Middleware

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: false  // unless using cookies
}));
app.use(express.json());

// Add this logging middleware

// Routes
app.use( dataRoutes);
app.use(registrationRoutes);

// Add an error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});