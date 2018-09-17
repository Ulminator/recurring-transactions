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
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
