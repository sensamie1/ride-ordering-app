const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const Schema = mongoose.Schema;

const SenderSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: new Date() },
  isVerified: {
    type: Boolean,
    default: false
  }
});

SenderSchema.pre('save', async function (next) {
  const sender = this;
  const hash = await bcrypt.hash(sender.password, 10);

  this.password = hash;

  // Remove confirm_password field before saving
  if (this.confirm_password) {
    delete this.confirm_password;
  }
  next();
})

SenderSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

const SenderModel = mongoose.model('senders', SenderSchema);

module.exports = SenderModel;
