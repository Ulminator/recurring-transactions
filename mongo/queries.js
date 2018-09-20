const
  mathjs = require('mathjs'),
  Transaction = require('./models/transaction');

function updateRecurringTrans(recurring_trans, user_id, transactions, amounts, recurringCategory) {
  const { name, date } = transactions[0];

  const next_amt = Math.round(mathjs.mean(amounts) * 100)/100;

  const next_date = new Date(date);
  next_date.setDate(next_date.getDate() + recurringCategory);

  recurring_trans.push({ name, user_id, next_amt, next_date, transactions });
}

function identifyRecurringTransactions(user_id, docs) {
  const recurring_trans = [];
  docs.forEach(doc => {
    console.log("\n" + doc.entity);
    doc.buckets.forEach(bucket => {
      const { transactions } = bucket;

      if (transactions.length === 1) { return; }

      let
        daysPassed = [];
        amounts = [];

      for (let x = 0; x < transactions.length; x++) {
        amounts.push(transactions[x].amount);
        if (x !== transactions.length - 1) {
          const days = ((transactions[x].date - transactions[x+1].date)/(1000*60*60*24));
          daysPassed.push(days)
        }
      }

      const meanDays = mathjs.mean(daysPassed);
      let recurringCategory = null;

      if      (meanDays >= 5.5 && meanDays <= 8.5)   { recurringCategory = 7; }
      else if (meanDays >= 11.5 && meanDays <= 16.5) { recurringCategory = 14; }
      else if (meanDays >= 28 && meanDays <= 33)     { recurringCategory = 31; }
      else if (meanDays >= 360 && meanDays <= 370)   { recurringCategory = 365; }

      if (recurringCategory !== null) { updateRecurringTrans(recurring_trans, user_id, transactions, amounts, recurringCategory); }
      else { console.log('NOT RECURRING WITH MEAN: ' + meanDays); }

    });
  });
  return recurring_trans;
}

function upsertUserTransactions(transactions, cb) {
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
  
function getUserRecurringTransactions(user_id, cb) {
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
    { $sort: { "_id": 1 } },
    { $project: {
      _id: 0,
      entity: "$_id.entity",
      buckets: { bin: 1, transactions: 1 }
    }}
  ], (err, docs) => {
    if (err) return cb(err);

    const recurring_trans = identifyRecurringTransactions(user_id, docs);
    cb(null, recurring_trans);
  });
}

module.exports = {
  upsertUserTransactions,
  getUserRecurringTransactions
}
