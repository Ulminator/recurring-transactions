const
  cluster = require('cluster'),
  zmq = require('zeromq'),
  os = require('os'),
  { 
    TCP_ADDRESS,
    WORKER_ENDPOINT
  } = require('../constants'),

  workerCount = os.cpus().length;

if (cluster.isMaster) {
  
  let
    router = zmq.socket('router').bind(TCP_ADDRESS), 
    dealer = zmq.socket('dealer').bind(WORKER_ENDPOINT); 

  router.on('message', function() {
    let frames = Array.prototype.slice.call(arguments);
    dealer.send(frames);
  });

  dealer.on('message', function() {
    let frames = Array.prototype.slice.call(arguments);
    router.send(frames);
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online.`);
  });

  cluster.on('exit', (worker, code) => {
    if (code != 0 && !worker.suicide) {
      console.log(`Worker process ${worker.process.pid} crashed: Starting a new worker`);
      cluster.fork();
    }
  });

  for (let i = 0; i < workerCount; i++) {
    let worker = cluster.fork();
    worker.on('message', (msg) => console.log(msg));
  }

  process.on('SIGINT', () => {
    router.close();
    dealer.close();
    process.exit();
  });

} else { require('./worker-app.js'); }
