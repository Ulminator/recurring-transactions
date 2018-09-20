const
  zmq = require('zeromq'),
  replier = zmq.socket('rep'),
  mathjs = require('mathjs');
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
    { $sort:  { "date": -1 } }, 
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
              docs.forEach(doc => {
                console.log("\n" + doc.entity);
                let goodstuff = [];
                  doc.buckets.forEach(bucket => {
                    // console.log(bucket.bin);
                    if (bucket.transactions.length === 1) { return; }
                    
                    let daysPassed = [];
                    for (let x = 0; x < bucket.transactions.length; x++) {
                      if (x !== bucket.transactions.length - 1) {
                        const days = ((bucket.transactions[x].date - bucket.transactions[x+1].date)/(1000*60*60*24));
                        daysPassed.push(days)
                      }
                    }
                    const mean = mathjs.mean(daysPassed);
                    // console.log(mathjs.std(daysPassed));

                    if (mean >= 5.5 && mean <= 8.5) {
                      console.log('weekly sub of size: ' + daysPassed.length+1)
                    }
                    else if (mean >= 11.5 && mean <= 16.5) {
                      console.log('every other week sub of size: ' + daysPassed.length+1);

                    }
                    else if (mean >= 28 && mean <= 33) {
                      console.log('monthly sub of size: ' + daysPassed.length+1);

                    }
                    else if (mean >= 360 && mean <= 370) {
                      console.log('yearly sub of size: ' + daysPassed.length+1);

                    }
                    else {
                      console.log('NOT RECURRING WITH MEAN: ' + mean);
                    }
                  });
              });
            }
          });

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
