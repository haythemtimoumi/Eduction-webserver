const moment = require('moment');

// Function to generate motivational messages based on absence data
function generateMotivationalMessage(absences) {
  if (absences.length === 0) {
    return {
      generalMessage: 'Excellent!',
      scoreMessage: 0,
      absenceMessage: 'No absences',
      effortMessage: 'Keep it up!'
    };
  }

  absences.sort((a, b) => new Date(a.DATE_SEANCE) - new Date(b.DATE_SEANCE));
  const absenceDates = absences.map(absence => moment(absence.DATE_SEANCE));
  const absenceCount = absenceDates.length;
  const consecutiveWeeks = getConsecutiveWeeks(absenceDates);

  // Determine absence score
  let absenceScore = 0;
  if (absenceCount === 0) {
    absenceScore = 0;
  } else if (absenceCount <= 4) {
    absenceScore = 1;
  } else if (absenceCount <= 9) {
    absenceScore = 2;
  } else {
    absenceScore = 3;
  }

  // Determine streak score
  let streakScore = 0;
  if (consecutiveWeeks === 1) {
    streakScore = 1;
  } else if (consecutiveWeeks <= 4) {
    streakScore = 2;
  } else {
    streakScore = 3;
  }

  // Combine scores and ensure it's within the range [0, 6]
  let totalScore = absenceScore + streakScore;
  totalScore = Math.min(6, totalScore);

  // Generate messages based on the score
  let generalMessage = '';
  let effortMessage = '';

  switch (totalScore) {
    case 0:
      generalMessage = 'Excellent!';
      break;
    case 1:
      generalMessage = 'Good job!';
      break;
    case 2:
      generalMessage = 'Well done!';
      break;
    case 3:
      generalMessage = 'Needs Improvement';
      break;
    case 4:
      generalMessage = 'Significant Effort';
      break;
    case 5:
      generalMessage = 'Keep Trying';
      break;
    case 6:
      generalMessage = 'Great Progress';
      break;
  }

  // Calculate the days since the last absence
  const lastAbsenceDate = absenceDates[absenceDates.length - 1];
  const daysSinceLastAbsence = moment().diff(lastAbsenceDate, 'days');

  // Customize effortMessage based on the number of absences and recent behavior
  if (absenceCount === 0) {
    effortMessage = 'Keep it up!';
  } else {
    if (daysSinceLastAbsence <= 7) {
      // Recent absence
      if (absenceCount <= 4) {
        effortMessage = 'Great effort!';
      } else if (absenceCount <= 9) {
        effortMessage = 'Improving attendance!';
      } else {
        effortMessage = 'Focus on consistency!';
      }
    } else {
      // No recent absences
      if (absenceCount <= 4) {
        effortMessage = 'Nice job overall!';
      } else if (absenceCount <= 9) {
        effortMessage = 'Review absences!';
      } else {
        effortMessage = 'Address absences!';
      }
    }
  }

  return {
    generalMessage,
    scoreMessage: totalScore,
    absenceMessage: `You have ${absenceCount} absence${absenceCount > 1 ? 's' : ''}.`,
    effortMessage
  };
}

// Function to get the number of consecutive weeks with attendance
function getConsecutiveWeeks(absenceDates) {
  if (absenceDates.length === 0) return 0;

  let maxConsecutiveWeeks = 0;
  let currentStreak = 0;
  let currentWeekStart = moment(absenceDates[0]).startOf('week');

  absenceDates.forEach(date => {
    const weekStart = moment(date).startOf('week');
    if (weekStart.isSame(currentWeekStart)) {
      currentStreak++;
    } else {
      maxConsecutiveWeeks = Math.max(maxConsecutiveWeeks, currentStreak);
      currentStreak = 1;
      currentWeekStart = weekStart;
    }
  });

  maxConsecutiveWeeks = Math.max(maxConsecutiveWeeks, currentStreak);
  return maxConsecutiveWeeks;
}

module.exports = generateMotivationalMessage;
