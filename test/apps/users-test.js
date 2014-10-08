var SessionTestHelper, User, app, assert, request;

request = require('request');
assert = require('assert');
app = require('../../server.js');
User = require('../../models/user');

SessionTestHelper = {
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

describe("users", function() {
    return describe("GET /users", function() {
        var body;
        body = null;
        return before(function(done) {
            var options;
            options = {
                uri: "http://localhost:" + app.settings.port + "/users"
            };
            return request(options, function(err, response, _body) {
                body = _body;
                return done();
            });
        });
    });
});
