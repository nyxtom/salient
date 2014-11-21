
var events = require('events'),
    Stream = require('stream');

function StreamLDA(k, parseText) {
    Stream.call(this);

    var self = this;
    this.readable = true;
    this.writable = true;
    this._k = k || 10;
    this._alpha = 1.0 / this.k;
    this._eta = 1.0 / this.k;
    this._tau0 = 1.0;
    this._kappa = 0.7;
    this._batchSize = 50;
    this._batchesSeen = 0;
    this._docsSeen = 0;
    this._q = async.queue(function (a, cb) { self._process(q, cb); }, this.options.concurrency || 1);
    this._q.drain = function () { self.end(); };
    this._q.resume();
    this._parseText = parseText;
}

util.inherits(StreamLDA, Stream);

StreamLDA.prototype._process = function (queueItem, callback) {
    if (this.parseText) {
    }
};

StreamLDA.prototype.write = function (data) {
    this._q.push(data);
};

StreamLDA.prototype.end = function () {
    this.emit('end');
};

module.exports = StreamLDA;
