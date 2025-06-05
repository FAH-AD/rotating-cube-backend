const express = require('express');
const { createConnection } = require('../db/connection');

const router = express.Router();

router.get('/api/data', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM loct_data_secure_fields_new');
    //  console.log('Fetched data:', rows); // Log the fetched data for debugging
    await connection.end();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data from database' });
  }
});

// New endpoint to increase 'Number of tip selected'
router.post('/api/increase-tip-selected', async (req, res) => {
  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    const connection = await createConnection();

    // Update the 'Number of tip selected' column
    const [result] = await connection.execute(
      'UPDATE loct_data_secure_fields_new SET `Number of tip selected` = `Number of tip selected` + 1 WHERE id = ?',
      [characterId]
    );
  //  console.log(`Updated character with ID ${characterId}:`, result); // Log the result for debugging
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Number of tip selected increased successfully' });
  } catch (error) {
    console.error('Error increasing tip selected:', error);
    res.status(500).json({ error: 'Error updating database' });
  }
});

module.exports = router;
