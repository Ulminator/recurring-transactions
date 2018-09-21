const
  zmq = require('zeromq'),
  mongoConnect = require('./mongo/connect'),

  {
    upsertUserTransactions,
    getUserRecurringTransactions
  } = require('./mongo/queries'),

  { 
    UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS
  } = require('./constants'),

  replier = zmq.socket('rep');

mongoConnect(() => {

  replier.on('message', (data) => {
    const request = JSON.parse(data);

    if (request.task === UPSERT_USER_TRANSACTIONS) {
      const { transactions } = request;
      upsertUserTransactions(transactions, (err) => {
        if (err) console.log(err);
        else {
          const { user_id } = transactions[0];
          getUserRecurringTransactions(user_id, (err, recurring_trans) => {
            if (err) console.log(err);           
            replier.send(JSON.stringify({
              recurring_trans
            }));
          });          
        }
      });
    } else if (request.task === GET_RECURRING_TRANSACTIONS) {
      const { user_id } = request;
      getUserRecurringTransactions(user_id, (err, recurring_trans) => {
        if (err) console.log(err);           
        replier.send(JSON.stringify({
          recurring_trans
        }));
      });
    }
  });
  
  replier.bind(TCP_ADDRESS, (err) => {
    if (err) console.log(err);
    else console.log('Listening for zmq requesters...');
  });
});
