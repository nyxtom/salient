
var should = require("should"),
    Proteus = require("proteus"),
    objA, objB, objC
;

suite("Object Create", function () {

    test("Loaded", function () {
        should.exist(Proteus);
        Proteus.should.be.a("object");
    });
    
    test("Create an object and add some properties", function () {
        objA = Proteus.create({
            init: function () {
                this.objA = true;
            },
            
            foo: "foo"
        });
        
        Proteus.defineProperty(objA, "baz", "baz");
        
        Proteus.defineProperty(objA, "_bar", "bar", {
            enumerable: false
        });
        Proteus.defineGetter(objA, "bar", function () { return this._bar; });
        Proteus.defineSetter(objA, "bar", function (v) { this._bar = v; });
        
        Proteus.defineProperty(objA, "_fiz", "fiz", {
            enumerable: false
        });
        
        Proteus.defineGetSet(objA, "fiz", function (v) {
            if (v) {
                this._fiz = v;
            }
            else {
                return this._fiz;
            }
        });
        
        objA.foo.should.eql("foo");
        objA.baz.should.eql("baz");
        objA.bar.should.eql("bar");
        objA.fiz.should.eql("fiz");
        
        objA.bar = "boo";
        objA.fiz = "fug";
        
        objA.bar.should.eql("boo");
        objA.fiz.should.eql("fug");
    });
    
    test("Extend an object", function () {
        objB = Proteus.create(objA, {
            init: function () {
                this.objB = true;
                Proteus.callProto(this, "init");
            },
            
            fuz: "fuz"
        });
        
        objB.init();
        
        objB.foo.should.eql("foo");
        objB.fuz.should.eql("fuz");
        objB.bar.should.eql("boo");
        objB.fiz.should.eql("fug");
        objB.objA.should.eql(true);
        objB.objB.should.eql(true);
    });
    
    test("Calling the objects overriden prototype method", function () {
        objC = Proteus.create(objB, {
            init: function () {
                this.objC = true;
                Proteus.callProto(this, "init");
            }
        });
        
        objC.init();
        
        objC.objA.should.eql(true);
        objC.objB.should.eql(true);
        objC.objC.should.eql(true);
    });
    
});
