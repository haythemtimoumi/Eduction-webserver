// routes/studentById.js
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get a student by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const studentId = req.params.id;

    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT * FROM esp_etudiant WHERE ID_ET = :id_et`,
      { id_et: studentId }
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error fetching student by ID:', error.message);
    res.status(500).json({ error: 'Failed to fetch student', message: error.message });
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
