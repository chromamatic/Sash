var Badge, assert;

assert = require('assert');
Badge = require('../../models/badge');

describe('Badge', function() {
    return describe('create', function() {
        var badge;
        badge = null;
        before(function() {
            badge = new Badge({
                name: 'Financial Literacy'
            });
            return badge.save();
        });
        it('sets name', function() {
            return assert.equal(badge.name, 'Financial Literacy');
        });
        it('sets the created_at date', function(done) {
            return Badge.findById(badge.id, function(err, doc) {
                var d;
                d = new Date;
                assert.equal(doc.created_at.getMonth(), d.getMonth());
                assert.equal(doc.created_at.getFullYear(), d.getFullYear());
                assert.equal(doc.created_at.getHours(), d.getHours());
                return done();
            });
        });
        return it('sets the updated_at date', function(done) {
            return Badge.findById(badge.id, function(err, doc) {
                var d;
                d = new Date;
                assert.equal(doc.updated_at.getMonth(), d.getMonth());
                assert.equal(doc.updated_at.getFullYear(), d.getFullYear());
                assert.equal(doc.updated_at.getHours(), d.getHours());
                return done();
            });
        });
    });
});
