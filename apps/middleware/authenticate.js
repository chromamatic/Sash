var Organization;

Organization = require("../../models/organization");

module.exports = function(req, res, next) {
    var api_key, unauthorzed;
    unauthorzed = function() {
        if (req.xhr) {
            return res.send(403);
        } else {
            return res.redirect('/login');
        }
    };
    api_key = req.query.api_key;
    if (!api_key) {
        api_key = req.body.api_key;
    }
    if (api_key != null) {
        return Organization.findOne({
            api_key: api_key
        }, function(err, org) {
            if (org != null) {
                req.org = org;
                return next();
            } else {
                return unauthorzed();
            }
        });
    } else if (req.session.org_id) {
        return Organization.findById(req.session.org_id, function(err, org) {
            if (org) {
                req.org = org;
                req.session.org_id = org.id;
                return next();
            } else {
                return unauthorzed();
            }
        });
    } else {
        return unauthorzed();
    }
};
