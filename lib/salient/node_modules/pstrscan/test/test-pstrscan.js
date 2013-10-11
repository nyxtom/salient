/*globals suite, test */

var should = require("should"),
    Scanner = require("../");

function makeScanner (src) {
    return new Scanner(src);
}

suite("pstrscan", function () {
    
    test("#scan", function () {
        var s = makeScanner("Fri Dec 12 1975 14:39");
        s.scan(/Fri /).should.eql("Fri ");
        s.pos.should.eql(4);
        s.last.should.eql(0);
    });
    
    test("#reset", function () {
        var s = makeScanner("Fri Dec 12 1975 14:39");
        s.scan(/Fri /).should.eql("Fri ");
        
        s.reset();
        s.getPosition().should.eql(0);
        should.not.exist(s.getPreMatch());
        should.not.exist(s.getMatch());
        should.not.exist(s.getPostMatch());
        s.getRemainder().should.eql(s.getSource());
        s.scan(/Fri /).should.be.ok;
    });
    
    test("#scanChar", function () {
        var s = makeScanner("ab");
        
        s.scanChar().should.eql("a");
        s.scanChar().should.eql("b");
        s.scanChar().should.not.be.ok;
    });
    
    test("#peek", function () {
        var s = makeScanner("test string");
        s.peek(7).should.eql("test st");
        s.peek(7).should.eql("test st");
    });
    
    test("#scan with repetitions", function () {
        var s = makeScanner("test string");
        
        s.scan(/\w+/).should.eql("test");
        should.not.exist(s.scan(/\w+/));
        
        s.scan(/\s+/).should.eql(" ");
        s.getPreMatch().should.eql("test");
        s.getPostMatch().should.eql("string");
        should.not.exist(s.scan(/\s+/));
        
        s.scan(/\w+/).should.eql("string");
        should.not.exist(s.scan(/\w+/));
        
    });
    
    test("#scanUntil", function () {
        var s = makeScanner("Fri Dec 12 1975 14:39");
        
        s.scanUntil(/1/).should.eql("Fri Dec 1");
        s.getPreMatch().should.eql("Fri Dec ");
        
        s = makeScanner("abaabaaab");
        s.scanUntil(/b/).should.eql("ab");
        s.scanUntil(/b/).should.eql("aab");
        s.scanUntil(/b/).should.eql("aaab");
    });
    
    test("#skip/skipUntil", function () {
        var s = makeScanner("Fri Dec 12 1975 14:39");
        
        s.skip("Fri").should.eql(3);
        s.pos.should.eql(3);
        
        s.skipUntil("12").should.eql(7);
        s.pos.should.eql(10);
        
        s = makeScanner("test string");
        s.skip(/\w+/).should.eql(4);
        should.not.exist(s.skip(/\w+/));
        s.skip(/\s+/).should.eql(1);
        s.skip(/\w+/).should.eql(6);
        should.not.exist(s.skip(/./));
    });
    
    test("#check/checkUntil", function () {
        var s = makeScanner("Fri Dec 12 1975 14:39");
        
        s.check("Fri").should.eql(3);
        s.pos.should.eql(0);
        
        s.checkUntil(/\d{4}/).should.eql(15);
        s.pos.should.eql(0);
    });
    
    test("#unscan", function () {
        var s = makeScanner("test\nstring"),
            pos;
        
        s.scan(/\w+/).should.eql("test");
        s.unscan();
        s.pos.should.eql(0);
        
        s.scan(/../).should.eql("te");
        should.not.exist(s.scan(/\d/));
        
        s.unscan.should.throw();
    });
    
    test("#atBeginningOfLine", function () {
        var s = makeScanner("test\nstring");
        s.atBeginningOfLine().should.be.ok;
        s.scan(/test/);
        s.atBeginningOfLine().should.not.be.ok;
        s.scan(/\n/);
        s.atBeginningOfLine().should.be.ok;
        s.scan(/\w+/);
        s.terminate();
        s.atBeginningOfLine().should.be.ok;
    });
    
    test("termination", function () {
        var s = makeScanner("test string");
        s.hasTerminated().should.not.be.ok;
        s.scan(/test/);
        s.hasTerminated().should.not.be.ok;
        s.terminate();
        s.hasTerminated().should.be.ok;

        s.getPosition().should.eql(11);
        s.concat("abc");
        s.hasTerminated().should.not.be.ok;
        s.getRemainder().should.eql("abc");
        s.scan(/abc/).should.be.ok;
        s.getPosition().should.eql(14);
        s.hasTerminated().should.be.ok;
    });
});