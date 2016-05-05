var mongoose = require('mongoose');
var inviteType = ['open', 'restricted'];
var inviteStatus = ['accepted', 'denied', 'pending'];

var InviteSchema = new mongoose.Schema({
    startTime: Date,
    endTime: Date,
    inviteType: {
        type: String,
        enum: inviteType
    },
    request: [{
        userId: String,
        timestamp: Date,
        status: {
            type: String,
            enum: inviteStatus
        }
    }]
});

module.exports = mongoose.model('Invite', InviteSchema);



