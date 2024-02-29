const mongoose = require('mongoose');

const SenderModel = require('./sender-model')
const DriverModel = require('./driver-model')


const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  current_location: { type: String, required: true },
  destination: { type: String, required: true },
  price: { type: String, required: true },
  status: {
    type: String, 
    required: true,
    enum: ['pending', 'accepted', 'finished', 'canceled'],
    default: 'pending'
  },
  sender: [{
    type: Schema.Types.ObjectId,
    ref: 'senders',
  }],
  driver: [{
    type: Schema.Types.ObjectId,
    ref: 'drivers',
  }],
  created_at: { type: Date, default: new Date() },
});

OrderSchema.pre('save', async function (next) {
  try {
    const sender = await SenderModel.findById(this.sender);
    const driver = await DriverModel.findById(this.driver);
    if (sender && driver) {
      this.sender = sender;
      this.driver = driver;
    }
    next();
  } catch (error) {
    next(error);
  }
});



const OrderModel = mongoose.model('orders', OrderSchema);

module.exports = OrderModel;
