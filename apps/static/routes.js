var fs, routes, _;

fs = require('fs');
_ = require('underscore');

routes = function(app) {
    return app.get('/display_badges.js', function(req, res, next) {
        var host;
        host = "http://" + process.env.HOST;
        return fs.readFile('./views/display_badges.js', function(err, data) {
            var js;
            if (err != null) {
                next(err);
            }
            js = data.toString().replace(/{{HOST}}/g, host);
            return res.send(js, {
                "content-type": "application/javascript"
            });
        });
    });
};

module.exports = routes;
