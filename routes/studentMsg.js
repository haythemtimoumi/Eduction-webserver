const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig');
const generateMotivationalMessage = require('../utils/motivationHelper');
const oracledb = require('oracledb');
const moment = require('moment');

// Define the academic year dates
const ACADEMIC_YEAR_START = moment('2023-09-15');
const ACADEMIC_YEAR_END = moment('2024-06-15');

// Function to calculate the percentage of the academic year that has passed
const calculateAcademicPeriodPercentage = () => {
  const today = moment();
  const totalDays = ACADEMIC_YEAR_END.diff(ACADEMIC_YEAR_START, 'days') + 1;
  const daysPassed = today.diff(ACADEMIC_YEAR_START, 'days') + 1;
  return Math.min((daysPassed / totalDays) * 100, 100).toFixed(2);
};

// Route to get motivational messages based on student absences
router.get('/:id', async (req, res) => {
  const studentId = req.params.id;
  let connection;

  try {
    connection = await connectToDatabase();

    // Fetch all absences for the student
    const result = await connection.execute(
      `SELECT * FROM esp_absence_new WHERE ID_ET = :studentId`,
      [studentId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No absences found for this student' });
    } else {
      const absences = result.rows;
      const messages = generateMotivationalMessage(absences);
      const academicPeriodPercentage = calculateAcademicPeriodPercentage();

      res.json({
        generalMessage: messages.generalMessage,
        scoreMessage: messages.scoreMessage,
        effortMessage: messages.effortMessage,
        academicPeriodPercentage: `${academicPeriodPercentage}`
      });
    }
  } catch (error) {
    console.error('Error fetching student absences:', error.message);
    res.status(500).json({ error: 'Failed to fetch absences', message: error.message });
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
