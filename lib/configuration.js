var config, fs;

fs = require('fs');
config = {};

exports.usingS3 = function() {
    return (process.env.S3_KEY != null) && (process.env.S3_SECRET != null) && (process.env.S3_BUCKET != null);
};

exports.get = function(val, env) {
    var path;
    env = env || process.env['NODE_ENV'];
    if (val === 'env') {
        return env;
    }
    if (config[env] == null) {
        path = __dirname + ("/environments/" + env + ".js");
        if (!fs.existsSync(path)) {
            if (env !== 'development') {
                return exports.get(val, "development");
            } else {
                throw new Error("unknown environment: " + env);
            }
        }
        config[env] = require(path).config;
    }
    return config[env][val];
};

if (void 0 === process.env['NODE_ENV']) {
    process.env['NODE_ENV'] = 'development';
}
