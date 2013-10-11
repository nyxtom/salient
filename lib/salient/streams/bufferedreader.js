/**
 * Module imports
 */
var util = require('util');
var Stream = require('stream');
var Buffer = require('buffer').Buffer;

/**
 * Buffer a readable stream.
 *
 * Pass it a stream and use this as the stream. This buffers 
 * until open() is called, at which time it begins emitting 
 * all data until it is empty.
 *
 * This basically acts like the http.IncommingMessage that 
 * comes with node, with the exception that the stream is paused by 
 * default. Calling <code>open()</code> must be called to 
 * initially open the stream.
 *
 * This should not be used to hold large streams for long 
 * periods of time, as it consumes memory.
 */
function BufferedReader(stream) {
    Stream.call(this);
}
