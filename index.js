import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import dataRoutes from './src/routes/data.js';
import registrationRoutes from './src/routes/registration.js';
import faceRoutes from './src/routes/faceauth.js';
import { generateCrudRoutes } from './src/routes/generateCrudRoutes.js';
import twillioRoutes from './src/routes/twillioAuth.js';

dotenv.config();

const app = express();

// Middleware

app.use(cors({
  origin: '*', // Allow all origins, adjust as needed for security
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));
app.use(express.json());

// Add this logging middleware
// Billing Table
app.use(generateCrudRoutes('billing', [
  'Bill Number', 'Data of Bill', 'Items', 'Price', 'Discount', 'Net', 'Paid On', 'Paid Via'
]));

// MFA Table
app.use(generateCrudRoutes('mfa', [
  'Company Name', 'Address_street', 'Address_street2', 'City', 'State', 'Country', 'Zipcode',
  'Phone number', 'F_Name', 'L_Name', 'Id', 'Password', 'Email address', 'Type'
]));

// Parameters Table
app.use(generateCrudRoutes('parameters', [
  'Authorization to', 'Module Assigned', 'id', 'password', 'other interal access auth'
]));

// Pricing Table
app.use(generateCrudRoutes('pricing', [
  'Tool Tips', 'Executable 2 Letters', 'Supply Chain Impact',
  'Charge Attributed to', 'Unit Price', 'Discount'
]));
// Routes

app.use( dataRoutes);
app.use(registrationRoutes);
app.use('/api', faceRoutes);
app.use('/api/auth', twillioRoutes);

// Add an error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});