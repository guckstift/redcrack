include(function(oop) {

	return oop.defclass({
	
		ctor: function Comparable() {},
	
		compare: function(other)
		{
			throw "compare() is not implemented";
		},

		isEqual: function(other)
		{
			return this === other || this.compare(other) === 0;
		},

		isLower: function(other)
		{
			return this.compare(other) < 0;
		},

		isGreater: function(other)
		{
			return this.compare(other) > 0;
		},

		min: function(other)
		{
			return this.isLower(other) ? this : other;
		},

		max: function(other)
		{
			return this.isGreater(other) ? this : other;
		},
	
	});

});
