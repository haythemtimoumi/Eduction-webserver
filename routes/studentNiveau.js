// routes/studentNiveau.js
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig');

// GET NIVEAU_COURANT_ANG and NIVEAU_COURANT_FR for a specific student
router.get('/:id', async (req, res) => {
  const studentId = req.params.id;

  try {
    const connection = await connectToDatabase();

    const result = await connection.execute(
      `SELECT NIVEAU_COURANT_ANG, NIVEAU_COURANT_FR 
       FROM ESP_ETUDIANT 
       WHERE ID_ET = :id`,
      [studentId]
    );

    // Check if the student exists
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentNiveau = {
      NIVEAU_COURANT_ANG: result.rows[0][0],
      NIVEAU_COURANT_FR: result.rows[0][1],
    };

    res.status(200).json(studentNiveau);
  } catch (error) {
    console.error('Error fetching student level:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
