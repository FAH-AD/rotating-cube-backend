import express from 'express';
import { sendOTP } from '../services/twillioService.js';
import { storeOTP, getStoredOTP, deleteOTP } from '../utils/otpStore.js';

const router = express.Router();

// Send OTP
router.post('/send-code', async (req, res) => {
  const { phoneNumber } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendOTP(phoneNumber, code);
    storeOTP(phoneNumber, code);

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify-code', (req, res) => {
  const { phoneNumber, code } = req.body;
  const storedCode = getStoredOTP(phoneNumber);

  if (!storedCode) {
    return res.status(400).json({ success: false, message: 'OTP expired or not found' });
  }

  if (storedCode !== code) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  deleteOTP(phoneNumber);
  res.json({ success: true, message: 'OTP verified successfully' });
});

export default router;
