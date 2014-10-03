var Organization, SessionHelper, app, request;

app = require('../server.js');
request = require('request');
Organization = require("../models/organization");

SessionHelper = {
    setupOrg: function(done) {
        return Organization.where({
            name: 'everfi'
        }).remove(function(e, os) {
            var org;
            org = new Organization({
                name: 'everfi'
            });
            org.setValue('password', 'awesome');
            return org.save(function(err, o) {
                return SessionHelper.login(function() {
                    return done(org);
                });
            });
        });
    },
    login: function(done) {
        var options;
        options = {
            uri: "http://localhost:" + app.settings.port + "/sessions",
            form: {
                name: 'everfi',
                password: 'awesome'
            },
            followAllRedirects: true
        };
        return request.post(options, function(err, _response, _body) {
            return done();
        });
    }
};

module.exports = SessionHelper;
