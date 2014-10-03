var Badge, SessionHelper, app, assert, request;

request = require('request');
assert = require('assert');
app = require('../../server.js');
Badge = require('../../models/badge');
SessionHelper = require('../session-helper');

describe("badges", function() {
    before(function(done) {
        return SessionHelper.setupOrg(function(organization) {
            var org;
            org = organization;
            return done();
        });
    });
    describe("GET /badges", function() {
        var body;
        body = null;
        before(function(done) {
            var options;
            options = {
                uri: "http://localhost:" + app.settings.port + "/badges"
            };
            return request(options, function(err, response, _body) {
                body = _body;
                return done();
            });
        });
        it("has a h1 with a nice title", function() {
            return assert.hasTag(body, "//body/h1", "Badges!");
        });
        it("has a form to create new badges", function() {
            assert.hasTag(body, '//body/form/@action', "/badges/");
            return assert.hasTag(body, '//body/form/@method', "post");
        });
        return it("the form is multi-part (for doing uploads, silly)", function() {
            return assert.hasTag(body, '//body/form/@enctype', "multipart/form-data");
        });
    });
    describe("GET /badge/:id", function() {
        var body;
        body = null;
        before(function(done) {
            var badge, options;
            badge = new Badge({
                name: "Awesome Badge",
                image: 'mario_badge.png',
                description: 'Interesting Description'
            });
            badge.save(function() {});
            options = {
                uri: "http://localhost:" + app.settings.port + "/badges/" + badge.id
            };
            return request(options, function(err, response, _body) {
                body = _body;
                return done();
            });
        });
        it("displays the name of the badge", function() {
            return assert.hasTag(body, '//body/div[@class="badge"]/h1', 'Awesome Badge');
        });
        it('displays the description', function() {
            return assert.hasTag(body, '//body/div[@class="badge"]/p', 'Interesting Description');
        });
        return it('displays the uploaded image', function() {
            return assert.hasTag(body, '//body/div[@class="badge"]/img/@src', 'http://localhost:3001/uploads/mario_badge.png');
        });
    });
    describe("POST /badges", function() {
        var body;
        body = null;
        before(function(done) {
            var options;
            options = {
                uri: "http://localhost:" + app.settings.port + "/badges",
                method: 'post'
            };
            return request(options, function(err, response, _body) {
                body = _body;
                return done();
            });
        });
        return it("creates new badges with name and description", function() {});
    });
    return describe("GET /badges/issue/", function() {
        it("initializes a user if they don't exist");
        it("stores and earned badge on the user");
        return it("returns the badge info");
    });
});
