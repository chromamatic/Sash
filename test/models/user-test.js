var Badge, Organization, User, assert;

assert = require('assert');
User = require('../../models/user');
Badge = require('../../models/badge');
Organization = require('../../models/organization');

describe('Badge', function() {
    var org;
    org = null;
    before(function(done) {
        org = new Organization({
            name: 'Awesome Org'
        });
        return org.save(function() {
            return done();
        });
    });
    describe('create', function() {
        var user;
        user = null;
        before(function(done) {
            user = new User({
                username: 'Bob',
                organization: org.id
            });
            user.save();
            return done();
        });
        return it('downcases username on save', function() {
            return assert.equal(user.username, 'bob');
        });
    });
    describe('when finding or creating by username', function() {
        var user;
        user = null;
        before(function(done) {
            return User.where('username')["in"](['bob', 'alice']).remove(function() {
                user = new User({
                    username: 'bob',
                    organization: org.id
                });
                return user.save(function() {
                    return done();
                });
            });
        });
        it('it returns an existing user if exists', function(done) {
            return User.findOrCreate('bob', org.id, function(err, bob) {
                assert.equal(bob.id, user.id);
                assert.equal(bob.organization, org.id);
                return done();
            });
        });
        it('it returns a new user if none exists', function(done) {
            return User.findOrCreate('alice', org.id, function(err, alice) {
                assert(alice);
                assert.equal(alice.organization, org.id);
                return done();
            });
        });
        return after(function(done) {
            return User.where('username')["in"](['bob', 'alice']).remove(function() {
                return done();
            });
        });
    });
    return describe('earning badges', function() {
        var badge, user;
        user = null;
        badge = null;
        beforeEach(function(done) {
            return User.where('username')["in"](['bob', 'alice']).remove(function() {
                badge = new Badge({
                    name: 'super badge',
                    issuer_id: org.id
                });
                return badge.save(function() {
                    user = new User({
                        username: 'bob',
                        organization: org.id
                    });
                    return user.save(function() {
                        return done();
                    });
                });
            });
        });
        it("adds the badge to the user's earned badges", function(done) {
            return user.earn(badge, function(err, response) {
                assert.equal(user.badges.length, 1);
                assert.equal(response.earned, true);
                return done();
            });
        });
        it("it returns the badge on the response obj when success", function(done) {
            return user.earn(badge, function(err, response) {
                assert.equal(response.badge.id, badge.id);
                return done();
            });
        });
        it("doesn't add the badge if the user already has it", function(done) {
            assert.equal(user.badges.length, 0);
            return user.earn(badge, function(err, response) {
                assert.equal(user.badges.length, 1);
                return user.earn(badge, function(err, response) {
                    assert.equal(user.badges.length, 1);
                    return done();
                });
            });
        });
        it("it sets the badge's issued_on date", function(done) {
            return user.earn(badge, function(err, response) {
                assert.equal(user.badges[0].issued_on.getDay(), (new Date).getDay());
                return done();
            });
        });
        it("returns a message when the user already has the badge", function(done) {
            return user.earn(badge, function(err, r) {
                return user.earn(badge, function(err, response) {
                    assert.equal(response.earned, false);
                    assert.equal(response.message, "User already has this badge");
                    return done();
                });
            });
        });
        return afterEach(function(done) {
            badge.remove();
            return User.where('username')["in"](['bob', 'alice']).remove(function() {
                return done();
            });
        });
    });
});
