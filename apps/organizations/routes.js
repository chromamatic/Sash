var Organization, Promise, User, async, authenticate, configuration, fetchUsers, fs, getBadgeIssuedCounts, getIssuedCount, jade, path, routes, userJade, userTemplateFile, util;

Organization = require('../../models/organization');
User = require('../../models/user');
configuration = require('../../lib/configuration');
util = require('util');
fs = require('fs');
async = require('async');
jade = require('jade');
path = require('path');
Promise = require('mongoose').Promise;
authenticate = require('../middleware/authenticate');
userJade = '';
userTemplateFile = path.resolve(__dirname + '/views/templates/user.jade');

fs.readFile(userTemplateFile, function(err, data) {
    return userJade = data.toString();
});

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
    app.get('/404', function(req, res) {
        return res.render("" + __dirname + "/../../views/shared/404");
    });
    app.get('/organizations/new', function(req, res) {
        return res.render("" + __dirname + "/views/new", {
            title: "Sign Up",
            org: new Organization
        });
    });
    app.post('/organizations', function(req, res, next) {
        var org;
        org = new Organization(req.body.org);
        return org.save(function(err, doc) {
            if (err) {
                next(err);
            }
            req.session.org = org;
            req.flash('info', 'Organization saved and signed in successfully!');
            return res.redirect('/dashboard');
        });
    });
    app.get('/', function(req, res, next) {
        if (req.session.org_id) {
            return res.redirect('/dashboard');
        } else {
            return res.redirect('/login');
        }
    });
    app.get('/dashboard', authenticate, function(req, res, next) {
        return req.org.badges(10, function(err, badges) {
            return getBadgeIssuedCounts(badges, function(err, badges) {
                return res.render("" + __dirname + "/views/dashboard", {
                    org: req.org,
                    badges: badges,
                    badgeCount: req.org.badgeCount()
                });
            });
        });
    });
    app.get('/users/render', function(req, res, next) {
        var org, users, _render;
        users = req.query.users;
        org = req.query.org;
        _render = function() {
            var html;
            html = '';
            users.forEach(function(u) {
                var fn;
                u.image = u.image || null;
                fn = jade.compile(userJade, {});
                return html += fn(u);
            });
            return res.send(html, {
                'content-type': 'text/html'
            });
        };
        if (!users) {
            return fetchUsers(org, function(err, result) {
                if (err) {
                    next(err);
                }
                users = result;
                return _render();
            });
        } else {
            return _render();
        }
    });
    app.get('/users', authenticate, function(req, res, next) {
        return res.render("" + __dirname + "/views/users", {
            org: req.org,
            newUserUrl: 'http://' + configuration.get('hostname') + '/users/new'
        });
    });
    return app.namespace('/organizations', authenticate, function() {
        app.get('/', function(req, res) {
            return res.render("" + __dirname + "/views/index");
        });
        app.get('/:id', function(req, res) {
            return res.render("" + __dirname + "/views/show", {
                org: req.org
            });
        });
        app.get('/:id/edit', function(req, res) {});
        app.put('/:id', function(req, res, next) {});
        return app.del('/:id', function(req, res, next) {});
    });
};

module.exports = routes;

fetchUsers = function(org, callback) {
    var promise;
    promise = new Promise;
    if (callback) {
        promise.addBack(callback);
    }
    User.find({
        organization: org
    }, promise.resolve.bind(promise));
    return promise;
};
