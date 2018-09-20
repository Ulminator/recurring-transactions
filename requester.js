const
  zmq = require('zeromq'),
  csv = require('fast-csv'),
  { UPSERT_USER_TRANSACTIONS,
    GET_RECURRING_TRANSACTIONS,
    TCP_ADDRESS,
    DATA_PATH } = require('./constants'),

  requester = zmq.socket('req');

// How long to wait before timing-out a connection
// after sending a ZMTP heartbeat
// requester.setsockopt('heartbeat_timeout', 500);

// Sets the interval between sending ZMTP heartbeats
// requester.setsockopt('heartbeat_ivl', 500);

// requester.setsockopt('heartbeat_ttl', 500);

requester.on('message', (data) => {
  let request = JSON.parse(data);
  console.log(`Number of recurring transactions: ${request.recurring_trans.length}`);
});

requester.on('error', (err) => {
  console.log(err);
})

requester.connect(TCP_ADDRESS);

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


