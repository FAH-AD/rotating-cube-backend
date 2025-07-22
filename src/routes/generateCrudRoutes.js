// routes/generateCrudRoutes.js
import express from 'express';
import { createConnection } from '../db/connection.js';

export function generateCrudRoutes(tableName, columnDefinitions) {
  const router = express.Router();

  // Helper function to get column names
  const getColumnNames = (type) => columnDefinitions.map(col => 
    typeof col === 'object' ? col[type] : col
  );

  const dbColumns = getColumnNames('dbName');
  const frontendColumns = getColumnNames('frontendName');

  // GET all
  router.get(`/api/${tableName}`, async (req, res) => {
    try {
      const connection = await createConnection();
      const selectCols = ['my_row_id', ...dbColumns].map(col => `\`${col}\``).join(', ');
      const [rows] = await connection.execute(`SELECT ${selectCols} FROM \`${tableName}\``);
      await connection.end();
      res.json(rows);
    } catch (err) {
      console.error(`GET ${tableName} error:`, err);
      res.status(500).json({ error: `Failed to fetch ${tableName}` });
    }
  });

  // CREATE
  router.post(`/api/${tableName}`, async (req, res) => {
    try {
      const values = frontendColumns.map(col => req.body[col]);
      if (values.includes(undefined)) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const placeholders = dbColumns.map(() => '?').join(', ');
      const columnsEscaped = dbColumns.map(col => `\`${col}\``).join(', ');

      const connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO \`${tableName}\` (${columnsEscaped}) VALUES (${placeholders})`,
        values
      );
      await connection.end();
      res.status(201).json({ message: 'Entry created successfully', id: result.insertId });
    } catch (err) {
      console.error(`POST ${tableName} error:`, err);
      res.status(500).json({ error: `Failed to create in ${tableName}` });
    }
  });

  // UPDATE
  router.put(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const values = frontendColumns.map(col => req.body[col]);
      if (values.includes(undefined)) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const setClause = dbColumns.map(col => `\`${col}\` = ?`).join(', ');
      const connection = await createConnection();
      const [result] = await connection.execute(
        `UPDATE \`${tableName}\` SET ${setClause} WHERE \`my_row_id\` = ?`,
        [...values, id]
      );
      await connection.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry updated successfully' });
    } catch (err) {
      console.error(`PUT ${tableName} error:`, err);
      res.status(500).json({ error: `Failed to update ${tableName}` });
    }
  });

  // DELETE
  router.delete(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await createConnection();
      const [result] = await connection.execute(
        `DELETE FROM \`${tableName}\` WHERE \`my_row_id\` = ?`,
        [id]
      );
      await connection.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
      console.error(`DELETE ${tableName} error:`, err);
      res.status(500).json({ error: `Failed to delete from ${tableName}` });
    }
  });

  return router;
}
