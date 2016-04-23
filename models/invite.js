var mongoose = require('mongoose');

var InviteSchema = new mongoose.Schema({
    startTime: Date,
    endTime: Date,
    eventId: String,
    request: {
        userId: String,
        timestamp: Date
    }
});

module.exports = mongoose.model('Invite', InviteSchema);



