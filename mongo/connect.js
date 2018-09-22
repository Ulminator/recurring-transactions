const
  mongoose = require('mongoose'),
  { DB_URL } = require('../constants');

module.exports = (cb) => {

  mongoose.connect(DB_URL, {
    useNewUrlParser: true,
  });

  mongoose.connection.on('connected', () => {
    return cb();
  });

  // disconnect because currently if messages are sent to the replier while disconnected, the messages will get lost.
  mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from mongo instance.');
    process.exit(0);
  });

  mongoose.connection.on('error', (err) => {
    console.log(err);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('Mongoose default connection is disconnected due to application termination');
      process.exit(0);
    });
  });
};
