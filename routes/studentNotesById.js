// routes/studentNotesById.js
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path if needed

// Route to get notes and MOYENNE for a specific student by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await connectToDatabase();
    const result = await connection.execute(
      `SELECT note.CODE_MODULE, note.NOTE_EXAM, note.NOTE_CC, note.NOTE_TP, note.SEMESTRE, 
              moy.TYPE_MOY, moy.ANNEE_DEB, moy.MOYENNE
       FROM ESP_NOTE note
       JOIN ESP_MOY_MODULE_ETUDIANT moy 
         ON note.ID_ET = moy.ID_ET AND note.CODE_CL = moy.CODE_CL
       WHERE note.ID_ET = :id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: `No notes or moyenne found for student with ID ${id}` });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching student notes and moyenne:', error.message);
    res.status(500).json({ error: 'Failed to fetch student notes and moyenne', message: error.message });
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
