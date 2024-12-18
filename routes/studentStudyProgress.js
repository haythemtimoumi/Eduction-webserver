const express = require('express');
const router = express.Router();
const connectToDatabase = require('../config/dbConfig'); // Adjust the path as needed

// Helper function to get the day of the week from a date
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()]; // Use getUTCDay to handle the date correctly
};

// Helper function to calculate the difference in hours between two times
const calculateTimeDifference = (start, end) => {
  if (!start || !end) {
    console.error(`Invalid time data: start=${start}, end=${end}`);
    return 0; // Return 0 hours if times are undefined
  }

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTime = new Date(1970, 0, 1, startHour, startMinute);
  const endTime = new Date(1970, 0, 1, endHour, endMinute);
  const diff = (endTime - startTime) / 1000 / 3600; // Convert milliseconds to hours
  return diff > 0 ? diff : 0; // Ensure no negative hours
};

// Helper function to convert absence to hours
const convertAbsenceToHours = (absenceCount) => {
  return absenceCount * 1.5; // Each absence represents 1 hour and 30 minutes
};

// Initialize the scheduleByDay object with default values for each day
const initializeScheduleByDay = () => {
  return {
    Monday: { scheduled_hours: 0, absent_hours: 0 },
    Tuesday: { scheduled_hours: 0, absent_hours: 0 },
    Wednesday: { scheduled_hours: 0, absent_hours: 0 },
    Thursday: { scheduled_hours: 0, absent_hours: 0 },
    Friday: { scheduled_hours: 0, absent_hours: 0 },
    Saturday: { scheduled_hours: 0, absent_hours: 0 }
  };
};

// Route to calculate the student's study progress (scheduled hours vs absences)
router.get('/:id/:classe', async (req, res) => {
  const studentId = req.params.id;
  const studentClass = req.params.classe; // Class code
  let connection;

  try {
    connection = await connectToDatabase();

    // Step 1: Initialize scheduleByDay for each day of the week
    const scheduleByDay = initializeScheduleByDay();

    // Step 2: Fetch the student's scheduled study hours for each day of the week
    const scheduleQuery = `
      SELECT 
        emploi.DATECOUR, 
        seance.HEUREDEB, 
        seance.HEUREFIN 
      FROM 
        EMPLOISEMENS empens
        JOIN EMPLOISEMAINE emploi ON emploi.CODEMPLOI = empens.CODEMPLOI
        JOIN SEANCE seance ON emploi.CODESEANCE = seance.CODESEANCE
        JOIN EMPSEM_CLAS empmod ON emploi.CODEMPLOI = empmod.CODEMPLOI
      WHERE 
        empmod.CODECL = :classe
        AND emploi.ACTIF = '1'
        AND emploi.ANNEEDEB = '2024'
        AND emploi.DATECOUR BETWEEN TO_DATE('2024-01-01', 'YYYY-MM-DD') AND SYSDATE
    `;
    const scheduleResult = await connection.execute(scheduleQuery, { classe: studentClass });

    console.log('Schedule Query Result:', scheduleResult.rows); // Log the schedule query result

    scheduleResult.rows.forEach((row) => {
      const date = new Date(row[0]); // Access DATECOUR correctly
      const startTime = row[1]; // Access HEUREDEB correctly
      const endTime = row[2]; // Access HEUREFIN correctly
      const day = getDayName(date);

      console.log(`Day: ${day}, Start Time: ${startTime}, End Time: ${endTime}`);

      // Check if times are defined before calculating
      const hoursStudied = calculateTimeDifference(startTime, endTime);
      console.log(`Hours Studied on ${day}: ${hoursStudied}`);

      if (day !== 'Sunday' && scheduleByDay[day]) {
        scheduleByDay[day].scheduled_hours += hoursStudied;
      }
    });

    // Step 3: Fetch the student's absences by student ID and deduct from scheduled hours
    const absenceQuery = `
      SELECT 
        a.DATE_SEANCE 
      FROM 
        bd_local.esp_absence_new a
      WHERE 
        a.ID_ET = :id_et
        AND a.DATE_SEANCE BETWEEN TO_DATE('2024-01-01', 'YYYY-MM-DD') AND SYSDATE
    `;
    const absenceResult = await connection.execute(absenceQuery, { id_et: studentId });
    
    console.log('Absence Query Result:', absenceResult.rows); // Log the absence query result

    absenceResult.rows.forEach((row) => {
      const date = new Date(row[0]); // Access DATE_SEANCE correctly
      const day = getDayName(date);
      console.log(`Absence on ${day}, Date: ${row[0]}`);

      if (day !== 'Sunday' && scheduleByDay[day]) {
        scheduleByDay[day].absent_hours += convertAbsenceToHours(1); // Deduct absence hours
      }
    });

    // Step 4: Calculate remaining hours for each day
    Object.keys(scheduleByDay).forEach((day) => {
      scheduleByDay[day].remaining_hours = scheduleByDay[day].scheduled_hours - scheduleByDay[day].absent_hours;
    });

    console.log('Final Schedule By Day:', scheduleByDay); // Log the final calculated schedule

    const response = {
      student_id: studentId,
      days: scheduleByDay,
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating study hours for student:', error.message);
    res.status(500).json({ error: 'Failed to calculate study hours', message: error.message });
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
