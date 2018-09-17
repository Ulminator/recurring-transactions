const
  zmq = require('zeromq'),
  replier = zmq.socket('rep'),
  mongo = require('./mongo/setup'); // change this
  User = require('./mongo/models/user'), // maybe remove
  Transaction = require('./mongo/models/transaction'),
  { UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS } = require('./constants');

mongo();

function upsertTransactions(transactions, cb) {
  let count = 0;
  transactions.forEach(data => {
    const query = { trans_id: data.trans_id, user_id: data.user_id };
    data.company = data.name.replace(/\d/g, '').trim().toUpperCase();

    Transaction.findOneAndUpdate(query, data, { runValidators: true, upsert: true }, (err, doc) => {
      if (err) {
        console.log(data);
        return cb(err);
      }
      if (++count === transactions.length) return cb();
    });
  });
};

replier.on('message', (data) => {
  let request = JSON.parse(data);
  // look into: what happens to the data if it processes but there is a timeout (no response sent back in time)?

  if (request.task === UPSERT_USER_TRANSACTIONS) {

    upsertTransactions(request.transactions, (err) => {
      if (err) console.log(err);
      else {
        const { user_id } = request.transactions[0];

        Transaction.aggregate([
          { $match: { user_id } },
          { $group: { _id: "$company", dates: { $push: "$date" } } }
        ])
        .then((res) => {
          
        });
        console.log('after');

        let recurring_trans = [];

        replier.send(JSON.stringify({
          recurring_trans
        }));
      }
    });
  } else if (request.task === GET_RECURRING_TRANSACTIONS) {


  }
});

replier.bind(TCP_ADDRESS, (err) => {
  if (err) console.log(err);
  else console.log('Listening for zmq requesters...');
});
