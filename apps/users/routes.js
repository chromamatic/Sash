var Organization, Promise, User, allOrgs, authenticate, configuration, formatResponse, fs, routes, userOrg, usersForOrg, util, _;

User = require('../../models/user');
util = require('util');
fs = require('fs');
Promise = require('mongoose').Promise;
Organization = require('../../models/organization');
User = require('../../models/user');
authenticate = require('../middleware/authenticate');
configuration = require('../../lib/configuration');
_ = require('underscore');

routes = function(app) {
    app.namespace('/users', function() {
        app.get('/:organizationId/all', function(req, res, next) {
            var orgId;
            orgId = req.params.organizationId;
            return usersForOrg(orgId, function(err, users) {
                var u;
                u = users.map(function(user) {
                    return {
                        username: user.username,
                        _id: user._id
                    };
                });
                return res.send(u, {
                    'content-type': 'application/json'
                });
            });
        });
        app.get('/username/:username', function(req, res, next) {
            var username;
            username = req.params.username;
            if (username == null) {
                res.status(404).send('Not Found');
                return;
            }
            return User.find({
                username: username
            }, function(err, user) {
                if (err != null) {
                    next(err);
                    return;
                }
                if (user != null) {
                    return formatResponse(req, res, user);
                }
            });
        });
        app.get('/badges.:format?', function(req, res, next) {
            var email, username;
            username = req.query.username;
            email = req.query.email;
            if (email === '') {
                email = void 0;
            }
            if (!((username != null) || (email != null))) {
                res.status(404).send("Not Found");
                return;
            }
            return User.findByUsernameOrEmail(username, email, function(err, user) {
                var badges;
                if (err != null) {
                    next(err);
                    return;
                }
                if (user != null) {
                    badges = user.badges.map(function(badge) {
                        badge = badge.toJSON();
                        badge.assertion = "http://" + (configuration.get('hostname')) + "/users/" + user.email_hash + "/badges/" + badge.slug;
                        return badge;
                    });
                    return formatResponse(req, res, badges);
                } else {
                    return formatResponse(req, res, []);
                }
            });
        });
        app.get('/badges/has_new_badges.:format?', function(req, res, next) {
            var email, username;
            username = req.query.username;
            email = req.query.email;
            if (!((username != null) || (email != null))) {
                res.status(404).send("Not Found");
                return;
            }
            return User.findByUsernameOrEmail(username, email, function(err, user) {
                var badges;
                badges = _.select(user.badges, function(badge) {
                    return !badge.seen;
                });
                return formatResponse(req, res, {
                    has_new_badges: badges.length > 0
                });
            });
        });
        app.get('/badges/new.:format?', function(req, res, next) {
            var email, username;
            username = req.query.username;
            email = req.query.email;
            if (!((username != null) || (email != null))) {
                res.status(404).send("Not Found");
                return;
            }
            return User.findByUsernameOrEmail(username, email, function(err, user) {
                var badges;
                badges = _.select(user.badges, function(badge) {
                    return !badge.seen;
                });
                if (req.xhr || req.params.format === 'json') {
                    return formatResponse(req, res, badges);
                } else {
                    return res.render("" + __dirname + "/views/new_badges", {
                        badges: badges,
                        layout: false
                    });
                }
            });
        });
        app.get('/badges/:badge_id/seen', function(req, res, next) {
            var badgeId, email, username;
            badgeId = req.params.badge_id;
            username = req.query.username;
            email = req.query.email;
            if (!((username != null) || (email != null))) {
                res.status(404).send("Not Found");
                return;
            }
            return User.findByUsernameOrEmail(username, email, function(err, user) {
                var badge;
                if (user == null) {
                    res.status(404).send("Not Found");
                    return;
                }
                badge = _.detect(user.badges, function(b) {
                    return b._id.toString() === badgeId;
                });
                badge.seen = true;
                return user.save(function() {
                    return formatResponse(req, res, {
                        success: true
                    });
                });
            });
        });
        return app.get('/badges/:badge_slug/destroy', function(req, res, next) {
            var badgeSlug, email, username;
            badgeSlug = req.params.badge_slug;
            username = req.query.username;
            email = req.query.email;
            if (!((username != null) || (email != null))) {
                res.status(404).send("Not Found");
                return;
            }
            return User.findByUsernameOrEmail(username, email, function(err, user) {
                var badge;
                if (user == null) {
                    formatResponse(req, res, {
                        success: false
                    });
                    return;
                }
                badge = _.detect(user.badges, function(b) {
                    return b.slug === badgeSlug;
                });
                if ((badge != null) && (user != null)) {
                    badge.remove();
                    return user.save(function() {
                        return formatResponse(req, res, {
                            success: true
                        });
                    });
                } else {
                    return formatResponse(req, res, {
                        success: false
                    });
                }
            });
        });
    });
    app.get('/users/:email_hash/badges/:badge_slug.:format?', function(req, res, next) {
        var email_hash;
        email_hash = req.params.email_hash;
        return User.findByEmailHash(email_hash, function(err, user) {
            if (err != null) {
                next(err);
            }
            if (user != null) {
                return user.assertion(req.params.badge_slug, function(err, assertion) {
                    return formatResponse(req, res, assertion);
                });
            } else {
                return formatResponse(req, res, {});
            }
        });
    });
    return app.namespace('/users', authenticate, function() {
        app.get('/', function(req, res, next) {
            return res.render("" + __dirname + "/views/users");
        });
        app.post('/delete/:id', function(req, res, next) {
            return User.findById(req.params.id, function(err, user) {
                var username;
                if (err) {
                    next(err);
                }
                username = user.username;
                return User.remove({
                    _id: user._id
                }, function(err) {
                    if (err) {
                        next(err);
                    }
                    req.flash('info', 'User ' + username + ' deleted successfully.');
                    return res.redirect('/users/');
                });
            });
        });
        app.get('/new', function(req, res, next) {
            var id, url, user, userOrg, _render;
            id = req.query.id;
            url = 'http://' + configuration.get('hostname');
            user = new User;
            userOrg = null;
            _render = function() {
                return res.render("" + __dirname + "/views/new", {
                    orgs: allOrgs(),
                    user: user,
                    userOrg: userOrg,
                    url: url
                });
            };
            if (id) {
                url += '/users/update';
                return User.findOne({
                    _id: id
                }, function(err, data) {
                    if (err) {
                        next(err);
                    }
                    user = data;
                    return Organization.findOne({
                        _id: user.organization
                    }, function(err, org) {
                        if (err) {
                            next(err);
                        }
                        userOrg = org.name;
                        return _render();
                    });
                });
            } else {
                url += '/users/create-user';
                return _render();
            }
        });
        app.post('/create-user', function(req, res, next) {
            var user, _save;
            user = null;
            _save = function(u) {
                return user.save(function(err, doc) {
                    if (err) {
                        next(err);
                    }
                    req.flash('info', 'User created successfully!');
                    return res.redirect('/users/' + doc._id);
                });
            };
            return Organization.findOne({
                name: req.body.user.organization
            }, function(err, org) {
                var obj;
                if (err) {
                    next(err);
                }
                obj = {
                    email: req.body.user.email,
                    username: req.body.user.username,
                    organization: org._id
                };
                user = new User(obj);
                if (req.body.user.image) {
                    return user.attatch('image', req.body.user.image, function(err) {
                        if (err) {
                            next(err);
                        }
                        return _save();
                    });
                } else {
                    return _save();
                }
            });
        });
        app.post('/update', function(req, res, next) {
            return Organization.findOne({
                name: req.body.user.organization
            }, function(err, org) {
                if (err) {
                    next(err);
                }
                return User.findOne({
                    _id: req.body.user.id
                }, function(err, user) {
                    if (err) {
                        next(err);
                    }
                    user.email = req.body.user.email;
                    user.username = req.body.user.username;
                    user.organization = org._id;
                    return user.save(function(err, doc) {
                        if (err) {
                            next(err);
                        }
                        req.flash('info', 'User ' + user.username + ' updated successfully!');
                        return res.redirect('/users/' + user._id);
                    });
                });
            });
        });
        return app.get('/:id', function(req, res, next) {
            return User.findById(req.params.id, function(err, user) {
                if (err) {
                    next(err);
                }
                if (user == null) {
                    res.redirect('/404');
                    return;
                }
                return res.render("" + __dirname + "/views/show", {
                    user: user,
                    host: 'http://' + configuration.get('hostname'),
                    org: userOrg(user.organization),
                    badges: user.badges
                });
            });
        });
    });
};

formatResponse = function(req, res, data) {
    var cb;
    cb = req.query.callback;
    if (cb) {
        return res.send("" + cb + "(" + (JSON.stringify(data)) + ")", {
            'content-type': 'application/javascript'
        });
    } else {
        return res.send(JSON.stringify(data), {
            'content-type': 'application/json'
        });
    }
};

usersForOrg = function(orgId, callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    User.find({
        organization: orgId
    }, promise.resolve.bind(promise));
    return promise;
};

userOrg = function(id, callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    Organization.findOne({
        _id: id
    }, promise.resolve.bind(promise));
    return promise;
};

allOrgs = function(callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    Organization.find({}, promise.resolve.bind(promise));
    return promise;
};

module.exports = routes;
