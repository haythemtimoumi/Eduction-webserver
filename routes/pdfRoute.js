// routes/pdfRoute.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Route to serve the specific PDF file
router.get('/journal-stage', (req, res) => {
  const filePath = path.join(__dirname, '../pdfs/Journal_Stage_stages.pdf'); // Adjust the path to your file

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending PDF:', err.message);
      res.status(404).json({ error: 'PDF file not found' });
    }
  });
});

module.exports = router;
