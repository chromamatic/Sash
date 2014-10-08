var configuration, crypto;

configuration = require('../lib/configuration');

crypto = require('crypto');

module.exports = function(string, salt) {
    var sha;
    sha = crypto.createHash('sha256');
    if (salt == null) {
        salt = configuration.get('salt');
    }
    sha.update(string + salt);
    return sha.digest('hex');
};
