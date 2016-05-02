var mongoose = require('mongoose');
var inviteType = ['open', 'restricted'];

var InviteSchema = new mongoose.Schema({
    startTime: Date,
    endTime: Date,
    event: {
        type: String,
        required: true
    },
    inviteType: {
        type: String,
        enum: inviteType
    },
    request: [{
        userId: String,
        timestamp: Date
    }]
});

module.exports = mongoose.model('Invite', InviteSchema);



