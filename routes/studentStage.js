const express = require('express');
const router = express.Router(); // Initialize router
const connectToDatabase = require('../config/dbConfig'); // Import the DB connection
const PDFDocument = require('pdfkit'); // Import pdfkit

// GET student data by ID (name, class, and date) and generate a PDF
router.get('/:id', async (req, res) => {
  const studentId = req.params.id;

  try {
    const connection = await connectToDatabase();

    // Fetch student data
    const classResult = await connection.execute(
      `SELECT CODE_CL FROM esp_inscription WHERE ID_ET = :id`,
      [studentId]
    );
    const nameResult = await connection.execute(
      `SELECT NOM_ET, PNOM_ET FROM ESP_ETUDIANT WHERE ID_ET = :id`,
      [studentId]
    );
    const dateResult = await connection.execute(
      `SELECT DATE_SAISIE FROM ESP_STAGE_ET WHERE ID_ET = :id`,
      [studentId]
    );

    // Log the results for debugging
    console.log('Class result:', classResult.rows);
    console.log('Name result:', nameResult.rows);
    console.log('Date result:', dateResult.rows);

    if (classResult.rows.length === 0) {
      console.log('No data found in esp_inscription for studentId:', studentId);
      return res.status(404).json({ message: 'Student not found or missing data in esp_inscription.' });
    }

    if (nameResult.rows.length === 0) {
      console.log('No data found in ESP_ETUDIANT for studentId:', studentId);
      return res.status(404).json({ message: 'Student not found or missing data in ESP_ETUDIANT.' });
    }

    if (dateResult.rows.length === 0) {
      console.log('No data found in ESP_STAGE_ET for studentId:', studentId);
      return res.status(404).json({ message: 'Student not found or missing data in ESP_STAGE_ET.' });
    }

    const classCode = classResult.rows[0][0];
    const firstName = nameResult.rows[0][0];
    const lastName = nameResult.rows[0][1];
    const submissionDate = new Date(dateResult.rows[0][0]).toLocaleDateString('fr-FR'); // Format date as dd/mm/yyyy

    // Create PDF in landscape mode, adjust margins and alignment
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 120, bottom: 50, left: 50, right: 50 } });
    let chunks = [];

    // Collect PDF data in chunks
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);

      // Set headers to serve the PDF
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=Demande_Stage_${studentId}.pdf`,
        'Content-Length': pdfData.length,
      });

      // Send the PDF to the client
      res.end(pdfData);
    });

    // 1. Adjusted Stamp and Esprit Logo Aligned Horizontally at the Top Left
    const stampY = 50;  // Y-axis positioning for both images
    const logoX = 229;  // Logo positioned right after the stamp on the same y-axis
    const logoY = stampY - 12;  // Adjust Y-axis for the logo to make it slightly higher than the stamp
    
    doc.image('./images/stamp.png', 50, stampY, { width: 180 });  // Make the stamp bigger (width: 180)
    doc.image('./images/esprit_logo.png', logoX, logoY, { width: 80 });  // Smaller logo (width: 80)

    // 2. Center the Date (Smaller Font, Move Up)
    doc.moveDown(1);
    doc.fontSize(7).text('Tunis, le : ' + submissionDate, { align: 'center', lineGap: 1 }); // Center-aligned date, move slightly up

    // 3. Add Title (Smaller Font, Shifted Down)
    doc.moveDown(12);
    doc.fontSize(8).text("À l'aimable attention de la Direction Générale", { align: 'left' });

    // 4. Add "Objet" (Smaller Font, Shifted Down)
    doc.moveDown(1);
    doc.fontSize(7).text('Objet: Demande de Stage', { align: 'left' });

    // 5. Add Body Text (Smaller Font, Shifted Down, Tight Spacing)
    doc.moveDown(2);
    doc.fontSize(7).text(
      `Madame, Monsieur,\nL'Ecole Supérieure Privée d'Ingénierie et de Technologies, ESPRIT SA, est un établissement ` +
      `d'enseignement supérieur privé ayant pour objet principal, la formation d’ingénieurs dans les domaines des technologies ` +
      `de l’information et de la communication.\n\n` +
      `Notre objectif consiste à former des ingénieurs opérationnels au terme de leur formation.\n\n` +
      `Dès lors, nous encourageons nos élèves à mettre en pratique le savoir et les compétences qu’ils ont acquis au cours de leur cursus universitaire.\n\n` +
      `C’est également dans le but de les amener à s’intégrer dans l’environnement de l’entreprise que nous vous demandons de bien vouloir accepter :\n`,
      { align: 'left', lineGap: 1 }  // Reduced line gap
    );

    // Add a bit more vertical space between the date and the text
    doc.moveDown(2);

    // 6. Add Dynamic Student Information (Bold and Italic, Smaller Font)
    doc.fontSize(7)
      .font('Helvetica-Bold')
      .text(`L'étudiant(e): ${firstName.toUpperCase()} ${lastName.toUpperCase()}`, { indent: 90 });

    doc.fontSize(7)
      .font('Helvetica-Oblique')
      .text(`Inscrit(e) en : ${classCode}`, { indent: 90 });

    // 7. Add Final Paragraphs (Smaller Font, Shifted Down, Tight Spacing)
    doc.moveDown(2);
    doc.fontSize(7).text(
      `Pour effectuer un stage obligatoire, au sein de votre honorable société.\n\n` +
      `Nous restons à votre entière disposition pour tout renseignement complémentaire.\n\n` +
      `En vous remerciant pour votre précieux soutien, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.\n\n`,
      { align: 'left', lineGap: 1 }
    );

    // 8. Signature (Bottom Right, Smaller Font)
    doc.image('./images/signature.png', 650, 500, { width: 100 });
  
    // Finalize the PDF
    doc.end();

    // Close the database connection
    await connection.close();
    
  } catch (error) {
    console.error('Error fetching student data or generating PDF:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
