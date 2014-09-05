
exports.extend = function (defaults, options) {
    var runner = {};
    for (var attr in defaults) { runner[attr] = defaults[attr]; }
    for (var attr in options) { runner[attr] = options[attr]; }
    return runner;
};
