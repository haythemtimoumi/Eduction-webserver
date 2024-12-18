const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig');

// Route to log in a student or parent by ID
router.post('/', async (req, res) => {
  let connection;
  try {
    // Log request body to check the input
    console.log('Request body:', req.body);

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    connection = await connectToDatabase();

    // First, check if the ID exists as a student
    let result = await connection.execute(
      `SELECT * FROM esp_etudiant WHERE ID_ET = :studentId`,
      { studentId: studentId }
    );

    if (result.rows.length === 0) {
      // If not found as a student, check if it's a parent ID
      result = await connection.execute(
        `SELECT * FROM SCOESP09.esp_etudiant WHERE NUM_CIN_PASSEPORT = :studentId`,
        { studentId: studentId }
      );

      if (result.rows.length === 0) {
        // User not found in both queries
        return res.status(404).json({ error: 'User not found' });
      } else {
        // User found as a parent
        const parent = result.rows[0];
        return res.json({
          message: 'Login successful',
          role: 'parent',
          user: parent
        });
      }
    } else {
      // User found as a student
      const student = result.rows[0];
      return res.json({
        message: 'Login successful',
        role: 'student',
        user: student
      });
    }
  } catch (error) {
    console.error('Error logging in user:', error.message);
    return res.status(500).json({ error: 'Failed to log in user', message: error.message });
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
