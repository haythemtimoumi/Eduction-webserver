const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get an enseignant by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const enseignantId = req.params.id;

    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT * FROM esp_enseignant WHERE ID_ENS = :id_ens`,
      { id_ens: enseignantId }
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Enseignant not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error fetching enseignant by ID:', error.message);
    res.status(500).json({ error: 'Failed to fetch enseignant', message: error.message });
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
