/**
 * Module imports
 */
var util = require('util');
var Stream = require('stream');
var Buffer = require('buffer').Buffer;

/**
 * A readable stream for a string or Buffer.
 *
 * This works for both strings and Buffers.
 */
function StringReader(str) {
    this.data = str;
}

// Make StringReader a Stream
util.inherits(StringReader, Stream);

module.exports = StringReader;

/**
 * Create a "stream" that is "paused" by default. This gives 
 * plenty of opportunity to pass the reader to whatever necessary
 * and then <code>resume()</code> it.
 *
 * This will perform the following operations:
 * - Emit the (entire) string or buffer in one chunk.
 * - Emit the <code>end</code> event.
 * - Emit the <code>close</code> event.
 */
StringReader.prototype.open = 
StringReader.prototype.resume = function () {
    // If the data is a buffer and we have an encoding (from setEncoding)
    // then we convert the data to a String first.
    if (this.encoding && Buffer.isBuffer(this.data)) {
        this.emit('data', this.data.toString(this.encoding));
    }
    // Otherwise we jsut emit the data as it is
    else {
        this.emit('data', this.data);
    }
    // Otherwise we just emit the data as it is
    this.emit('end');
    this.emit('close');
}

/**
 * Set the encoding
 * 
 * - Primarily used for Buffers
 */
StringReader.prototype.setEncoding = function (encoding) {
    this.encoding = encoding;
}

/**
 * This is here for API completeness but will perform nothing.
 */
StringReader.prototype.pause = function () {
}

/**
 * Deletes the current set of data/buffer for the reader.
 */
StringReader.prototype.destroy = function () {
    delete this.data;
}
