const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig');

router.get('/:classe', async (req, res) => {
  const { classe } = req.params; // Extract 'classe' from the URL parameter
  const { date } = req.query; // Extract 'date' from the query parameter

  let query = `
    SELECT 
      emploi.DATECOUR, 
      e.NOM_ENS AS Enseignant, 
      e.mail_ens AS Mail, 
      e.id_ens, 
      empmod.CODECL AS Classe, 
      module.designation AS Module, 
      seance.HEUREDEB, 
      seance.HEUREFIN, 
      emploi.DURE AS Dure
    FROM 
      ESP_ENSEIGNANT e
      JOIN EMPLOISEMENS empens ON e.ID_ENS = empens.IDENS
      JOIN EMPLOISEMAINE emploi ON emploi.CODEMPLOI = empens.CODEMPLOI
      JOIN EMPSEM_CLAS empmod ON emploi.CODEMPLOI = empmod.CODEMPLOI
      JOIN EMPSEM_MODULE emploim ON emploi.CODEMPLOI = emploim.CODEMPLOI
      JOIN SEMAINE semaine ON emploi.IDSEMAINE = semaine.ID
      JOIN SEANCE seance ON seance.CODESEANCE = emploi.CODESEANCE
      JOIN ESP_MODULE module ON emploim.CODEMODULE = module.CODE_MODULE
    WHERE 
      emploi.ACTIF = '1' 
      AND emploi.ANNEEDEB = '2024'  
      AND empmod.CODECL = :1`;

  const bindParams = [classe];

  // If a date is provided, add the date filter
  if (date) {
    query += ' AND emploi.DATECOUR = TO_DATE(:2, \'YYYY-MM-DD\')';
    bindParams.push(date);
  }

  query += `
    ORDER BY 
      emploi.DATECOUR, 
      e.NOM_ENS, 
      empmod.CODECL, 
      module.DESIGNATION
  `;

  let connection;
  try {
    connection = await connectToDatabase();
    const result = await connection.execute(query, bindParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).send('Server error');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err.message);
      }
    }
  }
});

module.exports = router;
