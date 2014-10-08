var Badge, BadgesToUsers, Organization, Promise, User, arrayUtils, async, authenticate, formatBadgeAssertionResponse, formatBadgeResponse, fs, getBadgeIssuedCounts, getIssuedCount, routes, util, _;

Badge = require('../../models/badge');
User = require('../../models/user');
Organization = require('../../models/organization');
BadgesToUsers = require('../../models/badges_to_users');
authenticate = require('../middleware/authenticate');
arrayUtils = require('../../lib/array');
Promise = require('mongoose').Promise;
util = require('util');
_ = require('underscore');
fs = require('fs');
async = require('async');

getIssuedCount = function(badge, callback) {
    return badge.issuedCount(function(err, count) {
        badge.issued_count = count;
        return callback(null, badge);
    });
};

getBadgeIssuedCounts = function(badges, callback) {
    return async.map(badges, getIssuedCount, callback);
};

routes = function(app) {
    app.get('/badges/:slug.:format', function(req, res) {
        return Badge.findOne({
            slug: req.params.slug
        }, function(err, badge) {
            return formatBadgeResponse(req, res, badge);
        });
    });
    app.get('/badges.:format?', authenticate, function(req, res, next) {
        var orgId, query, tags;
        if (!req.org) {
            next();
        }
        orgId = req.org.id;
        query = Badge.where('issuer_id', orgId);
        if (req.query.tags != null) {
            tags = _.flatten(Array(req.query.tags));
            if (req.query.match_any_tags != null) {
                query["in"]('tags', tags);
            } else {
                query.where('tags', {
                    '$all': tags
                });
            }
        }
        return query.exec(function(err, badges) {
            return getBadgeIssuedCounts(badges, function(err, badges) {
                if (req.xhr || req.params.format === 'json') {
                    return formatBadgeResponse(req, res, badges);
                } else {
                    return res.render("" + __dirname + "/views/index", {
                        badges: badges,
                        orgId: orgId,
                        org: req.org
                    });
                }
            });
        });
    });
    return app.namespace('/badges', authenticate, function() {
        app.get('/new', function(req, res) {
            var orgId;
            if (req.org) {
                orgId = req.org.id;
            }
            return res.render("" + __dirname + "/views/new", {
                badge: new Badge,
                orgId: orgId
            });
        });
        app.post('/', function(req, res, next) {
            var badge;
            badge = new Badge(req.body.badge);
            return badge.attach('image', req.files.badge.image, function(err) {
                if (err) {
                    next(err);
                }
                return badge.save(function(err, doc) {
                    var btu;
                    if (err) {
                        next(err);
                    }
                    btu = new BadgesToUsers;
                    btu.badgeId = doc._id;
                    btu.users = [];
                    return btu.save(function(err, btu_doc) {
                        if (err) {
                            next(err);
                        }
                        req.flash('info', 'Badge saved successfully!');
                        return res.redirect('/badges');
                    });
                });
            });
        });
        app.get('/:slug/assertion.:format?', function(req, res) {
            return Badge.findOne({
                slug: req.params.slug
            }, function(err, badge) {
                if (req.params.format === 'json') {
                    return formatBadgeAssertionResponse(req, res, badge);
                } else {
                    return res.render("" + __dirname + "/views/show", {
                        badge: badge,
                        issuer: badge.issuer()
                    });
                }
            });
        });
        app.get('/:slug', function(req, res) {
            return Badge.findOne({
                slug: req.params.slug
            }, function(err, badge) {
                if (badge == null) {
                    res.redirect('/404');
                }
                return res.render("" + __dirname + "/views/show", {
                    badge: badge,
                    issuer: badge.issuer()
                });
            });
        });
        app.get('/:slug/edit', function(req, res) {
            return Badge.findOne({
                slug: req.params.slug
            }, function(err, badge) {
                return res.render("" + __dirname + "/views/edit", {
                    badge: badge,
                    issuer: badge.issuer(),
                    orgId: req.org.id
                });
            });
        });
        app.put('/:slug', function(req, res, next) {
            if (req.files.badge.image.size > 0) {
                return Badge.findOne({
                    slug: req.params.slug
                }, function(err, badge) {
                    return badge.attach('image', req.files.badge.image, function(err) {
                        if (err) {
                            next(err);
                        }
                        badge.set(req.body.badge);
                        return badge.save(function(err, doc) {
                            if (err) {
                                next(err);
                            }
                            req.flash('info', 'Badge saved successfully!');
                            return res.redirect('/badges');
                        });
                    });
                });
            } else {
                return Badge.findOne({
                    slug: req.params.slug
                }, function(err, badge) {
                    badge.set(req.body.badge);
                    return badge.save(function(err, doc) {
                        if (err) {
                            next(err);
                        }
                        req.flash('info', 'Badge saved successfully!');
                        return res.redirect('/badges');
                    });
                });
            }
        });
        app.del('/:slug', function(req, res, next) {
            return Badge.findOne({
                slug: req.params.slug
            }, function(err, badge) {
                return badge.remove(function(err) {
                    if (req.xhr) {
                        return res.send(JSON.stringify({
                            success: true
                        }), {
                            "Content-Type": "application/json"
                        });
                    } else {
                        req.flash('info', 'Badge Destroyed!');
                        return res.redirect('/badges');
                    }
                });
            });
        });
        app.post('/revoke/:badgeId', function(req, res, next) {
            var username;
            username = req.body.username;
            console.log("revoking badge " + req.params.badgeId + " from " + username);
            return User.findOne({
                username: username
            }, function(err, user) {
                var badgeIndex, bid, i, userBadges, _i, _ref;
                if ((err != null) || (user == null)) {
                    res.send(JSON.stringify({
                        revoked: false,
                        message: "error revoking badge"
                    }), {
                        'content-type': 'application/json'
                    });
                } else {
                    badgeIndex = null;
                    userBadges = user.badges;
                    for (i = _i = 0, _ref = userBadges.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                        if (userBadges[i]._id.toString() === req.params.badgeId.toString()) {
                            badgeIndex = i;
                            break;
                        }
                    }
                    if (badgeIndex != null) {
                        bid = userBadges[badgeIndex]._id.toString();
                        console.log("bid=" + bid);
                        user.badges.splice(badgeIndex, 1);
                        return user.save(function(err) {
                            if (err != null) {
                                return res.send(JSON.stringify({
                                    revoked: false,
                                    message: err
                                }), {
                                    'content-type': 'application/json'
                                });
                            } else {
                                return BadgesToUsers.findOne({
                                    badgeId: bid
                                }, function(err, btu) {
                                    var uindex, _j, _ref1;
                                    if (err != null) {
                                        return res.send(JSON.stringify({
                                            error: err
                                        }));
                                    } else {
                                        uindex = null;
                                        for (i = _j = 0, _ref1 = btu.users; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
                                            if (btu.users[i].toString() === user._id.toString()) {
                                                uindex = i;
                                                break;
                                            }
                                        }
                                        btu.users.splice(uindex, 1);
                                        return btu.save(function(err) {
                                            if (err) {
                                                next(err);
                                            }
                                            return res.send(JSON.stringify({
                                                revoked: true
                                            }), {
                                                'content-type': 'application/json'
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        return res.send(JSON.stringify({
                            revoked: false,
                            message: 'User has not earned this badge'
                        }), {
                            'content-type': 'application/json'
                        });
                    }
                }
            });
        });
        return app.post('/issue/:slug', function(req, res, next) {
            var email, username;
            username = req.body.username;
            email = req.body.email;
            if (email === '') {
                email = void 0;
            }
            console.log("Trying to issue badge: " + req.params.slug);
            console.log("params: {username: " + username + ", email: " + email + ", slug: " + req.params.slug);
            return Badge.findOne({
                slug: req.params.slug
            }, function(err, badge) {
                if (err != null) {
                    console.log("Error Finding Badge: " + (JSON.stringify(err)));
                    res.send(JSON.stringify({
                        issued: false
                    }), {
                        'content-type': 'application/json'
                    });
                    return;
                }
                if (username == null) {
                    username = email;
                }
                if (!((badge != null) & ((username != null) || (email != null)))) {
                    console.error("Can't issue badge " + req.params.slug + ", doesn't exist");
                    res.send(JSON.stringify({
                        issued: false
                    }), {
                        'content-type': 'application/json'
                    });
                    return;
                }
                return User.findOrCreate(username, email, {
                    issuer_id: badge.issuer_id,
                    tags: req.query.tags
                }, function(err, user) {
                    if (err != null) {
                        console.error("Can't issue badge " + req.params.slug + ", " + (JSON.stringify(err)));
                        res.send(JSON.stringify({
                            message: "error issuing badge",
                            error: err
                        }), {
                            'content-type': 'application/json'
                        });
                        return;
                    }
                    console.log("user: " + user.username + "/" + user.email + ", id: " + user.id);
                    return user.earn(badge, function(err, response) {
                        var count;
                        if (err != null) {
                            response = {
                                message: "Failed to issue Badge",
                                error: err
                            };
                            return console.error("Badge Issue Response: " + (JSON.stringify(response)));
                        } else {
                            count = parseInt(badge.issued_count);
                            count += 1;
                            badge.issued_count = count.toString();
                            return badge.save(function(err) {
                                if (err) {
                                    next(err);
                                }
                                return BadgesToUsers.findOne({
                                    badgeId: badge._id
                                }, function(err, btu) {
                                    var location, onComplete;
                                    if (err != null) {
                                        console.error(err);
                                    }
                                    onComplete = function() {
                                        console.log("Badge Issue Response: " + (JSON.stringify(response)));
                                        res.send(JSON.stringify(response), {
                                            'content-type': 'application/json'
                                        });
                                    };
                                    if (btu != null) {
                                        location = arrayUtils.containsString(btu.users, user._id);
                                        if (location === -1) {
                                            btu.users.push(user._id);
                                            return btu.save(function(err) {
                                                if (err != null) {
                                                    console.error(err);
                                                }
                                                return onComplete();
                                            });
                                        } else {
                                            return onComplete();
                                        }
                                    } else {
                                        return onComplete();
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    });
};

formatBadgeAssertionResponse = function(req, res, badge) {
    var assertionPromise, cb;
    cb = req.query.callback;
    assertionPromise = badge.toJSON();
    if (cb) {
        return assertionPromise.on('complete', function(assertion) {
            return res.send("" + cb + "(" + (JSON.stringify(assertion)) + ")");
        });
    } else {
        return res.send(assertionPromise, {
            'content-type': 'application/json'
        });
    }
};

formatBadgeResponse = function(req, res, badge) {
    var cb;
    cb = req.query.callback;
    if (cb) {
        return res.send("" + cb + "(" + (JSON.stringify(badge)) + ")");
    } else {
        return res.send(JSON.stringify(badge), {
            'content-type': 'application/json'
        });
    }
};

module.exports = routes;
