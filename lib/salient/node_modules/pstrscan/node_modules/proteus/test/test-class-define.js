
var should = require("should"),
    Proteus = require("proteus")
;

suite("Class Definition", function () {

    test("Exists", function () {
        should.exist(Proteus);
        Proteus.Class.should.be.a("function");
        Proteus.Class.derive.should.be.a("function");
    });
    
    test("Create Class", function () {
        var BaseClass = Proteus.Class.derive({
            foo: "foo"
        });
        
        var instance = new BaseClass();
        
        BaseClass.__super__.should.eql(Proteus.Class.prototype);
        
        instance.foo.should.eql("foo");
    });
    
    test("Instance of", function () {
        var BaseClass = Proteus.Class.derive();
        var SubClass = BaseClass.derive();
        var instance = new SubClass();
        
        instance.should.be.an.instanceof(SubClass);
        instance.should.be.an.instanceof(BaseClass);
    });
    
});
