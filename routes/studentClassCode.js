const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get CODE_CL by student ID (ID_ET)
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const studentId = req.params.id;
    connection = await connectToDatabase();

    const result = await connection.execute(
      `SELECT CODE_CL FROM ESP_INSCRIPTION WHERE ID_ET = :id_et`,
      { id_et: studentId }
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No data found for this student' });
    } else {
      res.json({ CODE_CL: result.rows[0][0] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CODE_CL', message: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;
