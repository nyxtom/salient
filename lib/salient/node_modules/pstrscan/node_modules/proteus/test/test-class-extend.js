
var should = require("should"),
    Proteus = require("proteus"),
    BaseClass = Proteus.Class.derive({
        foo: "foo"
    }),
    OtherClass = Proteus.Class.derive({
        self: {
            fuz: "fuz"
        },
        
        baz: "baz"
    })
;

suite("Class Extending", function () {

    test("Extend with other class", function () {
        var MyClass = Proteus.Class.derive({
                buz: "buz"
            });
        
        OtherClass.extend(MyClass);
        
        MyClass.fuz.should.eql("fuz");
    });
    
    test("Extend with object", function () {
        Proteus.extend(BaseClass, {
            name: "howdy",
            bug: "bug"
        });
        
        BaseClass.name.should.not.eql("howdy");
        BaseClass.bug.should.eql("bug");
    });
    
});
