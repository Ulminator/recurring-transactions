const
  zmq = require('zeromq'),
  replier = zmq.socket('rep'),
  bucketize = require('./bucketize'),
  mongoConnect = require('./mongo/connect'),
  User = require('./mongo/models/user'), // maybe remove
  Transaction = require('./mongo/models/transaction'),
  { UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS } = require('./constants');

function upsertTransactions(transactions, cb) {
  let count = 0;
  transactions.forEach(data => {
    const query = { trans_id: data.trans_id, user_id: data.user_id };
    data.company = data.name.replace(/\d/g, '').trim().toUpperCase();
    // ([20]{2}[1-9]{2}[01]\d[0-3]\d| 

    // REGEX OF DATE -> NOW I NEED REFERENCE NUMBERS
    // ([0-9]{6}|)
    Transaction.findOneAndUpdate(query, data, { runValidators: true, upsert: true }, (err) => {
      if (err) return cb(err);
      if (++count === transactions.length) return cb();
    });
  });
};

mongoConnect(() => {

  replier.on('message', (data) => {
    let request = JSON.parse(data);
    // look into: what happens to the data if it processes but there is a timeout (no response sent back in time)?
  
    if (request.task === UPSERT_USER_TRANSACTIONS) {
  
      upsertTransactions(request.transactions, (err) => {
        if (err) console.log('ahh');
        else {
          const { user_id } = request.transactions[0];
          
          const query = { user_id: data.trans_id, company: data.user_id };
  
          Transaction.find({ user_id }).distinct('company', (error, companies) => {
            companies.forEach(company => {
              // If the query planner cannot obtain the sort order from an index, it will sort the results in memory
              Transaction.find({ user_id, company }).sort({ amount: -1 }).then(docs => {
  
              });
            });
          });
  
          Transaction.aggregate([
            { $match: { user_id } },
            // { $group: { _id: "$company", data: { $push: { date: "$date", amount: "$amount", is_recurring: "$is_recurring" } } } }
            { $group: { _id: "$company", data: { $push: { date: "$date", amount: "$amount", recurring: "$is_recurring" }}, amounts: { $push: "$amount" } } }
  
          ])
          .then((res) => {
            res.forEach(company => {
              // console.log(`${company._id} : ${company.data[0].recurring}`);
              // console.log(`N: ${company.amounts.length}`);
              const { amounts } = company;
              // const buckets = bucketize(amounts);
              // console.log(buckets)
              
  
              // for (let x = 0; x < company.data.length; x++) {
              //   if (company.data.length > 1) {
              //     const daysPassed = (x !== 0) ? (-1*(company.data[x].date - company.data[x-1].date)/(1000*60*60*24)) : null;
              //     company.data[x].daysPassed = daysPassed;
              //   }
              // }
              // console.log(company);
            });
            
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
