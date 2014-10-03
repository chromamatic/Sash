var Organization, OrganizationSchema, Promise, Schema, configuration, db, genApiKey, hexDigest, mongoose, timestamps;

mongoose = require('mongoose');
timestamps = require('mongoose-timestamps');
configuration = require('../lib/configuration');
hexDigest = require('../lib/hex_digest');
Promise = require('mongoose').Promise;
Schema = mongoose.Schema;
db = mongoose.createConnection(configuration.get('mongodb'));

OrganizationSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    org: String,
    api_key: String,
    contact: String,
    hashed_password: String,
    salt: String
}, {
    strict: true
});

OrganizationSchema.plugin(timestamps);

OrganizationSchema.virtual('password').get(function() {
    return this.password;
});

OrganizationSchema.virtual('password').set(function(p) {
    this.temp_pw = p;
    return this.hashed_password = hexDigest(p);
});

OrganizationSchema.virtual('origin').get(function() {
    return "http://" + configuration.get('hostname');
});

OrganizationSchema.pre('save', function(next) {
    if (this.api_key == null) {
        this.api_key = genApiKey();
    }
    return next();
});

genApiKey = function() {
    return "xxxxxxxxxxxxxxxx".replace(/x/g, function() {
        return (Math.random() * 16 | 0).toString(16);
    });
};

OrganizationSchema.methods.assertion = function() {
    var assertion;
    assertion = {};
    assertion.name = this.name;
    if (this.origin != null) {
        assertion.origin = this.origin;
    }
    if (this.contact != null) {
        assertion.contact = this.contact;
    }
    if (this.org != null) {
        assertion.org = this.org;
    }
    return assertion;
};

OrganizationSchema.methods.users = function(callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    this.model('User').find({
        organization: this.id
    }, promise.resolve.bind(promise));
    return promise;
};

OrganizationSchema.methods.badges = function(limit, callback) {
    var promise, query;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    query = this.model('Badge').where('issuer_id', this.id);
    if (limit) {
        query = query.limit(limit);
    }
    query.exec(function(err, result) {
        return promise.resolve(err, result);
    });
    return promise;
};

OrganizationSchema.methods.badgeCount = function(callback) {
    var promise, query;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    query = this.model('Badge').count({
        'issuer_id': this.id
    });
    query.exec(function(err, result) {
        return promise.resolve(err, result);
    });
    return promise;
};

Organization = db.model('Organization', OrganizationSchema);

module.exports = Organization;
