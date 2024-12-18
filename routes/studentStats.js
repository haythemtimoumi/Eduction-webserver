const express = require('express');
const router = express.Router();  // Initialize the router
const oracledb = require('oracledb'); // Import oracledb
const connectToDatabase = require('../config/dbConfig');

// Your route definition
router.get('/:studentId', async (req, res) => {
    let connection;
    const studentId = req.params.studentId;

    try {
        connection = await connectToDatabase();

        const result = await connection.execute(
            `SELECT 
                m.ID_ET AS studentId, 
                m.CODE_MODULE AS module, 
                m.TYPE_MOY AS typeMoyenne,
                m.MOYENNE AS studentMoyenne, 
                u.LIB_UE AS ueName,  -- Added LIB_UE from ESP_UE
                (SELECT AVG(m2.MOYENNE)
                 FROM ESP_MOY_MODULE_ETUDIANT m2
                 JOIN ESP_INSCRIPTION i2 ON m2.ID_ET = i2.ID_ET AND m2.CODE_CL = i2.CODE_CL
                 WHERE m2.CODE_MODULE = m.CODE_MODULE AND m2.CODE_CL = m.CODE_CL AND m2.TYPE_MOY = m.TYPE_MOY) AS classAverageMoyenne
            FROM 
                ESP_MOY_MODULE_ETUDIANT m
            JOIN 
                ESP_INSCRIPTION i
            ON 
                m.ID_ET = i.ID_ET AND m.CODE_CL = i.CODE_CL
            LEFT JOIN  -- Use LEFT JOIN to allow modules without UE
                ESP_UE u 
            ON 
                m.CODE_MODULE = u.CODE_UE  -- Assuming CODE_UE links ESP_MOY_MODULE_ETUDIANT and ESP_UE
            WHERE 
                m.ID_ET = :studentId
            ORDER BY 
                m.CODE_MODULE, m.TYPE_MOY`,
            [studentId],
            { outFormat: oracledb.OBJECT }  // Use this option to get rows as objects
        );

        if (result.rows.length > 0) {
            const modules = result.rows.map(row => ({
                module: row.MODULE,
                ueName: row.UENAME,  // LIB_UE now part of response
                typeMoyenne: row.TYPEMOYENNE,
                studentMoyenne: row.STUDENTMOYENNE,
                classAverageMoyenne: row.CLASSAVERAGEMOYENNE
            }));

            res.json({ studentId, modules });
        } else {
            res.status(404).json({ error: 'Student or class not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student stats', message: error.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                // Optional: Handle any errors in closing the connection
            }
        }
    }
});

module.exports = router;  // Export the router to use it in other parts of your app
