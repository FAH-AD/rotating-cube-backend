import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOTP = async (to, code) => {
  return client.messages.create({
    body: `Your confirmation code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};
