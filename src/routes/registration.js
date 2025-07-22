
import express from 'express';
import { createConnection } from '../db/connection.js';
import bcrypt from 'bcrypt';

import {
  storeDeviceOTP,
  getDeviceOTP,
  deleteDeviceOTP
} from '../utils/deviceOtpStore.js';

import {
  isDeviceVerified,
  saveVerifiedDevice
} from '../models/userDevices.js';

import { sendOTP } from '../services/twillioService.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();





router.use('/api/register', (req, res, next) => {
  console.log('Accessing registration route');
  next();
});

router.post('/api/register', async (req, res) => {
  try {
    const {
      companyName,
      addressStreet,
      addressStreet2,
      city,
      state,
      country,
      zipcode,
      phoneNumber,
      fName,
      lName,
      id,
      password,
      email,
      type,
      fingerprint
    } = req.body;

    // Validate required fields
    if (!companyName || !addressStreet || !city || !state || !country || !zipcode || !phoneNumber || !fName || !lName || !id || !password || !email || !type) {
      return res.status(400).json({ error: 'All fields are required except Address_street2 and Face image' });
    }

    // Validate id (username) and password length
    if (id.length < 6 || password.length < 6) {
      return res.status(400).json({ error: 'Id and Password must be at least 6 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const connection = await createConnection();

    // Check if the username (id) already exists
    const [existingUser] = await connection.execute('SELECT * FROM mfa WHERE Email = ?', [email]);
    if (existingUser.length > 0) {
      await connection.end();
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
   const [result] = await connection.execute(
  'INSERT INTO mfa (`Company Name`, Address_street, Address_street2, City, State, Country, Zipcode, `Phone number`, F_Name, L_Name, Id, Password, Email, Type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [companyName, addressStreet, addressStreet2 || null, city, state, country, zipcode, phoneNumber, fName, lName, id, password, email, type]
);

 await saveVerifiedDevice(email, fingerprint);
    await connection.end();

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

function encryptPhoneNumber(phoneNumber) {
  const lastTwoDigits = phoneNumber.slice(-2);
  const restOfNumber = phoneNumber.slice(0, -2);
  const encrypted = 'x'.repeat(restOfNumber.length) + lastTwoDigits;
  return encrypted;
}


// Login route
router.post('/api/login', async (req, res) => {
  try {
    const { identifier, password, fingerprint } = req.body;

    if (!identifier || !password || !fingerprint) {
      return res.status(400).json({ error: 'Identifier, password, and device fingerprint are required' });
    }

    const connection = await createConnection();
    const [users] = await connection.execute(
      'SELECT * FROM mfa WHERE Id = ? OR Email = ?',
      [identifier, identifier]
    );
    await connection.end();

    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
   const isPasswordValid = password === user.Password;
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const alreadyVerified = await isDeviceVerified(user.Email, fingerprint);

    if (alreadyVerified) {
      return res.json({ message: 'Login successful', userId: user.Id, verified: true });
    }
   const encryptedPhone = encryptPhoneNumber(user['Phone number']);
    // New device → Send OTP via Twilio
    deleteDeviceOTP(user.Email, fingerprint); // Clear any previous OTPs for this device
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTP(user['Phone number'], code);
    storeDeviceOTP(user.Email, fingerprint, code);

    return res.json({
      success: true,
      requiresVerification: true,
      phone: encryptedPhone,
      message: 'OTP sent to registered phone number',
      userId: user.Id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});




router.post('/api/master-login', async (req, res) => {
  try {
    const { identifier, password, fingerprint } = req.body;

    if (!identifier || !password || !fingerprint) {
      return res.status(400).json({ error: 'Identifier, password, and device fingerprint are required' });
    }

    const connection = await createConnection();
    const [users] = await connection.execute(
      'SELECT * FROM mfa WHERE (Id = ? OR Email = ?) AND Type = "Master"',
      [identifier, identifier]
    );
    await connection.end();

    if (users.length === 0) {
      return res.status(403).json({ error: 'Only Master can access this login' });
    }

    const user = users[0];
    const isPasswordValid = password === user.Password;
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const alreadyVerified = await isDeviceVerified(user.Email, fingerprint);

    if (alreadyVerified) {
      return res.json({ message: 'Master login successful', userId: user.Id, verified: true });
    }

    const encryptedPhone = encryptPhoneNumber(user['Phone number']);
    // New device → Send OTP via Twilio
    deleteDeviceOTP(user.Email, fingerprint); // Clear any previous OTPs for this device
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTP(user['Phone number'], code);
    storeDeviceOTP(user.Email, fingerprint, code);

    return res.json({
      success: true,
      requiresVerification: true,
      phone: encryptedPhone,
      message: 'OTP sent to registered phone number',
      userId: user.Id
    });
  } catch (error) {
    console.error('Master login error:', error);
    res.status(500).json({ error: 'Error during master login' });
  }
});




router.post('/api/verify-device', async (req, res) => {
  const { email, fingerprint, code } = req.body;

  const storedCode = getDeviceOTP(email, fingerprint);
  if (!storedCode) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }

  if (storedCode !== code) {
    return res.status(400).json({ error: 'Incorrect OTP' });
  }

  await saveVerifiedDevice(email, fingerprint);
  deleteDeviceOTP(email, fingerprint);

  return res.json({ success: true, message: 'Device verified and login completed' });
});




export default router;