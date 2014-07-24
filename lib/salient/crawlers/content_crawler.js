
var events = require('events'),
    request	= require('request'),
    async = require('async'),
    util = require('util'),
    progress = require('request-progress'),
    Stream = require('stream'),
    fs = require('fs'),
    JSONStream = require('JSONStream');

var rateLimiter = require('./ratelimiter');

function ContentCrawler(options) {
    Stream.call(this);
    var self = this;

    this.options = options || {};
    this.readable = true;
    this.writable = true;
    this._q = async.queue(function (q, cb) { self._process(q, cb); }, this.options.concurrency || 1);
    this._q.drain = function () { self.end(); };
    rateLimiter.call(this._q);
    this._q.rateLimit(this.options.rateLimit || 1000);
    this._q.resume();
}

util.inherits(ContentCrawler, Stream);

ContentCrawler.prototype._process = function (queueItem, callback) {
    var self = this;
    self.emit('download-begin', queueItem);
    request.get(queueItem.loc, function (err, response, body) {
        self.emit('download-end', queueItem);
        if (err) {
            callback(err);
        } else {
            self.emit('data', [body, queueItem.loc]);
            callback();
        }
    });
};

ContentCrawler.prototype.write = function (data) {
    this._q.push(data);
};

ContentCrawler.prototype.crawl = function (files) {
    for (var i = 0; i < files.length; i++) {
        var fileStream = fs.createReadStream(files[i]);
        fileStream.pipe(JSONStream.parse()).pipe(this);
    }
};

ContentCrawler.prototype.end = function () {
    this.emit('end');
};

module.exports = ContentCrawler;
