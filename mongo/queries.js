const
  Transaction = require('./models/transaction'),
  identifyRecurringTransactions = require('./util/identifyRecurringTransactions');

function upsertUserTransactions(transactions, cb) {
  let count = 0;
  transactions.forEach(data => {
    const query = { trans_id: data.trans_id, user_id: data.user_id };
    data.entity = data.name.split(' ').map(split => split.replace(/^((?=.*\d)(?=.*[A-Z])[A-Z\d]{6,}|[\d]{6,})$/, '')).join(' ').trim().toUpperCase();

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
    { $project: { _id: 0, __v: 0 }},
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
