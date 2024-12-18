// routes/studentModulesSt.js

const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path to your dbConfig file

// Route to get student and module data by ID_ET
router.get('/:id_et', async (req, res) => {
    const idEt = req.params.id_et;

    const query = `
        SELECT DISTINCT
            e.PNOM_ET,
            e.NOM_ET,
            i.CODE_CL,
            i.ANNEE_DEB,
            m.NB_HEURES,
            m.COEF,
            m.NUM_SEMESTRE,
            m.CODE_MODULE,
            (SELECT COUNT(*) 
             FROM ESP_ABSENCE_NEW a 
             WHERE a.ID_ET = e.ID_ET 
               AND a.CODE_CL = i.CODE_CL 
               AND a.CODE_MODULE = m.CODE_MODULE) AS absence_count,
            ue.LIB_UE -- Fetch LIB_UE from ESP_UE
        FROM ESP_ETUDIANT e
        JOIN ESP_INSCRIPTION i ON e.ID_ET = i.ID_ET
        JOIN ESP_MODULE_PANIER_CLASSE_SAISO m ON i.CODE_CL = m.CODE_CL
        LEFT JOIN ESP_UE ue ON ue.CODE_UE = m.CODE_MODULE 
          AND ue.ANNEE_DEB = i.ANNEE_DEB -- Correct join using m.CODE_MODULE and year
        WHERE e.ID_ET = :id_et
          AND m.ANNEE_DEB = i.ANNEE_DEB
          AND ue.LIB_UE IS NOT NULL -- Ensure only rows with valid subject names are returned
        ORDER BY m.CODE_MODULE, ue.LIB_UE
    `;

    let connection;

    try {
        // Establish connection to the database
        connection = await connectToDatabase();

        // Execute the query with the provided ID_ET
        const result = await connection.execute(query, [idEt]);

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
