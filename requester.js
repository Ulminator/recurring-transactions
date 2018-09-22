const
  zmq = require('zeromq'),
  csv = require('fast-csv'),
  { UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS,
    DATA_PATH } = require('./constants'),

  requester = zmq.socket('req');

requester.on('message', (data) => {
  let request = JSON.parse(data);
  if (request.err) {
    console.log(`ERROR: ${request.err}`);
  } else {
    // console.log(request.recurring_trans);
    console.log(`Number of recurring transactions: ${request.recurring_trans.length}`);
  }
});

requester.connect(TCP_ADDRESS, (err) => {
  if (err) {
    console.log(`Failed to connect to socket: ${err.message}`);
    process.exit(0);
  }
});

if (process.argv[2] === 'upsert') {
  let transactions = [];
  csv
    .fromPath(DATA_PATH, { headers: true })
    .on('data', (data) => {
      transactions.push(data);
    })
    .on('end', () => {
      if (process.argv[3]) {
        setInterval(() => {
          requester.send(JSON.stringify({
            task: UPSERT_USER_TRANSACTIONS,
            transactions
          }));
        }, process.argv[3])
      } else {
          requester.send(JSON.stringify({
            task: UPSERT_USER_TRANSACTIONS,
            transactions
          }));
      }
    });
}
else if (process.argv[2] === 'get') {
  if (process.argv[3]) {
    setInterval(() => {
      requester.send(JSON.stringify({
        task: GET_RECURRING_TRANSACTIONS,
        user_id: '1'
      }));
    }, process.argv[3])
  } else {
    requester.send(JSON.stringify({
      task: GET_RECURRING_TRANSACTIONS,
      user_id: '1'
    }));
  }
}

process.on('SIGINT', () => {
  requester.close();
  process.exit();
});
