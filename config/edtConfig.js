// config/edtConfig.js
const oracledb = require('oracledb');

async function connectToDatabase() {
  let connection;
  try {
    await oracledb.initOracleClient({ libDir: 'C:\\instantclient_23_4' });
    connection = await oracledb.getConnection({
      user: '***********',
      password: '***********',
      connectString: '**********/********'
    });
    console.log('Successfully connected to remote Oracle Database');
    return connection;
  } catch (error) {
    console.error('Error connecting to remote Oracle Database:', error.message);
    throw error;
  }
}

module.exports = connectToDatabase;
