
var should = require("should"),
    Proteus = require("proteus")
;

suite("Class make method", function () {

    test("make an instance", function () {
        var BaseClass = Proteus.Class.derive({
                init: function (x) {
                    this.x = x;
                }
            });
        
        var instance = BaseClass.make(10);
        (instance instanceof BaseClass).should.eql(true);
        
        var SubClass = BaseClass.derive({});
        
        instance = SubClass.make([10]);
        (instance instanceof SubClass).should.eql(true);
        (instance instanceof BaseClass).should.eql(true);
        
        instance.x.should.eql(10);
    });
    
});
