# Recurring Transaction App
This application uses the REP-REQ and DEALER-ROUTER ZeroMQ patterns to ingest a user's transaction data and classifies the recurring transactions of that user to help identify potential areas where the user can save money.

Requests can either be an upsert or a get. For the upsert, if the request data has an entry with a trans_id and user_id combination that matches an already existinc document in the transaction collection, the document will update, otherwise a new document will be added to the collection. For the get, all of the user's transaction data will be retrieved from the database and undergo a transformation in an aggregation pipeline that will make it easier to identify recurring transactions. Both the upsert and get will send a response back with the user's recurring transactions. The upsert is only called when new data is being added or updated.

### Setup
1. Install and start MongoDB.
    * If you are on a Mac and have brew you can run `./mongo/downloadMac.sh`
    * Start your mongo instance with `mongod`
2. Download dependencies with the standard `npm install`

### Running the Application
1. Start the Server
    * For REQ-REP: `node app.js`
    * For DEALER-ROUTER: `node cluster/app.js`
2. The application is now ready to receive requests.
    * This is done by calling `node requester.js [upsert|get] [interval]`
        * Either upsert or get must be added. This will then call the server once with that corresponding operation.
            * Upsert: The data being upserted is pulled from `./mongo/data/user1_transactions.csv`
        * The `interval` part refers to how often you want to make that request in ms.