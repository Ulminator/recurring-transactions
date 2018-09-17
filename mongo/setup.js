const
  mongoose = require('mongoose'),
  { DB_URL } = require('../constants');

module.exports = () => {

  mongoose.connect(DB_URL);

  mongoose.connection.on('connected', () => {
    console.log(`Mongoose default connection is open to ${DB_URL}`);
  });

  mongoose.connection.on('error', (err) => {
    console.log(`Mongoose Error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection is disconnected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.db.dropDatabase((err) => {
      console.log('Mongoose database cleared.')
      mongoose.connection.close(() => {
        console.log('Mongoose default connection is disconnected due to application termination');
        process.exit(0);
      });
    });
  });
};
