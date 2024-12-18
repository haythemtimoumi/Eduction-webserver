// routes/notesBelowThreshold.js

const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path to your dbConfig file

// Route to get notes below threshold by student ID
router.get('/:studentId', async (req, res) => {
    const studentId = req.params.studentId;
    const query = `
        SELECT 
            ue.LIB_UE, 
            nr.ANNEE_DEB, 
            nr.NOTE
        FROM 
            ESP_UE ue
        JOIN 
            ESP_NOTE_RAT nr 
            ON ue.ANNEE_DEB = nr.ANNEE_DEB
        JOIN 
           ESP_ETUDIANT et 
            ON nr.ID_ET = et.ID_ET
        WHERE 
            nr.NOTE < 8
            AND et.ID_ET = :studentId
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
