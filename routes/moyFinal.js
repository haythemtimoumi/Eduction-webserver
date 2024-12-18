const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get the moyFinal details by student ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const studentId = req.params.id;

    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT MOY_SEM1, MOY_SEM2, MOY_GENERAL, MOY_RATT 
       FROM ESP_INSCRIPTION ei
       JOIN SOCIETE s ON ei.ANNEE_DEB = s.ANNEE_DEB
       WHERE ei.ID_ET = :id_et`,
      { id_et: studentId }
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No data found for this student' });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching moyFinal by student ID:', error.message);
    res.status(500).json({ error: 'Failed to fetch moyFinal', message: error.message });
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
