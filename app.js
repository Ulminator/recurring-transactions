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

  let timer;

  replier.on('message', (data) => {

    timer = setTimeout(() => {
      timer = null;
      replier.send(JSON.stringify({
        err: 'TIMEOUT'
      }));
    }, 10000);

    const request = JSON.parse(data);

    if (request.task === UPSERT_USER_TRANSACTIONS) {
      const { transactions } = request;
        upsertUserTransactions(transactions, (err) => {
          if (err) {
            console.log(err);
            if (timer){
              replier.send(JSON.stringify({ err: 'UPSERT TRANSACTIONS' }));
              clearTimeout(timer);
            }
          }
          else if (timer) {
            const { user_id } = transactions[0];
            getUserRecurringTransactions(user_id, (err, recurring_trans) => {
              if (err) console.log(err);
              if (timer) {
                if (err) {
                  replier.send(JSON.stringify({ err: 'GET RECURRING TRANSACTIONS' }));
                } else {
                  replier.send(JSON.stringify({ recurring_trans }));
                }
                clearTimeout(timer);
              }
            });          
          }
        });
    } else if (request.task === GET_RECURRING_TRANSACTIONS) {
      const { user_id } = request;
      getUserRecurringTransactions(user_id, (err, recurring_trans) => {
        if (err) console.log(err);
        if (timer) {
          if (err) {
            replier.send(JSON.stringify({ err: 'GET RECURRING TRANSACTIONS' }));
          } else {
            replier.send(JSON.stringify({ recurring_trans }));
          }
          clearTimeout(timer);
        }
      });
    } else {
      console.log({ err: 'INVALID TASK'})
      replier.send(JSON.stringify({ err: 'INVALID TASK' }));
      clearTimeout(timer);
    }
  });
  
  replier.bind(TCP_ADDRESS, (err) => {
    if (err) {
      console.log(`Failed to bind to socket: ${err.message}`);
      process.exit(0);
    }
    console.log('Listening for zmq requesters...');
  });

  process.on('SIGINT', () => {
    console.log('closing')
    replier.close();
    process.exit();
  });
});
