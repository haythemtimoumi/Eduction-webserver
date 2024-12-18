const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// POST route to insert a new reclamation record
router.post('/', async (req, res) => {
  let connection;
  try {
    const { ID_ET, CODE_CL, TYPE_REC, DISCREPTION } = req.body;

    if (!ID_ET || !CODE_CL || !TYPE_REC || !DISCREPTION) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Establish connection to the database
    connection = await connectToDatabase();

    // Only check for "Rec Option" submissions, allow unlimited "Rec Note"
    if (TYPE_REC === 'Rec Option') {
      const checkExisting = await connection.execute(
        `SELECT COUNT(*) AS rec_count FROM ESP_RECLAMATION WHERE ID_ET = :ID_ET AND TYPE_REC = 'Rec Option'`,
        { ID_ET }
      );

      const recCount = checkExisting.rows[0][0];

      // If the student has already submitted a "Rec Option", return an error
      if (recCount > 0) {
        return res.status(400).json({
          error: 'You have already submitted a "Rec Option" reclamation. You can only submit it once.',
        });
      }
    }

    // Insert the new reclamation data into the ESP_RECLAMATION table
    const result = await connection.execute(
      `INSERT INTO ESP_RECLAMATION (ID_ET, CODE_CL, DATE_SAISIE, TYPE_REC, DISCREPTION) 
       VALUES (:ID_ET, :CODE_CL, SYSDATE, :TYPE_REC, :DISCREPTION)`,
      { ID_ET, CODE_CL, TYPE_REC, DISCREPTION },
      { autoCommit: true }
    );

    if (result.rowsAffected === 1) {
      res.status(201).json({ message: 'Reclamation successfully created' });
    } else {
      res.status(500).json({ error: 'Failed to create reclamation' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;
