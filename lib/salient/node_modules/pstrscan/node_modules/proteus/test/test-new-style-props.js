var should = require("should"),
    Proteus = require("proteus"),
    nutil   = require("util")
;

suite("New style properties", function () {

    test("a", function () {
        var obj = Proteus.create(Object.prototype, {
                foo: Proteus.prop("foo"),
                
                baz: {
                    get: function () {
                        
                    },
                    set: function () {
                        
                    }
                },
                
                _baz: Proteus.prop("baz").hidden()
            }),
            spec
        ;
        
        spec = Object.getOwnPropertyDescriptor(obj, "foo");
        
        spec.value.should.eql("foo");
        spec.enumerable.should.eql(true);
        spec.configurable.should.eql(true);
        
        spec = Object.getOwnPropertyDescriptor(obj, "baz");
        
        spec.enumerable.should.eql(false);
        spec.configurable.should.eql(false);
        spec.get.should.be.a("function");
        spec.set.should.be.a("function");

        spec = Object.getOwnPropertyDescriptor(obj, "_baz");
        
        spec.value.should.eql("baz");
        spec.enumerable.should.eql(false);
        spec.configurable.should.eql(true);
    });
});
