include(function() {

	return {
	
		isfunc: function(x)
		{
			return typeof x === "function";
		},
		
		isarray: function(x)
		{
			return Array.isArray(x);
		},
	
		defclass: function(proto)
		{
			var ctor = proto.ctor || function() {};
			var base = proto.base;
			var mixins = proto.mixins;
			var newProto = this.isfunc(base) ? this.create(base.prototype) : {};
			
			if(this.isarray(mixins)) {
				for(var i=0; i<mixins.length; i++) {
					this.mixin(newProto, mixins[i].prototype);
				}
			}
			
			ctor.prototype = this.mixin(newProto, proto);
			
			return ctor;
		},
		
		create: function(proto)
		{
			return Object.create(proto);
		},
		
		mixin: function(target, source)
		{
			for(var key in source) {
				if(source.hasOwnProperty(key)) {
					target[key] = source[key];
				}
			}
		
			return target;
		},

		bindmethods: function(self, methods)
		{
			for(var i=0; i<methods.length; i++) {
				self[methods[i]] = self[methods[i]].bind(self);
			}
		},
	
	};

});
