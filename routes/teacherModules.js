const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path to your dbConfig file

// Route to get the modules and enseignants for a student
router.get('/:studentId', async (req, res) => {
    const studentId = req.params.studentId;

    // Query to get modules and enseignants along with their emails for the given student
    const query = `
        SELECT 
            ue.LIB_UE,
            CASE WHEN mp.ID_ENS IS NOT NULL THEN e1.NOM_ENS || ' ' || e1.PRENOM_ENS END AS ENSEIGNANT_1,
            CASE WHEN mp.ID_ENS IS NOT NULL THEN e1.MAIL_ENS END AS EMAIL_1,
            CASE WHEN mp.ID_ENS2 IS NOT NULL THEN e2.NOM_ENS || ' ' || e2.PRENOM_ENS END AS ENSEIGNANT_2,
            CASE WHEN mp.ID_ENS2 IS NOT NULL THEN e2.MAIL_ENS END AS EMAIL_2,
            CASE WHEN mp.ID_ENS3 IS NOT NULL THEN e3.NOM_ENS || ' ' || e3.PRENOM_ENS END AS ENSEIGNANT_3,
            CASE WHEN mp.ID_ENS3 IS NOT NULL THEN e3.MAIL_ENS END AS EMAIL_3,
            CASE WHEN mp.ID_ENS4 IS NOT NULL THEN e4.NOM_ENS || ' ' || e4.PRENOM_ENS END AS ENSEIGNANT_4,
            CASE WHEN mp.ID_ENS4 IS NOT NULL THEN e4.MAIL_ENS END AS EMAIL_4,
            CASE WHEN mp.ID_ENS5 IS NOT NULL THEN e5.NOM_ENS || ' ' || e5.PRENOM_ENS END AS ENSEIGNANT_5,
            CASE WHEN mp.ID_ENS5 IS NOT NULL THEN e5.MAIL_ENS END AS EMAIL_5
        FROM 
            ESP_UE ue
        JOIN 
            ESP_MODULE_PANIER_CLASSE_SAISO mp ON ue.CODE_UE = mp.CODE_MODULE
        JOIN 
            ESP_INSCRIPTION insc ON mp.ANNEE_DEB = insc.ANNEE_DEB
        LEFT JOIN 
            ESP_ENSEIGNANT e1 ON mp.ID_ENS = e1.ID_ENS
        LEFT JOIN 
            ESP_ENSEIGNANT e2 ON mp.ID_ENS2 = e2.ID_ENS
        LEFT JOIN 
            ESP_ENSEIGNANT e3 ON mp.ID_ENS3 = e3.ID_ENS
        LEFT JOIN 
            ESP_ENSEIGNANT e4 ON mp.ID_ENS4 = e4.ID_ENS
        LEFT JOIN 
            ESP_ENSEIGNANT e5 ON mp.ID_ENS5 = e5.ID_ENS
        WHERE 
            mp.ANNEE_DEB = insc.ANNEE_DEB
            AND insc.ID_ET = :studentId
    `;

    let connection;

    try {
        // Establish connection to the database
        connection = await connectToDatabase();

        // Execute the query with the provided studentId
        const result = await connection.execute(query, [studentId]);

        // Send the result as JSON
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        // Ensure the connection is closed when done
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Failed to close the connection', err);
            }
        }
    }
});

module.exports = router;
