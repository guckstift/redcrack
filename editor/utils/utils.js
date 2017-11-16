include(function() {

	return {
	
		repeatString: function(s, n)
		{
			return new Array(n + 1).join(s);
		},

		clamp: function(minval, maxval, val)
		{
			return Math.max(minval, Math.min(maxval, val));
		},

		arrayReplace: function(array, start, count, insert)
		{
			Array.prototype.splice.apply(array, [start, count].concat(insert));
		},
	
	};

});
