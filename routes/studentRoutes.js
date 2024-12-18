const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Example CRUD operations with pagination
router.get('/', async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT * FROM (
          SELECT a.*, ROWNUM rnum
          FROM (SELECT * FROM SCOESP09.ESP_ETUDIANT) a
          WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`,
      { maxRow: offset + limit, minRow: offset }
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).json({ error: 'Failed to fetch students', message: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing database connection:', error.message);
      }
    }
  }
});

module.exports = router;
