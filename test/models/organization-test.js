var Badge, Organization, User, assert, crypto, hexDigest;

assert = require('assert');
Organization = require('../../models/organization');
Badge = require('../../models/badge');
User = require('../../models/user');
crypto = require('crypto');

hexDigest = function(string) {
    var sha;
    sha = crypto.createHash('sha256');
    sha.update('awesome');
    return sha.digest('hex');
};

describe("Organization", function() {
    var badge, badge2, org, user;
    user = null;
    org = null;
    badge = null;
    badge2 = null;
    before(function(done) {
        org = new Organization({
            name: 'Chipotle',
            origin: "www.chipotle.com",
            org: "Chipotle, Inc"
        });
        badge = new Badge({
            name: 'awesome badge mcawesome',
            issuer_id: org.id
        });
        badge2 = new Badge({
            name: 'awesome badge mcawesome',
            issuer_id: org.id
        });
        user = new User({
            username: 'bob',
            organization: org.id
        });
        return org.save(function() {
            return badge.save(function() {
                return badge2.save(function() {
                    return user.save(function() {
                        return done();
                    });
                });
            });
        });
    });
    it("should return the badges attached to that org", function(done) {
        return org.badges(function(err, badges) {
            assert.equal(badges[0].id, badge.id);
            assert.equal(badges[1].id, badge2.id);
            return done();
        });
    });
    it("should count the number of badges", function(done) {
        return org.badges(function(err, badges) {
            assert.equal(badges.length, 2);
            return done();
        });
    });
    it("should return all the users attached to that org", function(done) {
        return org.users(function(err, users) {
            assert.equal(users[0].id, user.id);
            return done();
        });
    });
    it("should count the number of user", function(done) {
        return org.users(function(err, users) {
            var u;
            assert.equal(users.length, 1);
            u = new User({
                name: "alice",
                organization: org.id
            });
            return u.save(function() {
                return org.users(function(err, users) {
                    assert.equal(users.length, 2);
                    return done();
                });
            });
        });
    });
    return it("should set the hashed password from the password", function(done) {
        var hash;
        org.setValue('password', 'awesome');
        hash = hexDigest('awesome');
        return org.save(function(err, o) {
            assert.equal(hash, org.hashed_password);
            return done();
        });
    });
});
