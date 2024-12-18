// routes/studentStudyHours.js
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get total study hours, total absences, and percentage of presence by student ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const studentId = req.params.id;

    connection = await connectToDatabase();

    // Query to get total study hours and student's name (including ANNEE_DEB from SOCIETE)
    const studyHoursResult = await connection.execute(
      `SELECT
         e.ID_ET AS id,
         e.PNOM_ET AS prenom,
         i.ANNEE_DEB AS annee,
         m.CODE_CL AS module_code,
         SUM(m.NB_HEURES) AS total_hours
       FROM
         ESP_ETUDIANT e
       JOIN
         ESP_INSCRIPTION i ON e.ID_ET = i.ID_ET
       JOIN
         ESP_MODULE_PANIER_CLASSE_SAISO m ON i.CODE_CL = m.CODE_CL
       JOIN
         SOCIETE s ON s.ANNEE_DEB = i.ANNEE_DEB
       WHERE
         e.ID_ET = :student_id
       GROUP BY
         e.ID_ET, e.PNOM_ET, i.ANNEE_DEB, m.CODE_CL`,
      { student_id: studentId }
    );

    // Query to get total absences (including ANNEE_DEB from SOCIETE)
    const absencesResult = await connection.execute(
      `SELECT
          COUNT(*) AS total_absences
       FROM
         esp_absence_new a
       JOIN 
         ESP_INSCRIPTION ins ON ins.ID_ET = a.ID_ET
       JOIN 
         SOCIETE s ON s.ANNEE_DEB = ins.ANNEE_DEB
       WHERE
         a.ID_ET = :student_id
         AND a.CODE_CL = ins.CODE_CL
       GROUP BY
         a.CODE_CL`,
      { student_id: studentId }
    );

    if (studyHoursResult.rows.length === 0) {
      res.status(404).json({ error: 'Student not found or no study hours available' });
    } else {
      const studyHoursData = studyHoursResult.rows.map(row => ({
        id: row[0],
        prenom: row[1],
        annee: row[2],
        module_code: row[3],
        total_hours: row[4]
      }))[0]; // Get the first row only

      const totalAbsences = absencesResult.rows.length > 0 ? absencesResult.rows[0][0] : 0;

      // Calculate the total absent hours and percentage of presence
      const absentHours = totalAbsences * 1.5; // Each absence is 1.5 hours
      const totalHours = studyHoursData.total_hours;
      const presentHours = totalHours - absentHours;
      const presencePercentage = (presentHours / totalHours) * 100;

      // Return the same response structure as before
      res.json({
        id: studyHoursData.id,
        prenom: studyHoursData.prenom,
        annee: studyHoursData.annee,  // This still reflects i.ANNEE_DEB from ESP_INSCRIPTION
        module_code: studyHoursData.module_code,
        total_hours: totalHours,
        total_absences: totalAbsences,
        percentage_present: presencePercentage.toFixed(2) // Round to 2 decimal places
      });
    }
  } catch (error) {
    console.error('Error fetching study hours and student data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
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
