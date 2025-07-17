import express from 'express';
import { createConnection } from '../db/connection.js';

const router = express.Router();

router.get('/api/data', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT `my_row_id`, `Images`, `Tool_Tip-non_executable`, `Executable_two_Letters`, `ToolTips`, `Number of times tip selected`, `Status`, `Executable Command` FROM `executable_commands` WHERE 1;');
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
    // console.log('Received request to increase tip selected for character ID:', characterId);

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    const connection = await createConnection();

    // Update the 'Number of tip selected' column
    const [result] = await connection.execute(
      'UPDATE executable_commands SET `Number of times tip selected` = `Number of times tip selected` + 1 WHERE my_row_id = ?',
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




// Modified POST endpoint to add a new entry
router.post('/api/data', async (req, res) => {
  try {
    const { 
      Images, 
     "Tool_Tip-non_executable":ToolTipNonExecutable, 
      Executable_two_Letters, 
      ToolTips, 
      Status, 
      "Executable Command": ExecutableCommand,
      "Number of times tip selected": NumberOfTimesSelected
    } = req.body;


    console.log('Received data for new entry:', req.body); // Log the received data for debugging
    if (!Images || !ToolTipNonExecutable || !Executable_two_Letters || !ToolTips || !Status || !ExecutableCommand) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const connection = await createConnection();

    const [result] = await connection.execute(
      'INSERT INTO executable_commands (`Images`, `Tool_Tip-non_executable`, `Executable_two_Letters`, `ToolTips`, `Status`, `Executable Command`, `Number of times tip selected`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Images, ToolTipNonExecutable, Executable_two_Letters, ToolTips, Status, ExecutableCommand, NumberOfTimesSelected || 0]
    );

    await connection.end();

    res.status(201).json({ message: 'Entry created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Error creating entry in database' });
  }
});

// Modified PUT endpoint to edit an existing entry
router.put('/api/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      Images, 
      "Tool_Tip-non_executable":ToolTipNonExecutable, 
      Executable_two_Letters, 
      ToolTips, 
      Status, 
      "Executable Command": ExecutableCommand,
      "Number of times tip selected": NumberOfTimesSelected
    } = req.body;
     // Log the received data for debugging
    if (!Images  || !Executable_two_Letters || !ToolTips || !Status|| !ExecutableCommand || !ToolTipNonExecutable) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const connection = await createConnection();

    const [result] = await connection.execute(
      'UPDATE executable_commands SET `Images` = ?, `Tool_Tip-non_executable` = ?, `Executable_two_Letters` = ?, `ToolTips` = ?, `Status` = ?, `Executable Command` = ?, `Number of times tip selected` = ? WHERE `my_row_id` = ?',
      [Images, ToolTipNonExecutable, Executable_two_Letters, ToolTips, Status, ExecutableCommand, NumberOfTimesSelected, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry updated successfully' });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Error updating entry in database' });
  }
});

// Modified DELETE endpoint to delete an entry
router.delete('/api/data/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await createConnection();

    const [result] = await connection.execute(
      'DELETE FROM executable_commands WHERE `my_row_id` = ?',
      [id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Error deleting entry from database' });
  }
});

export default router;
