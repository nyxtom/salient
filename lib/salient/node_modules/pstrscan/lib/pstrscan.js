
(function () {
    
    var Proteus = require("proteus"),
        PClass  = Proteus.Class,
        BOL_REGEX = /[\r\n\f]/,
        PStrScan
    ;
    //-----------------------------------------------------------------------
    // Public
    //-----------------------------------------------------------------------
    PStrScan = PClass.derive(Object.defineProperties({
        
        init: function (src) {
            this.setSource(src);
        },
        //-------------------------------------------------------------------
        // Scanning
        //-------------------------------------------------------------------
        scan: function (pattern) {
            return this._scan(pattern, 1, 1, 1);
        },
        
        scanUntil: function (pattern) {
            return this._scan(pattern, 0, 1, 1);
        },
        
        scanChar: function () {
            var c = this.peek(),
                caps = [c];
            
            caps.index    = this.last = this.pos;
            this.pos      = this.pos + c.length;
            this.captures = caps;
            this.match    = c;
            
            this.hasTerminated();
            
            return c;
        },

        skip: function (pattern) {
            return this._scan(pattern, 1, 0, 1);
        },
        
        skipUntil: function (pattern) {
            return this._scan(pattern, 0, 0, 1);
        },
        //-------------------------------------------------------------------
        // Looking ahead
        //-------------------------------------------------------------------
        check: function (pattern) {
            return this._scan(pattern, 1, 0, 0);
        },
        
        checkUntil: function (pattern) {
            return this._scan(pattern, 0, 0, 0);
        },
        
        peek: function (count) {
            return this.source.substr(this.pos, count || 1);
        },
        //-------------------------------------------------------------------
        // Scanner Data
        //-------------------------------------------------------------------
        getSource: function () {
            return this.source;
        },
        
        setSource: function (src) {
            if (typeof src !== "undefined") {
                this.source = src.toString();
                this.reset();
            }
            return this;
        },
        
        getRemainder: function () {
            return this.source.slice(this.pos);
        },
        
        getPosition: function () {
            return this.pos;
        },
        
        setPosition: function (pos) {
            this.pos = pos;
            return this;
        },
        
        getPos: Proteus.aliasMethod("getPosition"),
        setPos: Proteus.aliasMethod("setPosition"),
        
        hasTerminated: function () {
            var eos = (this.eos = this.source ?
                        this.source.length <= this.pos :
                        true);
            return eos;
        },
        
        atBeginningOfLine: function () {
            return this.pos === 0 ||
                    this.pos === this.source.length ||
                    BOL_REGEX.test(this.source.charAt(this.pos-1));
        },
        
        atBOL: Proteus.aliasMethod("atBeginningOfLine"),
        //-------------------------------------------------------------------
        // Scanner Match Data
        //-------------------------------------------------------------------
        getPreMatch: function () {
            if (this.match) {
                return this.source.slice(0, this.last);
            }
            return null;
        },
        
        getMatch: function () {
            return this.match;
        },
        
        getPostMatch: function () {
            if (this.match) {
                return this.source.slice(this.pos);
            }
            return null;
        },
        
        getCapture: function (idx) {
            return this.captures[idx];
        },
        //-------------------------------------------------------------------
        // Scanner State
        //-------------------------------------------------------------------
        reset: function () {
            this.last = this.pos = 0;
            this.captures = this.match = null;
            this.hasTerminated();
            return this;
        },
        
        terminate: function () {
            this.pos = this.source.length;
            this.hasTerminated();
            return this;
        },
        
        concat: function (txt) {
            this.source += txt;
            this.hasTerminated();
            return this;
        },
        
        unscan: function () {
            if (this.match) {
                this.captures = this.match = null;
                this.pos = this.last;
                this.last = 0;
            }
            else {
                throw new Error(
                    "PStringScanner#unscan: No previous match."
                );
            }
        }
        
    }, 
    //-----------------------------------------------------------------------
    // Private
    //-----------------------------------------------------------------------
    {
        _scan: { value: function (pattern, atPos, asStr, advance) {
            var pos = this.pos,
                src, result, match, matchStart, matchEnd;
            // coerce a string to a regular expression
            pattern = pattern.source ? pattern : new RegExp(pattern);

            src = this.source;
            result = pattern.exec(src.slice(pos));

            if (result && (!atPos || (atPos && result.index === 0))) {
                // TODO: capture the following in an updateState function
                // but, test the performance impact an extra function call
                // might cause.
                this.captures = result;
                this.match = match = result[0];
                matchStart = result.index;
                matchEnd = matchStart + match.length;

                if (advance) {
                    this.last = atPos ? pos : pos + matchStart;
                    this.pos = pos + match.length + (atPos ? 0 : matchStart);
                }

                this.eos = this.pos >= src.length;

                match = atPos ? match : result.input.slice(0, matchEnd);
                return asStr ? match : match.length;
            }

            return (this.captures = this.match = null);
        } }
    }));
    //-----------------------------------------------------------------------
    // Exports
    //-----------------------------------------------------------------------
    if (typeof module !== "undefined") {
        module.exports = PStrScan;
    }
    else {
        this.PStringScanner = PStrScan;
    }
    
}());