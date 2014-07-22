var util = require('util');
var Stream = require('stream');
var Buffer = require('buffer').Buffer;

/**
 * A Readable stream for a string or Buffer.
 *
 * This works for both strings and Buffers.
 */
function StringReader(str) {
    this.data = str;
}
util.inherits(StringReader, Stream);
module.exports = StringReader;

StringReader.prototype.open =
StringReader.prototype.resume = function () {
    if (this.encoding && Buffer.isBuffer(this.data)) {
      this.emit('data', this.data.toString(this.encoding));
    }
    else {
        this.emit('data', this.data);
    }
    this.emit('end');
    this.emit('close');
}

StringReader.prototype.setEncoding = function (encoding) {
    this.encoding = encoding;
}


StringReader.prototype.pause = function () {
}

StringReader.prototype.destroy = function () {
  delete this.data;
}
