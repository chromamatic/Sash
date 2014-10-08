var EarnedBadgeSchema, Organization, Promise, Schema, User, UserSchema, configuration, db, formatDate, hexDigest, moment, mongoose, timestamps, _;

_ = require('underscore');
mongoose = require('mongoose');
Promise = mongoose.Promise;
timestamps = require('mongoose-timestamps');
Schema = mongoose.Schema;
Organization = require('./organization');
configuration = require('../lib/configuration');
hexDigest = require('../lib/hex_digest');
moment = require('moment');
db = mongoose.createConnection(configuration.get('mongodb'));

EarnedBadgeSchema = new Schema({
    name: String,
    image: {
        type: String
    },
    imageObj: {
        type: Schema.Types.Mixed
    },
    description: String,
    criteria: String,
    facebook_text: String,
    twitter_text: String,
    link: String,
    version: String,
    issuer_id: {
        type: Schema.ObjectId,
        ref: 'Organization'
    },
    badge_id: {
        type: Schema.ObjectId,
        ref: 'Badge'
    },
    slug: {
        type: String
    },
    tags: [String],
    issued_on: Date,
    seen: {
        type: Boolean,
        "default": false
    }
});

EarnedBadgeSchema.methods.toJSON = function() {
    return {
        name: this.name,
        image: this.image,
        imageObj: this.imageObj,
        description: this.description,
        criteria: this.criteria,
        link: this.link,
        twitter_text: this.twitter_text,
        facebook_text: this.facebook_text,
        version: this.version,
        slug: this.slug,
        tags: this.tags,
        issued_on: this.issued_on,
        seen: this.seen,
        id: this.id
    };
};

UserSchema = new Schema({
    username: {
        type: String,
        lowercase: true,
        unique: true
    },
    email: {
        type: String,
        lowercase: true
    },
    created_at: Date,
    updated_at: Date,
    organization: {
        type: Schema.ObjectId,
        ref: 'Organization'
    },
    badges: [EarnedBadgeSchema],
    tags: [String],
    email_hash: String
});

UserSchema.index({
    email: 1,
    username: 1
});

UserSchema.index({
    email_hash: 1
});

UserSchema.index({
    "badges.slug": 1
});

UserSchema.plugin(timestamps);

UserSchema.pre('save', function(next) {
    if ((this.email != null) && (this.email_hash == null)) {
        if (this.organization instanceof Organization) {
            this.email_hash = hexDigest(this.email, this.organization.salt);
            return next();
        } else {
            return this.model("Organization").findById(this.organization, (function(_this) {
                return function(err, org) {
                    _this.email_hash = hexDigest(_this.email, org.salt);
                    return next();
                };
            })(this));
        }
    } else {
        return next();
    }
});

UserSchema.virtual('recipient').get(function() {
    var pepper, salt;
    salt = this.organization.salt;
    pepper = this.email;
    return 'sha256$' + hexDigest(pepper, salt);
});

UserSchema.methods.earn = function(badge, callback) {
    var b, exists;
    if (!(badge.id && badge.issuer_id)) {
        callback(new Error("must pass a valid badge object"));
    }
    exists = _.any(this.badges, function(earned_badge, i) {
        return earned_badge.id.toString() === badge.id;
    });
    if (exists) {
        return callback(null, {
            message: 'User already has this badge',
            earned: false
        });
    } else {
        b = badge.toJSON();
        b.issued_on = new Date();
        b.badge_id = badge.id;
        b.image = badge.imageUrl;
        b.imageObj = badge.image;
        delete b.issued_count;
        this.badges.push(b);
        return this.save((function(_this) {
            return function(err, user) {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, {
                        message: 'successfully added badge',
                        earned: true,
                        badge: {
                            name: badge.name,
                            description: badge.description,
                            image: badge.imageUrl,
                            criteria: badge.criteria,
                            id: badge.id
                        }
                    });
                }
            };
        })(this));
    }
};

formatDate = function(dateObj) {
    return moment(dateObj).format("YYYY-MM-DD");
};

UserSchema.methods.assertion = function(slug, callback) {
    var assertion, earned_badge, promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    earned_badge = _.detect(this.badges, function(earned_badge, i) {
        return earned_badge.slug === slug;
    });
    assertion = {};
    assertion.recipient = this.recipient;
    assertion.issued_on = formatDate(earned_badge.issued_on);
    assertion.salt = this.organization.salt;
    this.model('Badge').where('slug').equals(slug).populate('issuer_id').exec((function(_this) {
        return function(err, badges) {
            var badge, _ref;
            badge = badges[0];
            if (badge != null) {
                assertion.badge = {
                    name: badge.name,
                    image: badge.image.original.defaultUrl,
                    version: badge.version,
                    description: badge.description,
                    criteria: badge.criteriaUrl,
                    issuer: {
                        origin: badge.issuer_id.origin,
                        name: badge.issuer_id.name,
                        org: badge.issuer_id.org,
                        contact: badge.issuer_id.contact
                    }
                };
                return promise.resolve(err, assertion);
            } else {
                return promise.resolve((_ref = err != null) != null ? _ref : {
                    err: new Error()
                }, null);
            }
        };
    })(this));
    return promise;
};

User = db.model('User', UserSchema);

User.findByUsernameOrEmail = function(username, email, callback) {
    var e, promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    if ((username != null) && (email != null)) {
        User.where().or([
            {
                username: username
            }, {
                email: email
            }
        ]).populate('organization').exec(function(err, users) {
            return promise.resolve(err, users[0]);
        });
    } else if ((username == null) && (email != null)) {
        User.where('email').equals(email).populate('organization').exec(function(err, users) {
            return promise.resolve(err, users[0]);
        });
    } else if ((username != null) && (email == null)) {
        User.where('username').equals(username).populate('organization').exec(function(err, users) {
            return promise.resolve(err, users[0]);
        });
    } else {
        e = new Error("Need either username or email!");
        promise.resolve(e, null);
    }
    return promise;
};

User.findByEmailHash = function(email_hash, callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    User.where('email_hash').equals(email_hash).populate('organization').exec(function(err, users) {
        return promise.resolve(err, users[0]);
    });
    return promise;
};

User.findOrCreate = function(username, email, options, callback) {
    var issuer_id, tags;
    issuer_id = options.issuer_id;
    tags = options.tags;
    return User.findByUsernameOrEmail(username, email, function(e, user) {
        if (e != null) {
            callback(e, null);
            return;
        }
        if (user != null) {
            if ((user.email == null) && (email != null)) {
                user.email = email;
            }
            if (tags != null) {
                user.tags.merge(tags);
            }
            user.save();
            return callback(null, user);
        } else {
            user = new User({
                username: username,
                email: email,
                organization: issuer_id
            });
            if (tags != null) {
                user.tags.merge(tags);
            }
            return user.save(function(err) {
                return callback(err, user);
            });
        }
    });
};

module.exports = User;
