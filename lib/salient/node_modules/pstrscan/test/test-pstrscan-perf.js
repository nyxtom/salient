/*globals suite, setup, test*/

(function () {
    var FS = require("fs"),
        should = require("should"),
        PStrScanner = require("../"),
        /**
         * Change the following value to increase the scanned text size.
         * Each increment adds 1024 characters.
         */
        files = parseInt(process.env["TEXT_MULTIPLE"], 10) || 1024,
        WORD_REGEX = /\w+/,
        SPACE_REGEX = /[\s,.]+/,
        StrScanner,
        txt,
        txtSize
    ;
    
    function benchmark (fn) {
        var bFn = function () {
                bFn.start = Date.now();
                fn();
                bFn.finish = Date.now();
                console.log(bFn.delta + " ms");
            }
        ;
        
        Object.defineProperty(bFn, "delta", {
            get: function () {
                return this.finish - this.start;
            }
        });
        
        return bFn;
    }
    
    function sourceText (mult) {
        var txt = FS.readFileSync(__dirname + "/sample.txt");
        mult = mult || 1;
        txt = Array(mult+1).join(txt);
        return txt;
    }

    // Can't run the performance comparison if the contender is not available
    try {
        StrScanner = require("strscan").StringScanner;
    }
    catch (e) {
        console.log("strscan not installed. Aborting performance test.");
        return;
    }
    
    [32, files].forEach(function (amt) {
        var txt = sourceText(amt),
            txtSize = txt.length
        ;
        
        suite(
            "#scanUntil for every word sequence within a string of " + txtSize + " characters",
            function () {
                test("strscan", benchmark(function () {
                    var s = new StrScanner(txt),
                        match
                    ;

                    while (!s.hasTerminated()) {
                        match = s.scanUntil(WORD_REGEX) || s.terminate();
                    }
                }));

                test("pstrscan", benchmark(function () {
                    var s = new PStrScanner(txt),
                        match
                    ;

                    while (!s.hasTerminated()) {
                        match = s.scanUntil(WORD_REGEX) || s.terminate();
                    }
                }));
            }
        );

        suite(
            "#scan alternate word or space sequence within a string of " + txtSize + " characters",
            function () {
                test("strscan", benchmark(function () {
                    var s = new StrScanner(txt),
                        match
                    ;

                    while (!s.hasTerminated()) {
                        match = s.scan(WORD_REGEX) || s.scan(SPACE_REGEX);
                    }
                }));

                test("pstrscan", benchmark(function () {
                    var s = new PStrScanner(txt),
                        match
                    ;

                    while (!s.eos) {
                        match = s.scan(WORD_REGEX) || s.scan(SPACE_REGEX);
                    }
                }));
            }
        );
    });

}());