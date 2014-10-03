var Organization, checkOrgs, configuration, hexDigest, routes;

Organization = require('../../models/organization');
configuration = require('../../lib/configuration');
hexDigest = require('../../lib/hex_digest');

checkOrgs = function(req, res, next) {
    return Organization.find({}, function(err, orgs) {
        if (orgs.length > 0) {
            return next();
        } else {
            req.flash('info', 'Looks like you need to setup an organization. Lets do that now!');
            return res.redirect('/organizations/new');
        }
    });
};

routes = function(app) {
    app.get('/login', checkOrgs, function(req, res) {
        return res.render("" + __dirname + "/views/login", {
            title: 'Login',
            stylesheet: 'login'
        });
    });
    app.post('/sessions', function(req, res, next) {
        var errMsg;
        errMsg = "Org Name or Password is invalid. Try again";
        if (req.body.name && req.body.password) {
            return Organization.findOne({
                name: req.body.name
            }, function(err, org) {
                if ((org != null ? org.hashed_password : void 0) === hexDigest(req.body.password)) {
                    req.session.org_id = org.id;
                    req.flash('info', "You are logged in as " + org.name);
                    return res.redirect('/dashboard');
                } else {
                    req.flash('error', errMsg);
                    return res.redirect('/login');
                }
            });
        } else {
            req.flash('error', errMsg);
            return res.redirect('/login');
        }
    });
    app.get('/logout', function(req, res) {
        return req.session.regenerate(function(err) {
            req.flash('info', 'You have been logged out.');
            return res.redirect('/login');
        });
    });
    return app.del('/sessions', function(req, res) {
        return req.session.regenerate(function(err) {
            req.flash('info', 'You have been logged out.');
            return res.redirect('/login');
        });
    });
};

module.exports = routes;
