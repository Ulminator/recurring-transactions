const
  zmq = require('zeromq'),
  replier = zmq.socket('rep'),
  mongoConnect = require('./mongo/connect'),
  Transaction = require('./mongo/models/transaction'),
  { UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS } = require('./constants');

function upsertTransactions(transactions, cb) {
  let count = 0;
  transactions.forEach(data => {
    const query = { trans_id: data.trans_id, user_id: data.user_id };
    data.entity = data.name.replace(/\d/g, '').trim().toUpperCase();
    // ([20]{2}[1-9]{2}[01]\d[0-3]\d| 

    // REGEX OF DATE -> NOW I NEED REFERENCE NUMBERS
    // ([0-9]{6}|[A-Z0-9]{6})
    Transaction.findOneAndUpdate(query, data, { runValidators: true, upsert: true }, (err) => {
      if (err) return cb(err);
      if (++count === transactions.length) return cb();
    });
  });
};

function getUserTransactionsAndBucketize(user_id, cb) {
  Transaction.aggregate([
    { $match: { user_id } },
    { $bucket: {
      groupBy: "$amount",
      boundaries: [-5000, 0, 30, 100, 250, 500, 1000, 5000],
      default: "Other",
      output: { transactions: { $push: "$$ROOT" }}
    }},
    { $unwind: "$transactions" },
    { $group: {
      _id: { entity: "$transactions.entity", bin: "$_id" },
      transactions: { $push: "$transactions" }
    }},
    { $project: {
      _id: 0,
      entity: "$_id.entity",
      bin: "$_id.bin",
      transactions: 1
    }},
    { $group: {
      _id: { entity: "$entity" },
      buckets: { "$push": "$$ROOT" }
    }},
    { $project: {
      _id: 0,
      entity: "$_id.entity",
      buckets: { bin: 1, transactions: 1 }
    }}
  ], (err, docs) => {
    if (err) return cb(err);
    return cb(null, docs);
  });
}

// look into: what happens to the data if it processes but there is a timeout (no response sent back in time)?
mongoConnect(() => {

  replier.on('message', (data) => {
    let request = JSON.parse(data);
  
    if (request.task === UPSERT_USER_TRANSACTIONS) {

      upsertTransactions(request.transactions, (err) => {
        if (err) console.log('ahh');
        else {
          const { user_id } = request.transactions[0];
          
          getUserTransactionsAndBucketize(user_id, (err, docs) => {
            if (err) console.log(err);
            else {
              console.log(docs);
            }
          })

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

});
