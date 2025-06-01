import express from 'express';
import { createConnection } from '../db/connection';

const router = express.Router();

router.get('/api/data', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM loct_data_secure_fields_new');

   
    await connection.end();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data from database' });
  }
});

export default router;