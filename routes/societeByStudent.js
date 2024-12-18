// routes/societeByStudent.js

const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path to your dbConfig file

// Route to get societe data by ID_ET
router.get('/:id_et', async (req, res) => {
    const idEt = req.params.id_et;

    const query = `
        SELECT 
            s.NOM_SOC,
            s.ADR_SOC,
            s.TEL_SOC,
            s.FAX_SOC,
            s.E_MAIL,
            s.LIAISON_SITE,
            s.VILLE,
            s.RIB,
            s.BANQUE
        FROM ESP_ETUDIANT e
        JOIN ESP_INSCRIPTION i ON e.ID_ET = i.ID_ET
        JOIN SOCIETE s ON i.ANNEE_DEB = s.ANNEE_DEB
        WHERE e.ID_ET = :id_et
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
