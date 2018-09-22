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
    type: String,
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
  entity: {
    type: String,
    required: true,
  },
});

transactionSchema.index({ user_id: 1 });
transactionSchema.index({ trans_id: 1, user_id: 1}, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
