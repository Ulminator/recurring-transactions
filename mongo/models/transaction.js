const mongoose = require('mongoose');

const { Schema } = mongoose;

const transactionSchema = new Schema({
  trans_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  user_id: {
    type: String, //{ type: mongoose.Schema.Types.ObjectId, ref: 'users' } reference user schema?
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  is_recurring: {
    type: String
  }
});

// up in the air
transactionSchema.index({ user_id: 1, company: 1, amount: -1 });  // to find specific user/company transactions with amounts in decending order

// 100% need
transactionSchema.index({ user_id: 1 }, { unique: true });  // for finding transactions by user
transactionSchema.index({ trans_id: 1, user_id: 1}, { unique: true });  // for the upsert transaction (makes unique combination of fields)

module.exports = mongoose.model('Transaction', transactionSchema);
