module.exports.UPSERT_USER_TRANSACTIONS = 'upsert_transactions';
module.exports.GET_RECURRING_TRANSACTIONS = 'get_recurring_transactions';

module.exports.DB_URL = 'mongodb://localhost:27017/interview_challenge';
module.exports.DATA_PATH = './mongo/data/user1_transactions.csv';

module.exports.TCP_ADDRESS = 'tcp://127.0.0.1:1984';

// FOR CLUSTERED APP
module.exports.WORKER_ENDPOINT = 'ipc://rep-cluster.ipc';
