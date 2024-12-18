const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get all active enseignants
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT * FROM esp_enseignant WHERE ETAT = 'Active'`
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No active enseignants found' });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching active enseignants:', error.message);
    res.status(500).json({ error: 'Failed to fetch enseignants', message: error.message });
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
