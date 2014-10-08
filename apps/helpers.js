var helpers, moment;

moment = require('moment');

helpers = function(app) {
    app.dynamicHelpers({
        flash: function(req, res) {
            return req.flash();
        },
        logged_in: function() {
            return true;
        }
    });
    return app.helpers({
        urlFor: function(object, path) {
            var prefix;
            if (path) {
                prefix = path + '/';
            } else if (object.collection) {
                prefix = object.collection.name + '/';
            } else {
                prefix = '';
            }
            if (!object.isNew) {
                if (object.slug != null) {
                    return "/" + prefix + object.slug;
                } else {
                    return "/" + prefix + object.id;
                }
            } else {
                return "/" + prefix;
            }
        },
        formatDate: function(dateObject) {
            return moment(this.created_at).format("MM/DD/YY");
        }
    });
};

module.exports = helpers;
