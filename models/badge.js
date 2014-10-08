var Badge, BadgeSchema, BadgesToUsers, Promise, Schema, User, arrayUtils, async, attachments, attachmentsConfig, configuration, db, findAvailableSlug, fs, moment, mongoose, path, timestamps, util, _;

mongoose = require('mongoose');
timestamps = require('mongoose-timestamps');
attachments = require('mongoose-attachments-localfs');
moment = require('moment');
configuration = require('../lib/configuration');
arrayUtils = require('../lib/array');
BadgesToUsers = require('./badges_to_users');
User = require('./user');
async = require('async');
util = require('util');
fs = require('fs');
path = require('path');
_ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
Promise = mongoose.Promise;
Schema = mongoose.Schema;
db = mongoose.createConnection(configuration.get('mongodb'));

BadgeSchema = new Schema({
    name: String,
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
    issued_count: {
        type: String,
        "default": 0
    },
    slug: {
        type: String,
        unique: true
    },
    tags: [String]
});

BadgeSchema.plugin(timestamps);

BadgeSchema.pre('remove', function(next, done) {
    var btu, removeBadge, self, users;
    self = this;
    users = [];
    btu = null;
    removeBadge = function(userId, callback) {
        return User.findOne({
            _id: userId
        }, function(err, user) {
            var i, toDel, userBadges, _i, _ref;
            if (err != null) {
                console.error('an error occured exiting removeBadge');
                next(err);
            }
            if (userId != null) {
                console.log('no userId exiting removeBadge');
                userBadges = user.badges;
                toDel = [];
                for (i = _i = 0, _ref = userBadges.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                    if (userBadges[i]._id.toString() === self._id.toString()) {
                        toDel.push(i);
                    }
                }
                toDel.forEach(function(index) {
                    return userBadges.splice(index, 1);
                });
                return user.save(function(err) {
                    if (err != null) {
                        console.log('an error occured while saving user exiting removeBadge');
                    }
                    return callback(err);
                });
            } else {
                return callback();
            }
        });
    };
    return BadgesToUsers.findOne({
        badgeId: self._id
    }, function(err, _btu) {
        if (err != null) {
            next(err);
        }
        if (_btu != null) {
            btu = _btu;
            users = btu.users;
            return async.forEach(users, removeBadge, function(err) {
                if (err != null) {
                    return next(err);
                }
                return BadgesToUsers.remove({
                    _id: btu._id
                }, function(err) {
                    return next(err);
                });
            });
        } else {
            return next();
        }
    });
});

attachmentsConfig = {
    storage: {},
    properties: {
        image: {
            styles: {
                original: {
                    '$format': 'png'
                },
                originalGray: {
                    '$format': 'png',
                    'colorspace': 'Gray'
                },
                fullRetina: {
                    resize: '250x250>',
                    '$format': 'png'
                },
                fullRetinaGray: {
                    resize: '250x250>',
                    '$format': 'png',
                    'colorspace': 'Gray'
                },
                full: {
                    resize: '125x125>',
                    '$format': 'png'
                },
                fullGray: {
                    resize: '125x125>',
                    '$format': 'png',
                    'colorspace': 'Gray'
                },
                mini: {
                    resize: '27x27>',
                    '$format': 'png'
                },
                miniGray: {
                    resize: '27x27>',
                    '$format': 'png',
                    'colorspace': 'Gray'
                },
                miniRetina: {
                    resize: '52x52>',
                    '$format': 'png'
                },
                miniRetinaGray: {
                    resize: '52x52>',
                    '$format': 'png',
                    'colorspace': 'Gray'
                }
            }
        }
    }
};

if (configuration.usingS3()) {
    console.log("Using S3 for Badge images");
    attachmentsConfig.storage = {
        providerName: 's3',
        options: {
            key: process.env.S3_KEY,
            secret: process.env.S3_SECRET,
            bucket: process.env.S3_BUCKET
        }
    };
    attachmentsConfig.directory = 'badge-images';
} else {
    console.log("Using local filesystem for Badge images: " + configuration.get('local_storage'));
    attachmentsConfig.storage = {
        providerName: 'localfs',
        options: {
            directory: configuration.get('local_storage')
        }
    };
    attachmentsConfig.directory = configuration.get('upload_dir');
}

BadgeSchema.plugin(attachments, attachmentsConfig);

BadgeSchema.virtual('slugUrl').get(function() {
    return "http://" + process.env.HOST + "/badges/issue/" + this.slug;
});

BadgeSchema.virtual('grayImageUrl').get(function() {
    var dir;
    if (configuration.usingS3()) {
        return this.image.fullGray.defaultUrl;
    } else {
        dir = path.resolve('./') + '/public';
        return this.image.fullGray.defaultUrl.replace(dir, '');
    }
});

BadgeSchema.virtual('imageUrl').get(function() {
    var dir;
    if (configuration.usingS3()) {
        return this.image.full.defaultUrl;
    } else {
        dir = path.resolve('./') + '/public';
        return this.image.full.defaultUrl.replace(dir, '');
    }
});

BadgeSchema.virtual('miniImageUrl').get(function() {
    var dir;
    if (configuration.usingS3()) {
        return this.image.mini.defaultUrl;
    } else {
        dir = path.resolve('./') + '/public';
        return this.image.mini.defaultUrl.replace(dir, '');
    }
});

BadgeSchema.virtual('miniGrayImageUrl').get(function() {
    var dir;
    if (configuration.usingS3()) {
        return this.image.miniGray.defaultUrl;
    } else {
        dir = path.resolve('./') + '/public';
        return this.image.miniGray.defaultUrl.replace(dir, '');
    }
});

BadgeSchema.virtual('criteriaUrl').get(function() {
    return "http://" + (configuration.get('hostname')) + "/badges/" + this.slug + "/criteria";
});

BadgeSchema.pre('save', function(next) {
    if (this.tags.length === 1 && this.tags[0].match(/,/)) {
        this.tags = this.tags[0].toLowerCase().split(',');
    }
    return next();
});

findAvailableSlug = function(slug, object, callback) {
    return Badge.findOne({
        slug: slug
    }, function(err, badge) {
        if (badge != null) {
            slug = slug + "_";
            object.slug = slug;
            return findAvailableSlug(slug, object, callback);
        } else {
            return callback();
        }
    });
};

BadgeSchema.pre('save', function(next) {
    if ((this.isNew && (this.name != null)) || ((this.slug == null) && (this.name != null))) {
        this.slug = _.slugify(this.name);
        return findAvailableSlug(this.slug, this, next);
    } else {
        return next();
    }
});

BadgeSchema.methods.issuer = function(callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    this.model('Organization').findById(this.issuer_id, promise.resolve.bind(promise));
    return promise;
};

BadgeSchema.methods.assertion = function(callback) {
    var assertion, promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    assertion = {};
    assertion.name = this.name;
    assertion.image = this.imageUrl;
    assertion.unearnedImage = this.unearnedImageUrl;
    if (this.description != null) {
        assertion.description = this.description;
    }
    if (this.criteria != null) {
        assertion.criteria = this.criteria;
    }
    if (this.version != null) {
        assertion.version = this.version;
    }
    this.issuer(function(err, issuer) {
        assertion.issuer = issuer.assertion();
        return promise.resolve(err, assertion);
    });
    return promise;
};

BadgeSchema.methods.issuedCount = function(callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    User.count({
        'badges.slug': this.slug
    }, (function(_this) {
        return function(err, count) {
            return promise.resolve(err, count);
        };
    })(this));
    return promise;
};

Badge = db.model("Badge", BadgeSchema);

module.exports = Badge;
