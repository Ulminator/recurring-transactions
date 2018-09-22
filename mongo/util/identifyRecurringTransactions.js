const mathjs = require('mathjs');

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

      let recurringCategory = null;
      const meanDays = mathjs.mean(daysPassed);

      if      (meanDays >= 5.5 && meanDays <= 8.5)   { recurringCategory = 7; }
      else if (meanDays >= 11.5 && meanDays <= 16.5) { recurringCategory = 14; }
      else if (meanDays >= 28 && meanDays <= 33)     { recurringCategory = 31; }
      else if (meanDays >= 360 && meanDays <= 370)   { recurringCategory = 365; }

      if (recurringCategory !== null) { updateRecurringTrans(recurring_trans, user_id, transactions, amounts, recurringCategory); }
    });
  });
  return recurring_trans;
}

module.exports = identifyRecurringTransactions;