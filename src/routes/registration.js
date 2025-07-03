
const express = require('express');
const { createConnection } = require('../db/connection');
const bcrypt = require('bcrypt');

const router = express.Router();

// Registration route

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
      type
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
  [companyName, addressStreet, addressStreet2 || null, city, state, country, zipcode, phoneNumber, fName, lName, id, hashedPassword, email, type]
);
    await connection.end();

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login route
router.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier (username or email) and password are required' });
    }

    const connection = await createConnection();

    // Find the user by id (username) or email
    const [users] = await connection.execute(
      'SELECT * FROM mfa WHERE Id = ? OR Email = ?',
      [identifier, identifier]
    );

    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If login is successful, you might want to generate a token here
    // For simplicity, we're just sending a success message
    res.json({ message: 'Login successful', userId: user.Id });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

module.exports = router;