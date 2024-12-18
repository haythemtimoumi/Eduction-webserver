// routes/studentModules.js
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to get module details for a student by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    const studentId = req.params.id;

    connection = await connectToDatabase();

    // Adjust the schema prefix and table names if necessary  
    const query = `
      SELECT m.code_module, m.designation_module, m.moyenne AS module_moyenne, uu.lib_ue, u.moyenne AS ue_moyenne
      FROM esp_moy_module_etudiant m
      JOIN ESP_MOY_UE_ETUDIANT u 
        ON m.annee_deb = u.annee_deb 
        AND m.id_et = u.id_et 
        AND m.type_moy = u.type_moy 
        AND m.code_ue = u.code_ue
      JOIN ESP_UE uu 
        ON uu.annee_deb = m.annee_deb 
        AND u.code_ue = uu.code_ue
      WHERE m.annee_deb = uu.annee_deb 
        AND m.id_et = :id_et 
        AND m.type_moy = 'R'
      ORDER BY uu.lib_ue`;

    const result = await connection.execute(query, [studentId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Modules not found for the student' });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching modules for student:', error.message);
    res.status(500).json({ error: 'Failed to fetch modules', message: error.message });
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
