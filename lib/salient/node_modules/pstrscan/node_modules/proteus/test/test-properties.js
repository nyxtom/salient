var should = require("should"),
    Proteus = require("proteus")
;

suite("Properties", function () {
    
    test("getPropertyNames", function () {
        var baseObj = {
                foo: "foo"
            },
            obj2 = Proteus.create(baseObj, {
                baz: "baz"
            }),
            obj3 = Proteus.create(obj2, {
                bar: "bar"
            }),
            props
        ;
        
        Proteus.defineGetter(obj3, "cho", function () {
            return "cho";
        }, {
            enumerable: false
        });
        
        props = Proteus.getPropertyNames(obj3);
        
        props.should.include("foo");
        props.should.include("baz");
        props.should.include("bar");
        props.should.not.include("cho");
    });

});
