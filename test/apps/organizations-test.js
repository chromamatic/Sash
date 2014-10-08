var Organization, SessionHelper, User, app, assert, request;

request = require('request');
assert = require('assert');
app = require('../../server.js');
Organization = require('../../models/organization');
User = require('../../models/user');
SessionHelper = require('../session-helper');

describe("organization", function() {
    var org;
    org = null;
    before(function(done) {
        return SessionHelper.setupOrg(function(organization) {
            org = organization;
            return done();
        });
    });
    return describe("GET /dasboard", function() {
        var body;
        body = null;
        before(function(done) {
            var u1, u2;
            u1 = new User({
                username: 'bob',
                organization: org.id
            });
            u2 = new User({
                username: 'alice',
                organization: org.id
            });
            return u1.save(function(err, u) {
                return u2.save(function(e, u) {
                    var options;
                    options = {
                        uri: "http://localhost:" + app.settings.port + "/dashboard"
                    };
                    return request(options, function(err, response, _body) {
                        body = _body;
                        return done();
                    });
                });
            });
        });
        return it('has the users count', function() {
            return assert.match(body, 'You have 2 Users');
        });
    });
});
