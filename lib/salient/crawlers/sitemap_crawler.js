
var events = require('events'),
    request	= require('request'),
    async = require('async'),
    util = require('util'),
    progress = require('request-progress'),
    Stream = require('stream');

var XmlStream = require('./../wiktionary/xml-stream'),
    StringReader = require('./string_reader');

function SitemapCrawler(options) {
    Stream.call(this);
    var self = this;

    this.options = options || {};
    this._sitemapQueue = async.queue(function (q, cb) { self._process(q, cb); }, this.options.concurrency || 1);
    this._sitemapQueue.drain = function () { self.emit('end'); };
    this.readable = true;
    this.processed = 0;
};

util.inherits(SitemapCrawler, Stream);

SitemapCrawler.prototype._process = function (queueItem, callback) {
    var self = this;
    self.emit('download-begin', queueItem);
    progress(request.get(queueItem.loc, function (err, response, body) {
        self.emit('download-end', queueItem);
        if (err) {
            return callback(err);
        } else {
            var reader = new StringReader(body);
            var xml = new XmlStream(reader);
            queueItem.count = 0;

            xml.on('updateElement: sitemap', function (item) {
                self._sitemapQueue.push(item);
                queueItem.count++;
                self.emit('queue-sitemap', item);
            });
            xml.on('updateElement: url', function (item) {
                var urlItem = { loc: item.loc,
                                lastmod: item.lastmod,
                                changefreq: item.changefreq,
                                priority: item.priority };
                queueItem.count++;
                self.emit('data', urlItem);
                item = null;
            });
            xml.on('end', function () {
                self.processed += queueItem.count;
                self.emit('parse-end', queueItem);
                return callback();
            });
            reader.open();
        }
    }), { throttle: 100, delay: 1000 })
    .on('progress', function (state) {
        self.emit("download-progress", queueItem, state);
    });
};

SitemapCrawler.prototype.crawl = function (sitemaps) {
    this._sitemapQueue.pause();

    this.processed = 0;
    for (var i = 0; i < sitemaps.length; i++) {
        this._sitemapQueue.push({loc: sitemaps[i]});
    }

    // Resume processing
    this._sitemapQueue.resume();
};

module.exports = SitemapCrawler;
