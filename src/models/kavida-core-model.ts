const mongoose = require('mongoose');
const CoreUserSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String },
});


const CoreUserModel = mongoose.model('users', CoreUserSchema);

module.exports = CoreUserModel;
