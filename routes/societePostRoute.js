const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Route to handle POST request for the internship form, with ID_ET as URL parameter
router.post('/:id_et', async (req, res) => {
  let connection;
  try {
    const { id_et } = req.params;  // Get ID_ET from the URL
    const {
      DATE_SAISIE,
      DATE_DEBUT,
      DATE_FIN,
      ADRESSE_SOCIETE,
      TELEPHONE_SOCIETE,
      NOM_SOCIETE,
      EMAIL_SOCIETE 
    } = req.body;

    connection = await connectToDatabase();

    // Step 1: Check if the user has already submitted the form in the past year
    const dateSaisieResult = await connection.execute(
      `SELECT DATE_SAISIE FROM ESP_STAGE_ET WHERE ID_ET = :id_et`,
      [id_et]
    );

    if (dateSaisieResult.rows.length > 0) {
      const lastSubmissionDate = dateSaisieResult.rows[0][0];

      // Calculate the difference in months between last submission and today
      const currentDate = new Date();
      const monthsBetween = (currentDate.getFullYear() - new Date(lastSubmissionDate).getFullYear()) * 12 +
                            (currentDate.getMonth() - new Date(lastSubmissionDate).getMonth());

      // If less than 12 months have passed, block submission
      if (monthsBetween < 12) {
        return res.status(400).json({ error: 'You can only submit the form once per year.' });
      }
    }

    // Step 2: Proceed to insert the new internship record if allowed
    const result = await connection.execute(
      `INSERT INTO ESP_STAGE_ET (
          ID_ET, 
          DATE_SAISIE, 
          DATE_DEBUT, 
          DATE_FIN, 
          ADRESSE_SOCIETE, 
          EMAIL_SOCIETE,  -- Add EMAIL_SOCIETE here
          TELEPHONE_SOCIETE, 
          NOM_SOCIETE
        ) 
        VALUES (
          :id_et, 
          TO_DATE(:date_saisie, 'YYYY-MM-DD'), 
          TO_DATE(:date_debut, 'YYYY-MM-DD'), 
          TO_DATE(:date_fin, 'YYYY-MM-DD'), 
          :adresse_societe, 
          :email_societe,   -- Add EMAIL_SOCIETE to values
          :telephone_societe, 
          :nom_societe
        )`,
      {
        id_et: id_et,
        date_saisie: DATE_SAISIE || new Date().toISOString().split('T')[0],  // Default to current date in 'YYYY-MM-DD' format
        date_debut: DATE_DEBUT,
        date_fin: DATE_FIN,
        adresse_societe: ADRESSE_SOCIETE,
        email_societe: EMAIL_SOCIETE,  // Bind EMAIL_SOCIETE
        telephone_societe: TELEPHONE_SOCIETE,
        nom_societe: NOM_SOCIETE
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 1) {
      res.status(201).json({ message: 'Internship record created successfully.' });
    } else {
      res.status(400).json({ error: 'Failed to create internship record.' });
    }
  } catch (error) {
    console.error('Error inserting internship data:', error.message);
    res.status(500).json({ error: 'Failed to insert data', message: error.message });
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
