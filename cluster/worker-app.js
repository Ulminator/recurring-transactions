const
  zmq = require('zeromq'),
  mongoConnect = require('../mongo/connect'),
  {
    upsertUserTransactions,
    getUserRecurringTransactions
  } = require('../mongo/queries'),
  { 
    UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    WORKER_ENDPOINT
  } = require('../constants');

mongoConnect(() => {

  let timer;

  const
    replier = zmq.socket('rep');
    pid = process.pid;

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
          process.send({ err, pid, timestamp: Date.now() });
          if (timer) {
            replier.send(JSON.stringify({ err: 'UPSERT TRANSACTIONS' }));
            clearTimeout(timer);
          }
        }
        else if (timer) {
          const { user_id } = transactions[0];
          getUserRecurringTransactions(user_id, (err, recurring_trans) => {
            if (err) process.send({ pid, err, timestamp: Date.now() });
            if (timer) {
              if (err){
                replier.send(JSON.stringify({ err: 'GET RECURRING TRANSACTIONS' }));
              } else {
                replier.send(JSON.stringify({ recurring_trans }));
                process.send({ pid, timestamp: Date.now() });
              }
              clearTimeout(timer);
            }
          });          
        }
      });
    } else if (request.task === GET_RECURRING_TRANSACTIONS) {
      const { user_id } = request;
      getUserRecurringTransactions(user_id, (err, recurring_trans) => {
        if (err) process.send({ pid, err, timestamp: Date.now() });
        if (timer) {
          if (err){
            replier.send(JSON.stringify({ err: 'GET RECURRING TRANSACTIONS' }));
          } else {
            replier.send(JSON.stringify({ recurring_trans }));
            process.send({ pid, timestamp: Date.now() });
          }
          clearTimeout(timer);
        }
      });
    } else {
      process.send({ pid, err: 'INVALID TASK', timestamp: Date.now() });
      replier.send(JSON.stringify({ err: 'INVALID TASK' }));
      clearTimeout(timer);
    }
  });
  
  replier.connect(WORKER_ENDPOINT, (err) => {
    if (err) {
      process.send({ pid, err: `Failed to bind to socket: ${err.message}`, timestamp: Date.now() });
      process.exit(0);
    }
    process.send({ msg: 'Listening for zmq requesters...' })
  });

  process.on('SIGINT', () => {
    console.log('workers cliosing');
    replier.close();
    process.exit();
  });

});
