var app, assert, request;

request = require('request');
assert = require('assert');
app = require('../../server.js');

describe("authentication", function() {
    return describe("GET /login", function() {
        var body;
        body = null;
        before(function(done) {
            var options;
            options = {
                uri: "http://localhost:" + app.settings.port + "/login"
            };
            return request(options, function(err, response, _body) {
                body = _body;
                return done();
            });
        });
        return it("has title", function() {
            return assert.hasTag(body, '//head/title', 'Login');
        });
    });
});
