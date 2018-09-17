const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  user_id: {
    type: String, //unique, reference user schema
    required: true,
  },
  transactions: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    }]
  }
});

module.exports = mongoose.model('User', userSchema);
