import { createConnection } from '../db/connection.js';


const db= await createConnection();
export async function isDeviceVerified(email, fingerprint) {
  const connection = await createConnection();
  const [rows] = await connection.execute(
    'SELECT 1 FROM verified_devices WHERE email = ? AND fingerprint = ?',
    [email, fingerprint]
  );
  await connection.end();
  return rows.length > 0;
}

export async function saveVerifiedDevice(email, fingerprint) {
 const connection = await createConnection();
  await connection.execute(
    'INSERT INTO verified_devices (email, fingerprint) VALUES (?, ?)',
    [email, fingerprint]
  );
  await connection.end();
}
